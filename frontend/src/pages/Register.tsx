import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');
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
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, { name, email, password, role });
      login(response.data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!password) return { level: 0, label: '', color: '#334155' };
    if (password.length < 6) return { level: 1, label: 'Weak', color: '#ef4444' };
    if (password.length < 10) return { level: 2, label: 'Fair', color: '#f59e0b' };
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return { level: 4, label: 'Strong', color: '#10b981' };
    return { level: 3, label: 'Good', color: '#6366f1' };
  };
  const strength = passwordStrength();

  return (
    <div className="register-container">
      <div className="reg-grid-bg" />

      {/* Ambient orbs */}
      <div className="reg-orb" style={{ width: 380, height: 380, background: 'radial-gradient(circle, rgba(168,85,247,0.16) 0%, transparent 70%)', top: '-8%', right: '-6%', animationDelay: '0s' }} />
      <div className="reg-orb" style={{ width: 280, height: 280, background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)', bottom: '-4%', left: '-4%', animationDelay: '3s' }} />
      <div className="reg-orb" style={{ width: 180, height: 180, background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', top: '40%', left: '55%', animationDelay: '6s' }} />

      <div className="reg-glass-card">
        <div>
          <div style={{ textAlign: 'center' }}>
            <div className="reg-logo-ring">⚡</div>
          </div>

          <h1 className="reg-headline">Create Account</h1>
          <p className="reg-subline">Join the DevOps interview platform today</p>

          {/* Role Selector */}
          <div>
            <div className="auth-label-r" style={{ marginBottom: '12px' }}>
              👤 I am joining as...
            </div>
            <div className="reg-role-selector">
              {(['candidate', 'recruiter'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  className={`reg-role-btn ${role === r ? 'active' : ''}`}
                  onClick={() => setRole(r)}
                >
                  <span className="reg-role-icon">{r === 'candidate' ? '🎯' : '🏢'}</span>
                  <span className="reg-role-label">{r}</span>
                  <span className="reg-role-desc">
                    {r === 'candidate' ? 'Take interviews & track progress' : 'Assess & review candidates'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error-r">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className="auth-field-wrap-r">
              <label className="auth-label-r" htmlFor="reg-name">👤 Full name</label>
              <div className="auth-input-wrapper-r">
                <input
                  id="reg-name"
                  type="text"
                  className={`auth-input-r ${focusedField === 'name' ? 'focused-r' : ''}`}
                  placeholder="Ayush Kumar"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field-wrap-r">
              <label className="auth-label-r" htmlFor="reg-email">✉️ Email address</label>
              <div className="auth-input-wrapper-r">
                <input
                  id="reg-email"
                  type="email"
                  className={`auth-input-r ${focusedField === 'email' ? 'focused-r' : ''}`}
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
            <div className="auth-field-wrap-r">
              <label className="auth-label-r" htmlFor="reg-password">🔑 Password</label>
              <div className="auth-input-wrapper-r">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`auth-input-r ${focusedField === 'password' ? 'focused-r' : ''}`}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <span className="auth-icon-r" onClick={() => setShowPassword(p => !p)}>
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>
              {password && (
                <>
                  <div className="pw-strength-row">
                    {[1, 2, 3, 4].map(level => (
                      <div key={level} className="pw-bar" style={{ background: level <= strength.level ? strength.color : undefined }} />
                    ))}
                  </div>
                  <div className="pw-label" style={{ color: strength.color }}>{strength.label}</div>
                </>
              )}
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                className="reg-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <><span className="reg-spinner" />Creating account...</>
                ) : (
                  '🚀 Create My Account'
                )}
              </button>
            </div>
          </form>

          <div className="reg-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="reg-footer-link">Sign In →</Link>
          </div>

          <div className="reg-security-badge">
            🔒 Encrypted · Secure · DevOps Interview Platform v2
          </div>

        </div>
      </div>
    </div>
  );
};
