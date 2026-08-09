import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

export const Profile = () => {
  const { user } = useAuth();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/sessions/my`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        setSessions(response.data);
      } catch (err: any) {
        console.error('[Profile] Fetch sessions error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) fetchSessions();
  }, [user]);

  const visibleSessions = sessions.filter(s => s.isCompleted || s.questionsAnswered > 0);
  const completedSessions = visibleSessions.filter(s => s.isCompleted);

  const totalQuestionsAnswered = visibleSessions.reduce((acc, s) => acc + s.questionsAnswered, 0);
  const totalScoreEarned = completedSessions.reduce((acc, s) => acc + s.totalMarks, 0);
  const maxPossibleScore = completedSessions.reduce((acc, s) => acc + (s.totalQuestions * 10), 0);

  const overallPercentage = maxPossibleScore > 0 ? Math.round((totalScoreEarned / maxPossibleScore) * 100) : 0;

  // Grade calculation
  const getGrade = (pct: number) => {
    if (pct >= 90) return { letter: 'A+', label: 'Principal DevOps Architect', color: '#10b981' };
    if (pct >= 75) return { letter: 'A', label: 'Senior Platform Engineer', color: '#6366f1' };
    if (pct >= 60) return { letter: 'B', label: 'Mid-Level DevOps Engineer', color: '#f59e0b' };
    if (pct >= 40) return { letter: 'C', label: 'Associate Cloud Engineer', color: '#3b82f6' };
    return { letter: 'N/A', label: 'Candidate Practitioner', color: '#a855f7' };
  };
  const grade = getGrade(overallPercentage);

  // Group by topic for mastery bars
  const topicStats: Record<string, { totalMarks: number; maxMarks: number; count: number }> = {};
  completedSessions.forEach(s => {
    if (!topicStats[s.topic]) {
      topicStats[s.topic] = { totalMarks: 0, maxMarks: 0, count: 0 };
    }
    topicStats[s.topic].totalMarks += s.totalMarks;
    topicStats[s.topic].maxMarks += s.totalQuestions * 10;
    topicStats[s.topic].count += 1;
  });

  const topicBreakdown = Object.entries(topicStats).map(([topic, data]) => ({
    topic,
    avgScore: data.maxMarks > 0 ? Math.round((data.totalMarks / data.maxMarks) * 100) : 0,
    count: data.count,
  }));

  const getInitials = (name?: string) => {
    if (!name) return 'DV';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #a855f7', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div
      className="profile-page-wrapper"
    >
      {/* --- Hero Banner --- */}

      {/* --- Hero Banner --- */}
      <div className="profile-hero-card">
        <div className="profile-avatar-group">
          <div className="profile-avatar-circle">
            {getInitials(user?.name)}
          </div>
          <div className="profile-user-info">
            <h1 className="profile-name">{user?.name || 'DevOps Candidate'}</h1>
            <div className="profile-email">
              <span>✉️</span> {user?.email}
            </div>
            <div className="profile-meta-row">
              <span className="profile-role-badge">{user?.role || 'candidate'}</span>
              <span className="profile-status-badge">
                <span className="profile-status-dot" /> Active Member
              </span>
            </div>
          </div>
        </div>

        <div className="profile-actions-group">
          <Link to="/topics" className="btn-profile-primary">
            🚀 Launch Interview
          </Link>
        </div>
      </div>

      {/* --- Key Metrics Grid --- */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            🏆
          </div>
          <div className="stat-val-num">{completedSessions.length}</div>
          <div className="stat-label-text">Completed Assessments</div>
        </div>

        <div className="profile-stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            🎯
          </div>
          <div className="stat-val-num" style={{ color: grade.color }}>{overallPercentage}%</div>
          <div className="stat-label-text">Overall Mastery Score</div>
        </div>

        <div className="profile-stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            ⚡
          </div>
          <div className="stat-val-num">{totalQuestionsAnswered}</div>
          <div className="stat-label-text">Questions Answered</div>
        </div>

        <div className="profile-stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            🎖️
          </div>
          <div className="stat-val-num" style={{ color: grade.color }}>{grade.letter}</div>
          <div className="stat-label-text">{grade.label}</div>
        </div>
      </div>

      {/* --- Main Grid --- */}
      <div className="profile-main-grid">
        {/* Left: Domain Competencies */}
        <div>
          <div className="profile-section-card">
            <h2 className="section-header-title">
              <span>📊</span> Domain Competency Breakdown
            </h2>

            {topicBreakdown.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                No completed evaluation sessions yet. Take your first interview to generate your competency report!
              </p>
            ) : (
              topicBreakdown.map(tb => (
                <div key={tb.topic} className="competency-item">
                  <div className="competency-top">
                    <span className="competency-name">{tb.topic}</span>
                    <span className="competency-score">{tb.avgScore}% ({tb.count} {tb.count === 1 ? 'session' : 'sessions'})</span>
                  </div>
                  <div className="competency-track">
                    <div
                      className="competency-fill"
                      style={{
                        width: `${tb.avgScore}%`,
                        background: tb.avgScore >= 75
                          ? 'linear-gradient(90deg, #10b981, #34d399)'
                          : tb.avgScore >= 50
                          ? 'linear-gradient(90deg, #6366f1, #a855f7)'
                          : 'linear-gradient(90deg, #f59e0b, #ef4444)'
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Account & System Security Info */}
        <div>
          <div className="profile-section-card">
            <h2 className="section-header-title">
              <span>🛡️</span> Security & Credentials
            </h2>

            <div className="detail-row-item">
              <span className="detail-key">Account Role</span>
              <span className="detail-val" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
            </div>
            <div className="detail-row-item">
              <span className="detail-key">Authentication</span>
              <span className="detail-val">JWT Token</span>
            </div>
            <div className="detail-row-item">
              <span className="detail-key">Access Level</span>
              <span className="detail-val" style={{ color: '#34d399' }}>Verified</span>
            </div>
            <div className="detail-row-item">
              <span className="detail-key">Evaluation Agent</span>
              <span className="detail-val">Claude Sonnet 4.6</span>
            </div>
          </div>

          <div className="profile-section-card">
            <h2 className="section-header-title">
              <span>⚡</span> Quick Links
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/dashboard" style={{ color: '#818cf8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
                📋 View Full Interview History →
              </Link>
              <Link to="/topics" style={{ color: '#c084fc', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
                🎯 Select Interview Domain →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
