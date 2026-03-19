import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Simulation.css';

const DIFFICULTY_COLOR = { easy: '#00ff88', medium: '#ffd700', hard: '#ff2d55' };
const DIFFICULTY_LABEL = { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD' };

// Danger level badge colors
const DANGER_COLORS = {
  safe: '#00ff88',
  medium: '#ffd700',
  critical: '#ff2d55'
};

function BreachOverlay({ visible, onDismiss }) {
  if (!visible) return null;
  return (
    <div className="breach-overlay" onClick={onDismiss}>
      <div className="breach-content">
        <div className="breach-icon">💀</div>
        <div className="breach-title">SYSTEM BREACH</div>
        <div className="breach-subtitle">INCORRECT ACTION DETECTED</div>
        <div className="breach-sub2">Click to continue</div>
      </div>
    </div>
  );
}

function SuccessOverlay({ visible, xpEarned, onDismiss, newBadges }) {
  if (!visible) return null;
  return (
    <div className="success-overlay" onClick={onDismiss}>
      <div className="success-content">
        <div className="success-icon">🛡️</div>
        <div className="success-title">THREAT NEUTRALIZED</div>
        <div className="success-xp">+{xpEarned} XP</div>
        {newBadges?.length > 0 && (
          <div className="success-badges">
            {newBadges.map(b => (
              <div key={b.id} className="success-badge">
                {b.icon} {b.name} unlocked!
              </div>
            ))}
          </div>
        )}
        <div className="success-sub">Click to continue</div>
      </div>
    </div>
  );
}

function ChatMessage({ msg }) {
  return (
    <div className={`sim-chat-msg ${msg.sender === 'attacker' ? 'attacker' : 'system'}`}>
      <div className="sim-chat-avatar">{msg.avatar}</div>
      <div className="sim-chat-bubble">
        <div className="sim-chat-sender">{msg.sender === 'attacker' ? 'ATTACKER' : 'SYSTEM'}</div>
        <div className="sim-chat-text">{msg.text}</div>
        {msg.red_flags && (
          <div className="sim-red-flags">
            {msg.red_flags.map(f => (
              <span key={f} className="red-flag-tag">⚠ {f.replace(/_/g, ' ')}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ClaudeAnalysis({ analysis, loading }) {
  return (
    <div className="claude-panel">
      <div className="claude-panel-header">
        <span className="claude-panel-icon">🤖</span>
        <span className="claude-panel-title">AI THREAT ANALYST</span>
        <span className="claude-panel-badge">POWERED BY CLAUDE</span>
      </div>
      <div className="claude-panel-body">
        {loading ? (
          <div className="claude-loading">
            <div className="claude-dots">
              <span /><span /><span />
            </div>
            <span>Analyzing threat vectors...</span>
          </div>
        ) : analysis ? (
          <div className="claude-text">{analysis}</div>
        ) : (
          <div className="claude-idle">
            Make your decision. The AI analyst will evaluate your response.
          </div>
        )}
      </div>
    </div>
  );
}

export default function Simulation() {
  const { levelId, taskId } = useParams();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState(null);
  const [taskMeta, setTaskMeta] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { result, xpDelta, feedback, ... }
  const [claudeAnalysis, setClaudeAnalysis] = useState('');
  const [claudeLoading, setClaudeLoading] = useState(false);
  const [showBreach, setShowBreach] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [riskMeter, setRiskMeter] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const resultRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get(`/simulation/${levelId}/${taskId}`),
      api.get('/progress')
    ])
      .then(([simRes, progRes]) => {
        setScenario(simRes.data.scenario);
        setTaskMeta(simRes.data.taskMeta);
        setProgress(progRes.data.progress);
        setRiskMeter(progRes.data.progress.riskMeter ?? 0);
        setAttemptsLeft(simRes.data.taskMeta.maxAttempts - simRes.data.taskMeta.attempts);
      })
      .catch(() => navigate(`/arena/level/${levelId}`))
      .finally(() => setLoading(false));
  }, []);

  // Ask Claude for threat analysis AFTER the user sees the scenario
  const fetchClaudeAnalysis = async (scenarioData) => {
    setClaudeLoading(true);
    try {
      const response = await fetch('/api/claude-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scenarioTitle: scenarioData.title,
          threatType: scenarioData.threat_type,
          briefing: scenarioData.briefing,
          environmentText: JSON.stringify(scenarioData.environment)
        })
      });
      const data = await response.json();
      setClaudeAnalysis(data.analysis ?? '');
    } catch {
      setClaudeAnalysis('Threat analysis temporarily unavailable. Trust your training.');
    } finally {
      setClaudeLoading(false);
    }
  };

  useEffect(() => {
    if (scenario) {
      fetchClaudeAnalysis(scenario);
    }
  }, [scenario]);

  const handleAction = async (actionId) => {
    if (submitting || result?.result === 'correct') return;
    setSelectedAction(actionId);
    setSubmitting(true);

    try {
      const res = await api.post('/progress/action', {
        levelId: Number(levelId),
        taskId,
        action: actionId
      });

      const data = res.data;
      setResult(data);
      setRiskMeter(data.riskMeter ?? riskMeter);
      await refreshUser();

      if (attemptsLeft > 0) {
        setAttemptsLeft(prev => data.result === 'correct' ? prev : Math.max(0, prev - 1));
      }

      // Get Claude's detailed post-action explanation
      setClaudeLoading(true);
      try {
        const claudeRes = await fetch('/api/claude-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            scenarioTitle: scenario.title,
            threatType: scenario.threat_type,
            actionTaken: actionId,
            result: data.result,
            feedback: data.feedback,
            xpEarned: data.xpDelta,
            levelId,
            taskId
          })
        });
        const claudeData = await claudeRes.json();
        setClaudeAnalysis(claudeData.analysis ?? data.feedback);
      } catch {
        setClaudeAnalysis(data.feedback);
      } finally {
        setClaudeLoading(false);
      }

      // Show overlay
      setTimeout(() => {
        if (data.result === 'correct' || data.result === 'partial') {
          setShowSuccess(true);
        } else {
          setShowBreach(true);
        }
      }, 600);

      // Scroll to result
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);

    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBreachDismiss = () => {
    setShowBreach(false);
    if (result?.taskStatus === 'failed' || attemptsLeft <= 0) {
      navigate(`/arena/level/${levelId}`);
    } else {
      // Reset for retry
      setResult(null);
      setSelectedAction(null);
    }
  };

  const handleSuccessDismiss = () => {
    setShowSuccess(false);
    if (result?.levelCompleted) {
      navigate('/arena');
    } else {
      navigate(`/arena/level/${levelId}`);
    }
  };

  if (loading) {
    return (
      <div className="sim-page">
        <Navbar progress={progress} />
        <div className="sim-loading">
          <div className="boot-spinner" />
          <span>LOADING MISSION...</span>
        </div>
      </div>
    );
  }

  if (!scenario) return null;

  const isActionable = !result || result.result === 'wrong';
  const canRetry = attemptsLeft > 0 && result?.result === 'wrong';

  return (
    <div className="sim-page" style={{ '--level-color': getLevelColor(levelId) }}>
      <Navbar progress={progress} />

      <BreachOverlay visible={showBreach} onDismiss={handleBreachDismiss} />
      <SuccessOverlay visible={showSuccess} xpEarned={result?.xpDelta} newBadges={result?.newBadges} onDismiss={handleSuccessDismiss} />

      <div className="sim-layout">
        {/* LEFT — Scenario panel */}
        <div className="sim-left">
          {/* Breadcrumb + metadata */}
          <div className="sim-breadcrumb">
            <button onClick={() => navigate('/arena')} className="sim-back-link">ARENA</button>
            <span className="sim-bread-sep">/</span>
            <button onClick={() => navigate(`/arena/level/${levelId}`)} className="sim-back-link">LEVEL {levelId}</button>
            <span className="sim-bread-sep">/</span>
            <span style={{ color: 'var(--text-primary)' }}>MISSION</span>
          </div>

          <div className="sim-header">
            <div className="sim-meta-row">
              <span className="sim-threat-badge">{scenario.threat_type}</span>
              <span
                className="sim-diff-badge"
                style={{ color: DIFFICULTY_COLOR[scenario.difficulty] }}
              >
                {DIFFICULTY_LABEL[scenario.difficulty]}
              </span>
              <span className="sim-xp-badge">⚡ {scenario.xp_available} XP</span>
            </div>
            <h1 className="sim-title">{scenario.title}</h1>
            <div className="sim-briefing">{scenario.briefing}</div>
          </div>

          {/* Attempts remaining */}
          <div className="sim-attempts">
            <span className="sim-attempts-label">RETAKES:</span>
            {Array.from({ length: taskMeta?.maxAttempts ?? 3 }).map((_, i) => (
              <div key={i} className={`attempt-indicator ${i < attemptsLeft ? 'live' : 'used'}`} />
            ))}
            <span className="sim-attempts-count">{attemptsLeft}/3 remaining</span>
          </div>

          {/* Environment simulation */}
          <SimEnvironment scenario={scenario} />

          {/* Hints */}
          {scenario.hints && (
            <div className="sim-hints">
              <div className="sim-hints-title">🔍 INTEL HINTS</div>
              {scenario.hints.map((h, i) => (
                <div key={i} className="sim-hint-item">
                  <span className="hint-num">{String(i + 1).padStart(2, '0')}</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Decision panel */}
        <div className="sim-right">
          {/* Risk meter */}
          <div className="sim-risk">
            <div className="sim-risk-label">SYSTEM RISK LEVEL</div>
            <div className="sim-risk-track">
              <div
                className="sim-risk-fill"
                style={{
                  width: `${riskMeter}%`,
                  background: riskMeter > 70 ? 'var(--accent-red)' : riskMeter > 40 ? 'var(--accent-orange)' : 'var(--accent-green)'
                }}
              />
            </div>
            <div className="sim-risk-val">{riskMeter}%</div>
          </div>

          {/* Claude AI analyst */}
          <ClaudeAnalysis analysis={claudeAnalysis} loading={claudeLoading} />

          {/* Action choices */}
          <div className="sim-actions-panel">
            <div className="sim-actions-title">⚡ YOUR DECISION</div>
            <div className="sim-actions-subtitle">
              Choose your defensive action. Every decision has consequences.
            </div>

            <div className="sim-actions-grid">
              {scenario.available_actions.map((action) => {
                const isSelected = selectedAction === action.id;
                const isCorrect = isSelected && result?.result === 'correct';
                const isPartial = isSelected && result?.result === 'partial';
                const isWrong = isSelected && result?.result === 'wrong';

                return (
                  <button
                    key={action.id}
                    className={`sim-action-btn
                      ${action.danger_level}
                      ${isSelected ? 'selected' : ''}
                      ${isCorrect ? 'correct' : ''}
                      ${isPartial ? 'partial' : ''}
                      ${isWrong ? 'wrong' : ''}
                    `}
                    onClick={() => isActionable && handleAction(action.id)}
                    disabled={submitting || (!isActionable && !canRetry)}
                  >
                    <span className="action-icon">{action.icon}</span>
                    <span className="action-label">{action.label}</span>
                    <span
                      className="action-danger-dot"
                      style={{ background: DANGER_COLORS[action.danger_level] ?? '#888' }}
                    />
                    {isCorrect && <span className="action-result-tag correct-tag">✓ CORRECT</span>}
                    {isPartial && <span className="action-result-tag partial-tag">~ PARTIAL</span>}
                    {isWrong && <span className="action-result-tag wrong-tag">✗ BREACH</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result feedback */}
          {result && !showBreach && !showSuccess && (
            <div
              ref={resultRef}
              className={`sim-feedback ${result.result}`}
            >
              <div className="sim-feedback-header">
                {result.result === 'correct' && '✅ THREAT NEUTRALIZED'}
                {result.result === 'partial' && '⚠️ PARTIAL DEFENSE'}
                {result.result === 'wrong' && '💀 SYSTEM BREACHED'}
              </div>
              <div className="sim-feedback-text">{result.feedback}</div>
              <div className="sim-feedback-xp">
                {result.xpDelta > 0 ? `+${result.xpDelta} XP earned` : 'No XP awarded'}
              </div>
              {result.result === 'wrong' && attemptsLeft > 0 && (
                <button className="sim-retry-btn" onClick={() => { setResult(null); setSelectedAction(null); }}>
                  RETRY MISSION ({attemptsLeft} attempts left) →
                </button>
              )}
              {result.result === 'wrong' && attemptsLeft <= 0 && (
                <div className="sim-out-of-retakes">No retakes remaining. Mission failed.</div>
              )}
              <div className="sim-learning">
                <div className="sim-learning-title">📚 WHAT YOU LEARNED</div>
                <div>{scenario.learning_outcome}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SimEnvironment({ scenario }) {
  const env = scenario.environment;

  if (env.type === 'chat_interface') {
    return (
      <div className="sim-env chat-env">
        <div className="sim-env-title">💬 LIVE CHAT INTERFACE</div>
        <div className="sim-chat-window">
          {env.messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
        </div>
      </div>
    );
  }

  if (env.type === 'email_interface') {
    const email = env.email;
    return (
      <div className="sim-env email-env">
        <div className="sim-env-title">📧 EMAIL CLIENT</div>
        <div className="sim-email-window">
          <div className="email-field"><span>FROM:</span> <span className="email-suspect">{email.from}</span></div>
          <div className="email-field"><span>TO:</span> <span>{email.to}</span></div>
          <div className="email-field"><span>SUBJECT:</span> <span className="email-subject">{email.subject}</span></div>
          <div className="email-body">{email.body}</div>
          {email.attachment && (
            <div className="email-attachment">
              📎 {email.attachment.name} ({email.attachment.size})
              <span className="attachment-warning"> ⚠ SUSPICIOUS EXTENSION</span>
            </div>
          )}
          {email.red_flags && (
            <div className="email-flags">
              {email.red_flags.map(f => (
                <span key={f} className="red-flag-tag">⚠ {f.replace(/_/g, ' ')}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (env.type === 'dashboard_interface') {
    const alerts = env.alerts || env.active_threats || [];
    return (
      <div className="sim-env dashboard-env">
        <div className="sim-env-title">📊 SECURITY DASHBOARD</div>
        <div className="sim-dashboard">
          {alerts.map((a, i) => (
            <div key={i} className={`dash-alert ${a.severity ?? 'medium'}`}>
              <span className="dash-alert-sev">{(a.severity ?? 'THREAT').toUpperCase()}</span>
              <span className="dash-alert-msg">{a.message ?? `${a.channel}: ${a.type}`}</span>
            </div>
          ))}
          {env.scope && (
            <div className="dash-scope">
              <span>Affected: <strong>{env.scope.affected_systems}</strong> of {env.scope.total_systems} systems</span>
              <span>Critical: <strong style={{ color: 'var(--accent-red)' }}>{env.scope.critical_systems_affected}</strong></span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (env.type === 'phone_interface') {
    return (
      <div className="sim-env phone-env">
        <div className="sim-env-title">📞 INCOMING CALL</div>
        <div className="sim-phone-window">
          <div className="phone-caller-id">
            <div className="phone-avatar">?</div>
            <div>
              <div className="phone-name">Unknown Caller</div>
              <div className="phone-number">{env.caller_id}</div>
            </div>
          </div>
          {env.transcript.map((line, i) => (
            <div key={i} className="phone-transcript-line">{line}</div>
          ))}
          {env.red_flags && (
            <div className="email-flags">
              {env.red_flags.map(f => <span key={f} className="red-flag-tag">⚠ {f.replace(/_/g, ' ')}</span>)}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (env.type === 'scenario_panel') {
    return (
      <div className="sim-env scenario-env">
        <div className="sim-env-title">🎭 SCENARIO</div>
        <div className="sim-scenario-window">
          <div className="scenario-situation">{env.situation}</div>
          <div className="scenario-dialogue">"{env.dialogue}"</div>
          {env.red_flags && (
            <div className="email-flags">
              {env.red_flags.map(f => <span key={f} className="red-flag-tag">⚠ {f.replace(/_/g, ' ')}</span>)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Terminal, voice, video
  return (
    <div className="sim-env generic-env">
      <div className="sim-env-title">🖥️ ENVIRONMENT</div>
      <pre className="sim-generic-body">{JSON.stringify(env, null, 2)}</pre>
    </div>
  );
}

function getLevelColor(levelId) {
  const colors = { '1': '#00d4ff', '2': '#00ff88', '3': '#9b5de5', '4': '#ff2d55' };
  return colors[String(levelId)] ?? '#00d4ff';
}
