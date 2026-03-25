import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-scanline" />
      <div className="auth-container">
        <div className="auth-logo">
          <div className="auth-logo-icon">🔑</div>
          <div className="auth-logo-text">
            <span className="auth-brand">BATTLE OF THREATS</span>
            <span className="auth-tagline">// PASSWORD RESET MODULE //</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-card-title">
              <span className="auth-step-indicator">[RESET]</span>
              FORGOT PASSWORD
            </div>
          </div>

          {success ? (
            <div className="auth-success">
              <div className="auth-success-icon">✓</div>
              <div className="auth-success-text">RESET LINK SENT</div>
              <div className="auth-success-sub">
                Check your email for the reset link
              </div>
              <Link to="/login" className="auth-link" style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}>
                BACK TO LOGIN
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">
                  <span className="auth-label-prefix">&gt;</span> YOUR EMAIL
                </label>
                <input
                  className="cyber-input"
                  type="email"
                  placeholder="operative@domain.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {error && (
                <div className="auth-global-error">
                  <span>⚡ ERROR:</span> {error}
                </div>
              )}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="auth-loading">
                    <span className="auth-loading-dot" />
                    SENDING RESET LINK...
                  </span>
                ) : (
                  <span>SEND RESET LINK →</span>
                )}
              </button>

              <div className="auth-switch">
                Remember your password?{' '}
                <Link to="/login" className="auth-link">BACK TO LOGIN</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}