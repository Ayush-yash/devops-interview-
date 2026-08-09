import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface SessionItem {
  _id: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  totalQuestions: number;
  questionsAnswered: number;
  totalMarks: number;
  isCompleted: boolean;
  createdAt: string;
}

import { API_BASE_URL } from '../config/api';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/sessions/my`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        setSessions(response.data);
      } catch (err: any) {
        console.error('[Dashboard] Error fetching sessions:', err);
        setError('Failed to fetch interview history logs.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchSessions();
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #6366f1', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const visibleSessions = sessions.filter(s => s.isCompleted || s.questionsAnswered > 0);
  const completedSessions = visibleSessions.filter(s => s.isCompleted);
  const avgScore = completedSessions.length > 0 
    ? Math.round(completedSessions.reduce((acc, s) => acc + ((s.totalMarks / (s.totalQuestions * 10)) * 100), 0) / completedSessions.length)
    : 0;

  return (
    <div 
      className="dashboard-page-wrapper"
    >
      <div className="dash-header">
        <div className="dash-welcome">
          <h2>Candidate Workspace</h2>
          <p>Welcome back, {user?.name}! <span className="role-chip">{user?.role}</span></p>
        </div>
      </div>

      {error && (
        <div style={{ color: '#fca5a5', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '15px', borderRadius: '12px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Stats row */}
      <div className="stats-summary-grid">
        <div className="stat-card">
          <div className="stat-num">{sessions.length}</div>
          <div className="stat-label">Total Sessions</div>
        </div>

        <div className="stat-card">
          <div className="stat-num">{completedSessions.length}</div>
          <div className="stat-label">Completed Assessments</div>
        </div>

        <div className="stat-card">
          <div className="stat-num" style={{ color: '#a5b4fc' }}>{avgScore}%</div>
          <div className="stat-label">Average Performance</div>
        </div>
      </div>

      <div className="portal-grid">
        <div className="launch-card">
          <h3>Launch Evaluation</h3>
          <p>Select a DevOps domain (Docker, Kubernetes, CI/CD, Terraform) and test your knowledge against real-world scenario questions.</p>
          <button 
            onClick={() => navigate('/topics')} 
            className="btn-launch-interview"
          >
            Configure & Start ➔
          </button>
        </div>

        <div className="history-panel">
          <h3>Recent Evaluation History</h3>

          {visibleSessions.length > 0 ? (
            <div className="session-rows">
              {visibleSessions.map(item => {
                const percentage = Math.round((item.totalMarks / (item.totalQuestions * 10)) * 100);
                return (
                  <div key={item._id} className="session-row-card">
                    <div>
                      <div className="session-topic-title">
                        {item.topic}
                        <span className={`diff-tag-small tag-${item.difficulty}`}>{item.difficulty}</span>
                      </div>
                      <div className="session-sub-info">
                        {new Date(item.createdAt).toLocaleDateString()} • {item.questionsAnswered} of {item.totalQuestions} questions
                      </div>
                    </div>

                    <div className="score-pill-box">
                      {item.isCompleted ? (
                        <>
                          <div className="score-value-text">{percentage}% ({item.totalMarks}/{item.totalQuestions * 10})</div>
                          <button 
                            onClick={() => navigate(`/report/${item._id}`)}
                            className="btn-view-report"
                          >
                            View Report ➔
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 8px', borderRadius: '6px' }}>
                          In Progress ({item.questionsAnswered}/{item.totalQuestions})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-history-box">
              <span className="empty-emoji">📝</span>
              <div className="empty-head">No interview history yet</div>
              <p className="empty-sub">Launch your first DevOps session to test your knowledge and generate a career roadmap.</p>
              <button 
                onClick={() => navigate('/topics')} 
                className="btn-launch-interview" 
                style={{ width: 'auto', padding: '10px 20px' }}
              >
                Start First Session
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
