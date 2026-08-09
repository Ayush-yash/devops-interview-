import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="nav-container">
      <Link to="/" className="nav-brand-group">
        <div className="brand-logo-badge">⚡</div>
        <span className="brand-title">DevOps Evaluator</span>
      </Link>

      <div className="nav-items">
        <Link to="/" className={`nav-item-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
        
        {user && (
          <>
            <Link to="/dashboard" className={`nav-item-link ${isActive('/dashboard') ? 'active' : ''}`}>Dashboard</Link>
            <Link to="/topics" className={`nav-item-link ${isActive('/topics') ? 'active' : ''}`}>Interview Rooms</Link>
            <Link to="/profile" className={`nav-item-link ${isActive('/profile') ? 'active' : ''}`}>Profile</Link>

            {(user.role === 'recruiter' || user.role === 'admin') && (
              <Link to="/recruiter" className={`nav-item-link ${isActive('/recruiter') ? 'active' : ''}`}>Candidates</Link>
            )}

            {user.role === 'admin' && (
              <Link to="/admin" className={`nav-item-link ${isActive('/admin') ? 'active' : ''}`}>Telemetry</Link>
            )}
          </>
        )}
      </div>

      <div className="user-section">
        {user ? (
          <>
            <Link to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="user-name-label">{user.name}</span>
              <span className="role-pill">{user.role}</span>
            </Link>
            <button 
              onClick={handleLogout} 
              className="btn-logout"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-auth-ghost">Sign In</Link>
            <Link to="/register" className="btn-auth-primary">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
};
