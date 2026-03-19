import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import './LevelMap.css';

const LEVEL_META = {
  1: { title: 'SOCIAL ENGINEERING', icon: '🎭', color: '#00d4ff', code: 'SE-01' },
  2: { title: 'PHISHING', icon: '🎣', color: '#00ff88', code: 'PH-02' },
  3: { title: 'AI SCAMS', icon: '🤖', color: '#9b5de5', code: 'AI-03' },
  4: { title: 'MALWARE ATTACKS', icon: '🦠', color: '#ff2d55', code: 'MW-04' }
};

const TASK_META = {
  l1t1_easy:   { title: 'The Helpdesk Impostor',         difficulty: 'easy',   xp: 30 },
  l1t2_easy:   { title: 'The Executive Phone Call',       difficulty: 'easy',   xp: 30 },
  l1t3_medium: { title: 'The Suspicious Internal Email',  difficulty: 'medium', xp: 45 },
  l1t4_medium: { title: 'The New Vendor Badge Request',   difficulty: 'medium', xp: 45 },
  l1t5_hard:   { title: 'The Long-Game Manipulator',      difficulty: 'hard',   xp: 60 },
  l2t1_easy:   { title: 'The Fake HR Email',              difficulty: 'easy',   xp: 50 },
  l2t2_easy:   { title: 'The Suspicious Package',         difficulty: 'easy',   xp: 50 },
  l2t3_medium: { title: 'The CEO Wire Transfer',          difficulty: 'medium', xp: 75 },
  l2t4_medium: { title: 'The Invoice Attachment Trap',    difficulty: 'medium', xp: 75 },
  l2t5_hard:   { title: 'The Spear Phishing Campaign',    difficulty: 'hard',   xp: 100 },
  l3t1_easy:   { title: 'The CEO Deepfake Voice',         difficulty: 'easy',   xp: 75 },
  l3t2_easy:   { title: 'The AI Chatbot Trick',           difficulty: 'easy',   xp: 75 },
  l3t3_medium: { title: 'The Deepfake Video Call',        difficulty: 'medium', xp: 112 },
  l3t4_medium: { title: 'The AI Recruitment Scam',        difficulty: 'medium', xp: 112 },
  l3t5_hard:   { title: 'AI Multi-Vector Attack',         difficulty: 'hard',   xp: 150 },
  l4t1_easy:   { title: 'The Suspicious Process Alert',   difficulty: 'easy',   xp: 100 },
  l4t2_easy:   { title: 'The Ransomware Precursor',       difficulty: 'easy',   xp: 100 },
  l4t3_medium: { title: 'The Fileless Malware Hunt',      difficulty: 'medium', xp: 150 },
  l4t4_medium: { title: 'The Supply Chain Compromise',    difficulty: 'medium', xp: 150 },
  l4t5_hard:   { title: 'The APT Encounter',              difficulty: 'hard',   xp: 200 }
};

const DIFFICULTY_COLOR = { easy: '#00ff88', medium: '#ffd700', hard: '#ff2d55' };

// Task positions on the mini-map (relative %)
const TASK_POSITIONS = [
  { x: 15, y: 70 },
  { x: 35, y: 40 },
  { x: 55, y: 65 },
  { x: 72, y: 30 },
  { x: 88, y: 58 }
];

function TaskNode({ task, meta, config, position, index, onClick }) {
  const isCompleted = task.status === 'completed';
  const isAvailable = task.status === 'available' || task.status === 'in_progress';
  const isLocked = task.status === 'locked';
  const attemptsLeft = task.maxAttempts - task.attempts;
  const isFailed = task.status === 'failed';

  return (
    <div
      className={`task-node ${isAvailable ? 'available' : ''} ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''} ${isFailed ? 'failed' : ''}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        '--task-color': isCompleted ? '#00ff88' : isFailed ? '#ff2d55' : isAvailable ? config.color : '#2a3a4a',
        animationDelay: `${index * 0.12}s`
      }}
      onClick={() => isAvailable && onClick(task.taskId)}
    >
      {isAvailable && !isCompleted && <div className="task-pulse" />}

      <div className="task-hexagon">
        <div className="task-inner">
          {isCompleted ? <span className="task-check">✓</span> :
           isFailed ? <span className="task-fail">✗</span> :
           isLocked ? <span className="task-lock">🔒</span> :
           <span className="task-num">{String(index + 1).padStart(2, '0')}</span>}
        </div>
      </div>

      <div className="task-label">
        <div className="task-title-text">{meta?.title ?? task.taskId}</div>
        <div className="task-meta-row">
          <span
            className="task-diff-badge"
            style={{ color: DIFFICULTY_COLOR[meta?.difficulty] ?? '#aaa' }}
          >
            {(meta?.difficulty ?? 'easy').toUpperCase()}
          </span>
          <span className="task-xp-badge">⚡{meta?.xp ?? 0} XP</span>
        </div>
        {isAvailable && !isCompleted && (
          <div className="task-attempts-left">
            {Array.from({ length: task.maxAttempts }).map((_, i) => (
              <div key={i} className={`attempt-dot ${i < attemptsLeft ? 'active' : 'used'}`} />
            ))}
          </div>
        )}
        {isCompleted && <div className="task-xp-earned">+{task.xpEarned} XP EARNED</div>}
        {isFailed && <div className="task-failed-text">NO RETAKES LEFT</div>}
      </div>

      {isAvailable && (
        <div className="task-tooltip">
          <div style={{ color: config.color, fontFamily: 'var(--font-display)', fontSize: '0.7rem', marginBottom: '0.4rem' }}>
            {meta?.title}
          </div>
          <div style={{ color: '#7ba7c4', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
            Difficulty: <span style={{ color: DIFFICULTY_COLOR[meta?.difficulty] }}>{meta?.difficulty?.toUpperCase()}</span>
          </div>
          <div style={{ color: '#7ba7c4', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
            Max XP: ⚡{meta?.xp}
          </div>
          <div style={{ color: '#3d6480', fontSize: '0.6rem' }}>Retakes remaining: {attemptsLeft}/3</div>
          <div style={{ color: config.color, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', marginTop: '0.5rem' }}>
            CLICK TO BEGIN →
          </div>
        </div>
      )}
    </div>
  );
}

export default function LevelMap() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const meta = LEVEL_META[Number(levelId)];

  useEffect(() => {
    api.get('/progress')
      .then(res => setProgress(res.data.progress))
      .catch(() => navigate('/arena'))
      .finally(() => setLoading(false));
  }, []);

  const level = progress?.levels?.find(l => l.levelId === Number(levelId));

  // Security: redirect if level is locked
  useEffect(() => {
    if (progress && level?.status === 'locked') {
      navigate('/arena');
    }
  }, [progress, level]);

  const handleTaskClick = (taskId) => {
    navigate(`/arena/level/${levelId}/task/${taskId}`);
  };

  return (
    <div className="levelmap-page" style={{ '--level-color': meta?.color }}>
      <Navbar progress={progress} />

      <div className="levelmap-bg">
        <div className="levelmap-grid" />
        <div className="levelmap-vignette" />
      </div>

      {/* Header */}
      <div className="levelmap-header">
        <button className="back-btn" onClick={() => navigate('/arena')}>
          ← OPERATIONS MAP
        </button>
        <div className="levelmap-title-block">
          <span className="levelmap-code">{meta?.code}</span>
          <span className="levelmap-icon">{meta?.icon}</span>
          <h1 className="levelmap-title" style={{ color: meta?.color }}>{meta?.title}</h1>
        </div>
        <div className="levelmap-subtitle">
          Complete all 5 missions to unlock the next threat domain
        </div>
      </div>

      {loading ? (
        <div className="levelmap-loading">
          <div className="boot-spinner" />
          <span>LOADING MISSION DATA...</span>
        </div>
      ) : (
        <>
          {/* Path between tasks */}
          <div className="levelmap-paths">
            <svg className="level-path-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="task-path-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={meta?.color ?? '#00d4ff'} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={meta?.color ?? '#00d4ff'} stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {TASK_POSITIONS.slice(0, -1).map((pos, i) => {
                const next = TASK_POSITIONS[i + 1];
                const task = level?.tasks?.[i + 1];
                const isActive = task?.status !== 'locked';
                return (
                  <path
                    key={i}
                    d={`M ${pos.x} ${pos.y} Q ${(pos.x + next.x) / 2} ${(pos.y + next.y) / 2 - 6} ${next.x} ${next.y}`}
                    stroke={isActive ? `url(#task-path-grad)` : '#1a2a3a'}
                    strokeWidth="0.6"
                    fill="none"
                    strokeDasharray={isActive ? undefined : '1.5,1.5'}
                    opacity={isActive ? 0.9 : 0.5}
                  />
                );
              })}
            </svg>
          </div>

          {/* Task nodes */}
          <div className="levelmap-map">
            {level?.tasks?.map((task, i) => (
              <TaskNode
                key={task.taskId}
                task={task}
                meta={TASK_META[task.taskId]}
                config={meta}
                position={TASK_POSITIONS[i]}
                index={i}
                onClick={handleTaskClick}
              />
            ))}
          </div>

          {/* Level stats */}
          <div className="levelmap-stats">
            <div className="level-stat">
              <span className="level-stat-val">
                {level?.tasks?.filter(t => t.status === 'completed').length ?? 0}/5
              </span>
              <span className="level-stat-lbl">COMPLETED</span>
            </div>
            <div className="level-stat">
              <span className="level-stat-val" style={{ color: 'var(--accent-gold)' }}>
                {level?.xpEarned ?? 0}
              </span>
              <span className="level-stat-lbl">XP EARNED</span>
            </div>
            <div className="level-stat">
              <span className="level-stat-val" style={{ color: 'var(--accent-red)' }}>
                {level?.tasks?.filter(t => t.status === 'failed').length ?? 0}
              </span>
              <span className="level-stat-lbl">FAILED</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
