import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-hero-wrapper">
      <div className="ambient-glow"></div>

      <div className="hero-content-box">
        <div className="hero-badge-pill">
          <span>✨</span> Multi-Agent Claude 3.5 Orchestration
        </div>

        <h1 className="hero-title-main">
          AI-Powered <span className="title-gradient-pink">DevOps Technical</span> Interviews
        </h1>

        <p className="hero-desc">
          Evaluate candidates across Docker, Kubernetes, CI/CD, and Cloud Security. Driven by specialized AI Interviewer, Evaluator, and Career Coach agents.
        </p>

        <div className="hero-button-group">
          {user ? (
            <>
              <Link to="/dashboard" className="btn-cta-primary">
                Go to Candidate Dashboard ➔
              </Link>
              <Link to="/topics" className="btn-cta-secondary">
                Interview Rooms
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn-cta-primary">
                Start Interview Session ➔
              </Link>
              <Link to="/login" className="btn-cta-secondary">
                Recruiter Portal
              </Link>
            </>
          )}
        </div>

        <div className="feature-grid-layout">
          <div className="glass-feature-card">
            <div className="icon-glow-wrapper">🎯</div>
            <h3 className="feature-card-heading">Suspenseful MCQ Testing</h3>
            <p className="feature-card-text">
              4-Option scenario questions with deferred answer evaluation. Detailed explanations released at session completion.
            </p>
          </div>

          <div className="glass-feature-card">
            <div className="icon-glow-wrapper">🔒</div>
            <h3 className="feature-card-heading">Production Hardened</h3>
            <p className="feature-card-text">
              Protected by Zod validation, prompt injection sanitizers, IP rate limiting, and Helmet security headers.
            </p>
          </div>

          <div className="glass-feature-card">
            <div className="icon-glow-wrapper">📊</div>
            <h3 className="feature-card-heading">Kubernetes & Prometheus</h3>
            <p className="feature-card-text">
              StatefulSet database manifests, HPA autoscalers, and built-in Prom-client metrics exporter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
