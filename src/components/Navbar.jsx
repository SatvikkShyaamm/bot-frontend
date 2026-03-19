import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 2000];
const RANK_TITLES = ['RECRUIT', 'ANALYST', 'SPECIALIST', 'SENTINEL', 'ELITE', 'CYBER GHOST'];

function XPBar({ xp }) {
  const rankIdx = XP_THRESHOLDS.findIndex((t, i) => xp < (XP_THRESHOLDS[i + 1] ?? Infinity));
  const idx = rankIdx === -1 ? RANK_TITLES.length - 1 : rankIdx;
  const curr = XP_THRESHOLDS[idx] ?? 0;
  const next = XP_THRESHOLDS[idx + 1];
  const pct = next ? Math.min(100, ((xp - curr) / (next - curr)) * 100) : 100;

  return (
    <div className="xp-bar-wrapper">
      <div className="xp-bar-label">
        <span className="xp-rank">{RANK_TITLES[idx]}</span>
        <span className="xp-value">⚡ {xp} XP</span>
      </div>
      <div className="xp-bar-track">
        <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
        <div className="xp-bar-glow" style={{ left: `${pct}%` }} />
      </div>
      {next && (
        <div className="xp-bar-next">→ {next - xp} XP to {RANK_TITLES[idx + 1]}</div>
      )}
    </div>
  );
}

function UserPanel({ user, progress, onLogout }) {
  const completedLevels = progress?.levels?.filter(l => l.status === 'completed') ?? [];

  return (
    <div className="user-panel-dropdown">
      <div className="user-panel-header">
        <div className="user-panel-avatar">
          {user.username[0].toUpperCase()}
        </div>
        <div>
          <div className="user-panel-name">{user.username}</div>
          <div className="user-panel-sub">Operative ID: #{String(user.id).slice(-6).toUpperCase()}</div>
        </div>
      </div>

      <div className="user-panel-section">
        <div className="user-panel-section-title">PROGRESS</div>
        <div className="user-panel-stats">
          <div className="user-panel-stat">
            <span className="stat-val">{completedLevels.length}/4</span>
            <span className="stat-lbl">Levels Done</span>
          </div>
          <div className="user-panel-stat">
            <span className="stat-val">
              {progress?.levels?.flatMap(l => l.tasks).filter(t => t.status === 'completed').length ?? 0}/20
            </span>
            <span className="stat-lbl">Tasks Done</span>
          </div>
          <div className="user-panel-stat">
            <span className="stat-val">{user.xp}</span>
            <span className="stat-lbl">Total XP</span>
          </div>
        </div>
      </div>

      {user.badges?.length > 0 && (
        <div className="user-panel-section">
          <div className="user-panel-section-title">BADGES ({user.badges.length})</div>
          <div className="user-panel-badges">
            {user.badges.map(b => (
              <div key={b.id} className="user-panel-badge" title={b.description}>
                <span className="badge-icon">{b.icon}</span>
                <span className="badge-name">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="user-panel-logout" onClick={onLogout}>
        ⏏ LOGOUT OPERATIVE
      </button>
    </div>
  );
}

export default function Navbar({ progress }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [panelOpen, setPanelOpen] = useState(false);
  const [showBrandTip, setShowBrandTip] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      {/* LEFT — Branding */}
      <div
        className="navbar-brand"
        onMouseEnter={() => setShowBrandTip(true)}
        onMouseLeave={() => setShowBrandTip(false)}
        onClick={() => navigate('/arena')}
      >
        <span className="navbar-brand-icon">⚔</span>
        <span className="navbar-brand-text">BattleOfThreats</span>
        {showBrandTip && (
          <div className="brand-tooltip">
            <div className="brand-tooltip-title">BATTLE OF THREATS</div>
            <div className="brand-tooltip-body">
              A gamified cybersecurity training platform where you train like a real
              defensive professional. Face realistic attack simulations across Social
              Engineering, Phishing, AI Scams, and Malware attacks. Learn. Defend. Dominate.
            </div>
            <div className="brand-tooltip-footer">SETS Gameathon 2026 · Team Rootshell</div>
          </div>
        )}
      </div>

      {/* CENTER — XP Bar */}
      <div className="navbar-center">
        {user && <XPBar xp={user.xp ?? 0} />}
      </div>

      {/* RIGHT — User icon */}
      <div className="navbar-right" ref={panelRef}>
        {user && (
          <div className="user-btn-wrapper">
            <button
              className={`user-icon-btn ${panelOpen ? 'active' : ''}`}
              onClick={() => setPanelOpen(p => !p)}
            >
              <div className="user-icon-avatar">{user.username[0].toUpperCase()}</div>
              <div className="user-icon-info">
                <span className="user-icon-name">{user.username}</span>
                <span className="user-icon-xp">⚡ {user.xp ?? 0} XP</span>
              </div>
              <span className="user-icon-chevron">{panelOpen ? '▲' : '▼'}</span>
            </button>

            {panelOpen && (
              <UserPanel
                user={user}
                progress={progress}
                onLogout={handleLogout}
              />
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
