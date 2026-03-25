import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function MatrixRain() {
  return (
    <div className="matrix-bg" aria-hidden="true">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="matrix-col" style={{
          left: `${i * 5.2}%`,
          animationDuration: `${3 + Math.random() * 4}s`,
          animationDelay: `${Math.random() * 3}s`,
          opacity: 0.05 + Math.random() * 0.07
        }}>
          {Array.from({ length: 20 }).map((_, j) => (
            <span key={j}>{String.fromCharCode(33 + Math.floor(Math.random() * 90))}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier || !form.password) { setError('All fields required'); return; }
    setError('');
    setLoading(true);
    setStep('authenticating');

    try {
      await login(form.identifier, form.password);
      setStep('granted');
      setTimeout(() => navigate('/arena'), 1000);
    } catch (err) {
      setStep('denied');
      setTimeout(() => setStep('idle'), 2000);
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <MatrixRain />
      <div className="auth-scanline" />

      <div className="auth-container">
        <div className="auth-logo">
          <div className="auth-logo-icon">🔐</div>
          <div className="auth-logo-text">
            <span className="auth-brand">BATTLE OF THREATS</span>
            <span className="auth-tagline">// IDENTITY AUTHENTICATION MODULE //</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-title">
              <span className="auth-step-indicator">[IAM]</span>
              OPERATIVE LOGIN TERMINAL
            </div>
            <div className="auth-status-dot"
              data-status={
                step === 'authenticating' ? 'scanning' :
                step === 'granted' ? 'done' :
                step === 'denied' ? 'denied' : 'idle'
              }
              style={step === 'denied' ? { background: 'var(--accent-red)', boxShadow: '0 0 10px var(--accent-red)' } : {}}
            />
          </div>

          {step === 'granted' ? (
            <div className="auth-success">
              <div className="auth-success-icon">✓</div>
              <div className="auth-success-text">ACCESS GRANTED</div>
              <div className="auth-success-sub">Loading arena...</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">
                  <span className="auth-label-prefix">&gt;</span> OPERATIVE ID / EMAIL
                </label>
                <input
                  className="cyber-input"
                  type="text"
                  placeholder="username or email"
                  value={form.identifier}
                  onChange={e => setForm(p => ({ ...p, identifier: e.target.value }))}
                  autoComplete="username"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">
                  <span className="auth-label-prefix">&gt;</span> ACCESS KEY
                </label>
                <div className="password-wrapper">
                  <input
                    className="cyber-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(p => !p)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="auth-global-error" style={{ animation: 'breach-flash 0.5s ease' }}>
                  <span>⚡ AUTH REJECTED:</span> {error}
                </div>
              )}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="auth-loading">
                    <span className="auth-loading-dot" />
                    AUTHENTICATING...
                  </span>
                ) : (
                  <span>ENTER THE ARENA →</span>
                )}
              </button>

              <div className="auth-switch">
                <Link to="/forgot-password" className="auth-link">FORGOT PASSWORD?</Link>
              </div>
              <div className="auth-switch">
                No operative file?{' '}
                <Link to="/register" className="auth-link">ENLIST NOW</Link>
              </div>
            </form>
          )}
        </div>

        <div className="auth-footer">
          <span>SETS GAMEATHON 2026</span>
          <span className="auth-footer-dot">◆</span>
          <span>TEAM ROOTSHELL</span>
          <span className="auth-footer-dot">◆</span>
          <span>SECURE CHANNEL ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
