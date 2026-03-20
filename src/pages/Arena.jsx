import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import './Arena.css';

const LEVEL_CONFIG = [
  {
    id: 1,
    title: 'SOCIAL ENGINEERING',
    code: 'SE-01',
    icon: '🎭',
    description: 'Master the art of detecting human manipulation and identity deception.',
    color: '#00d4ff',
    glowColor: 'rgba(0,212,255,0.3)',
    position: { x: 18, y: 72 },
    threat: 'Pretexting · Vishing · Tailgating'
  },
  {
    id: 2,
    title: 'PHISHING',
    code: 'PH-02',
    icon: '🎣',
    description: 'Identify and neutralize email-based attacks and malicious links.',
    color: '#00ff88',
    glowColor: 'rgba(0,255,136,0.3)',
    position: { x: 38, y: 42 },
    threat: 'BEC · Spear Phishing · Attachments'
  },
  {
    id: 3,
    title: 'AI SCAMS',
    code: 'AI-03',
    icon: '🤖',
    description: 'Defeat deepfake voices, AI-cloned identities, and synthetic media attacks.',
    color: '#9b5de5',
    glowColor: 'rgba(155,93,229,0.3)',
    position: { x: 60, y: 62 },
    threat: 'Deepfakes · Voice Cloning · AI Bots'
  },
  {
    id: 4,
    title: 'MALWARE ATTACKS',
    code: 'MW-04',
    icon: '🦠',
    description: 'Hunt and contain advanced malware, ransomware and APT intrusions.',
    color: '#ff2d55',
    glowColor: 'rgba(255,45,85,0.3)',
    position: { x: 80, y: 30 },
    threat: 'Ransomware · APT · Fileless'
  }
];

function HexGrid() {
  return (
    <svg className="arena-hexgrid" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
      {Array.from({ length: 60 }).map((_, i) => {
        const col = i % 10;
        const row = Math.floor(i / 10);
        const x = col * 130 + (row % 2 === 0 ? 0 : 65);
        const y = row * 110;
        return (
          <polygon
            key={i}
            points="65,0 130,32.5 130,97.5 65,130 0,97.5 0,32.5"
            transform={`translate(${x - 10}, ${y - 20})`}
            fill="none"
            stroke="rgba(0,212,255,0.04)"
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}

function PathLine({ from, to, active }) {
  const x1 = `${from.x}%`;
  const y1 = `${from.y}%`;
  const x2 = `${to.x}%`;
  const y2 = `${to.y}%`;
  const mx = `${(from.x + to.x) / 2}%`;
  const my = `${(from.y + to.y) / 2 - 10}%`;

  return (
    <svg className="arena-path-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`path-grad-${from.x}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={active ? '#00d4ff' : '#1a3a4a'} />
          <stop offset="100%" stopColor={active ? '#00ff88' : '#1a3a4a'} />
        </linearGradient>
        {active && (
          <filter id="path-glow">
            <feGaussianBlur stdDeviation="0.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        )}
      </defs>
      <path
        d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${(from.y + to.y) / 2 - 8} ${to.x} ${to.y}`}
        stroke={`url(#path-grad-${from.x})`}
        strokeWidth={active ? '0.5' : '0.3'}
        fill="none"
        strokeDasharray={active ? 'none' : '2,2'}
        opacity={active ? 1 : 0.4}
        filter={active ? 'url(#path-glow)' : undefined}
        style={active ? { animation: 'path-glow 2s ease-in-out infinite' } : {}}
      />
    </svg>
  );
}

function LevelNode({ level, config, onClick, isUnlocked, isCompleted, index }) {
  const tasksDone = level?.tasks?.filter(t => t.status === 'completed').length ?? 0;
  const tasksTotal = level?.tasks?.length ?? 5;

  return (
    <div
      className={`level-node ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''}`}
      style={{
        left: `${config.position.x}%`,
        top: `${config.position.y}%`,
        '--level-color': config.color,
        '--level-glow': config.glowColor,
        animationDelay: `${index * 0.15}s`
      }}
      onClick={() => isUnlocked && onClick(config.id)}
      onTouchEnd={(e) => { e.preventDefault(); isUnlocked && onClick(config.id); }}
    >
      {/* Pulse ring */}
      {isUnlocked && !isCompleted && <div className="node-pulse-ring" />}
      {isCompleted && <div className="node-complete-ring" />}

      {/* Main node */}
      <div className="node-hexagon">
        <div className="node-inner">
          {isUnlocked ? (
            <>
              <div className="node-icon">{config.icon}</div>
              <div className="node-code">{config.code}</div>
            </>
          ) : (
            <div className="node-lock">🔒</div>
          )}
        </div>
      </div>

      {/* Label */}
      <div className="node-label">
        <div className="node-title">{config.title}</div>
        {isUnlocked && (
          <div className="node-progress">
            <div className="node-progress-bar">
              <div className="node-progress-fill" style={{ width: `${(tasksDone / tasksTotal) * 100}%` }} />
            </div>
            <span className="node-progress-text">{tasksDone}/{tasksTotal}</span>
          </div>
        )}
        {!isUnlocked && <div className="node-locked-text">COMPLETE LEVEL {config.id - 1} TO UNLOCK</div>}
        {isCompleted && <div className="node-completed-badge">✓ CLEARED</div>}
      </div>

      {/* Hover tooltip */}
      {isUnlocked && (
        <div className="node-tooltip">
          <div className="tooltip-title">{config.title}</div>
          <div className="tooltip-desc">{config.description}</div>
          <div className="tooltip-threats">{config.threat}</div>
          <div className="tooltip-cta">CLICK TO ENTER →</div>
        </div>
      )}
    </div>
  );
}

export default function Arena() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/progress')
      .then(res => setProgress(res.data.progress))
      .catch((err) => {
        console.error('Progress fetch failed:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const getLevelStatus = (levelId) => {
    if (!progress) return { isUnlocked: levelId === 1, isCompleted: false };
    const lvl = progress.levels.find(l => l.levelId === levelId);
    return {
      isUnlocked: lvl?.status !== 'locked',
      isCompleted: lvl?.status === 'completed',
      level: lvl
    };
  };

  return (
    <div className="arena-page">
      <Navbar progress={progress} />

      <div className="arena-bg">
        <HexGrid />
        <div className="arena-grid-overlay" />
        <div className="arena-vignette" />
      </div>

      {/* Paths between nodes */}
      <div className="arena-paths">
        {LEVEL_CONFIG.slice(0, -1).map((cfg, i) => {
          const nextCfg = LEVEL_CONFIG[i + 1];
          const { isUnlocked: nextUnlocked } = getLevelStatus(nextCfg.id);
          return (
            <PathLine
              key={i}
              from={cfg.position}
              to={nextCfg.position}
              active={nextUnlocked}
            />
          );
        })}
      </div>

      {/* Header */}
      <div className="arena-header">
        <div className="arena-header-sub">// MISSION BRIEFING //</div>
        <h1 className="arena-title">CYBER OPERATIONS MAP</h1>
        <div className="arena-header-desc">
          Select your mission zone. Complete each level to unlock the next threat domain.
        </div>
      </div>

      {/* Level nodes */}
      <div className="arena-map">
        {loading ? (
          <div className="arena-loading">
            <div className="boot-spinner" />
            <span>LOADING MISSION DATA...</span>
          </div>
        ) : (
          LEVEL_CONFIG.map((cfg, i) => {
            const { isUnlocked, isCompleted, level } = getLevelStatus(cfg.id);
            return (
              <LevelNode
                key={cfg.id}
                config={cfg}
                level={level}
                isUnlocked={isUnlocked}
                isCompleted={isCompleted}
                index={i}
                onClick={(id) => navigate(`/arena/level/${id}`)}
              />
            );
          })
        )}
      </div>

      {/* Risk meter */}
      {progress && (
        <div className="arena-risk-meter">
          <div className="risk-label">GLOBAL RISK METER</div>
          <div className="risk-track">
            <div
              className="risk-fill"
              style={{
                width: `${progress.riskMeter ?? 0}%`,
                background: progress.riskMeter > 70 ? 'var(--accent-red)' : progress.riskMeter > 40 ? 'var(--accent-orange)' : 'var(--accent-green)'
              }}
            />
          </div>
          <div className="risk-value">{progress.riskMeter ?? 0}%</div>
        </div>
      )}
    </div>
  );
}