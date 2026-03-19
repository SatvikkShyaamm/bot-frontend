import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const MATRIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';

function MatrixRain() {
  return (
    <div className="matrix-bg" aria-hidden="true">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="matrix-col" style={{
          left: `${i * 5.2}%`,
          animationDuration: `${3 + Math.random() * 4}s`,
          animationDelay: `${Math.random() * 3}s`,
          opacity: 0.06 + Math.random() * 0.08
        }}>
          {Array.from({ length: 20 }).map((_, j) => (
            <span key={j}>
              {MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [step, setStep] = useState(0); // 0=idle, 1=scanning, 2=done

  const validate = () => {
    const e = {};
    if (!form.username || form.username.length < 3) e.username = 'Min 3 characters, alphanumeric only';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (form.password.length < 8) e.password = 'Min 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.password = 'Must include upper, lower, and number';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setGlobalError('');
    setLoading(true);
    setStep(1);

    try {
      await register(form.username, form.email, form.password);
      setStep(2);
      setTimeout(() => navigate('/arena'), 1200);
    } catch (err) {
      setStep(0);
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      setGlobalError(msg);
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
          <div className="auth-logo-icon">⚔</div>
          <div className="auth-logo-text">
            <span className="auth-brand">BATTLE OF THREATS</span>
            <span className="auth-tagline">// INITIALIZE NEW OPERATIVE //</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-title">
              <span className="auth-step-indicator">[STEP 01]</span>
              OPERATIVE REGISTRATION
            </div>
            <div className="auth-status-dot" data-status={step === 1 ? 'scanning' : step === 2 ? 'done' : 'idle'} />
          </div>

          {step === 2 ? (
            <div className="auth-success">
              <div className="auth-success-icon">✓</div>
              <div className="auth-success-text">OPERATIVE CLEARED</div>
              <div className="auth-success-sub">Entering the arena...</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
              <div className="auth-field">
                <label className="auth-label">
                  <span className="auth-label-prefix">&gt;</span> OPERATIVE ID (Username)
                </label>
                <input
                  className={`cyber-input ${errors.username ? 'input-error' : ''}`}
                  type="text"
                  placeholder="e.g. shadow_hunter_01"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  autoComplete="off"
                />
                {errors.username && <div className="error-msg">⚠ {errors.username}</div>}
              </div>

              <div className="auth-field">
                <label className="auth-label">
                  <span className="auth-label-prefix">&gt;</span> SECURE CHANNEL (Email)
                </label>
                <input
                  className={`cyber-input ${errors.email ? 'input-error' : ''}`}
                  type="email"
                  placeholder="operative@domain.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  autoComplete="off"
                />
                {errors.email && <div className="error-msg">⚠ {errors.email}</div>}
              </div>

              <div className="auth-field">
                <label className="auth-label">
                  <span className="auth-label-prefix">&gt;</span> ACCESS KEY (Password)
                </label>
                <input
                  className={`cyber-input ${errors.password ? 'input-error' : ''}`}
                  type="password"
                  placeholder="Min 8 chars, upper + lower + number"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  autoComplete="new-password"
                />
                {errors.password && <div className="error-msg">⚠ {errors.password}</div>}
              </div>

              <div className="auth-field">
                <label className="auth-label">
                  <span className="auth-label-prefix">&gt;</span> CONFIRM ACCESS KEY
                </label>
                <input
                  className={`cyber-input ${errors.confirm ? 'input-error' : ''}`}
                  type="password"
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                  autoComplete="new-password"
                />
                {errors.confirm && <div className="error-msg">⚠ {errors.confirm}</div>}
              </div>

              {globalError && (
                <div className="auth-global-error">
                  <span>⚡ SYSTEM REJECTION:</span> {globalError}
                </div>
              )}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="auth-loading">
                    <span className="auth-loading-dot" />
                    SCANNING CLEARANCE...
                  </span>
                ) : (
                  <span>ENLIST AS OPERATIVE →</span>
                )}
              </button>

              <div className="auth-switch">
                Already enlisted?{' '}
                <Link to="/login" className="auth-link">ACCESS TERMINAL</Link>
              </div>
            </form>
          )}
        </div>

        <div className="auth-footer">
          <span>SETS GAMEATHON 2026</span>
          <span className="auth-footer-dot">◆</span>
          <span>TEAM ROOTSHELL</span>
          <span className="auth-footer-dot">◆</span>
          <span>CLEARANCE LEVEL: PUBLIC</span>
        </div>
      </div>
    </div>
  );
}
