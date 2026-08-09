import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      login(response.data);
      navigate('/');
    } catch (err: any) {
      console.error('[Login Error]', err);
      setError(err.response?.data?.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-grid-bg" />

      {/* Ambient glowing orbs */}
      <div className="login-orb" style={{ width: 420, height: 420, background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', top: '-10%', left: '-10%' }} />
      <div className="login-orb" style={{ width: 320, height: 320, background: 'radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 70%)', bottom: '-5%', right: '-5%', animationDelay: '2.5s' }} />
      <div className="login-orb" style={{ width: 200, height: 200, background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)', top: '50%', left: '60%', animationDelay: '5s' }} />

      {/* Card */}
      <div className="auth-glass-card">
        <div>
          {/* Logo */}
          <div style={{ textAlign: 'center' }}>
            <div className="auth-logo-ring">🚀</div>
          </div>

          {/* Headline */}
          <h1 className="auth-headline">
            Welcome back
          </h1>
          <p className="auth-subline">
            Sign in to your DevOps interview platform
          </p>

          {/* Feature pills */}
          <div className="auth-pills-row">
            <span className="auth-pill">⚡ AI-Powered</span>
            <span className="auth-pill">🔒 Secure</span>
            <span className="auth-pill">📊 Analytics</span>
          </div>

          {/* Divider */}
          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">Sign in with email</span>
            <div className="auth-divider-line" />
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="auth-field-wrap">
              <label className="auth-label" htmlFor="login-email">✉️ Email address</label>
              <div className="auth-input-wrapper">
                <input
                  id="login-email"
                  type="email"
                  className={`auth-input ${focusedField === 'email' ? 'focused' : ''}`}
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field-wrap">
              <label className="auth-label" htmlFor="login-password">🔑 Password</label>
              <div className="auth-input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`auth-input ${focusedField === 'password' ? 'focused' : ''}`}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  autoComplete="current-password"
                />
                <span
                  className="auth-input-icon"
                  onClick={() => setShowPassword(p => !p)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <><span className="btn-spinner" />Authenticating...</>
                ) : (
                  '🔐 Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="auth-footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="auth-footer-link">Create Account →</Link>
          </div>

          {/* Security badge */}
          <div className="auth-security-badge">
            🔒 256-bit encrypted · JWT secured · DevOps Interview Platform v2
          </div>

        </div>
      </div>
    </div>
  );
};
