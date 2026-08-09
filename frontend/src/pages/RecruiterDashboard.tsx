import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

interface CandidateSummary {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  sessionsTaken: number;
  averageScore: number;
  topicsCovered: string[];
  difficultiesCovered: string[];
}

interface SessionDetail {
  _id: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  totalQuestions: number;
  questionsAnswered: number;
  totalMarks: number;
  isCompleted: boolean;
  createdAt: string;
}

export const RecruiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSummary | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<SessionDetail[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/recruiter/candidates`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        setCandidates(response.data);
      } catch (err: any) {
        console.error('[Recruiter Dashboard] Fetch error:', err);
        setError(err.response?.data?.message || 'Failed to load candidates data.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchCandidates();
    }
  }, [user]);

  const handleSelectCandidate = async (candidate: CandidateSummary) => {
    setSelectedCandidate(candidate);
    setSessionsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/recruiter/candidate/${candidate._id}/sessions`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setSelectedSessions(response.data.sessions);
    } catch (err) {
      console.error('[Recruiter Dashboard] Sessions fetch error:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.topicsCovered.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #6366f1', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div 
      className="recruiter-page-wrapper"
    >
      <div>
        <h1 className="header-title">Candidate Directory</h1>
        <p className="header-sub">Audit technical interview progress, score averages, and detailed candidate report roadmaps.</p>
      </div>

      {error && (
        <div style={{ color: '#fca5a5', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '15px', borderRadius: '12px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <input 
        type="text" 
        placeholder="Search candidates by name, email, or domain..." 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input-field"
      />

      <div className="recruiter-grid-layout">
        <div className="candidates-glass-card">
          <table className="candidate-data-table">
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Sessions</th>
                <th>Avg Score</th>
                <th>Covered Domains</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map(c => (
                <tr 
                  key={c._id} 
                  className={`candidate-data-row ${selectedCandidate?._id === c._id ? 'active-row' : ''}`}
                  onClick={() => handleSelectCandidate(c)}
                >
                  <td>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{c.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.email}</div>
                  </td>
                  <td>{c.sessionsTaken} completed</td>
                  <td style={{ fontWeight: 700, color: c.averageScore >= 8 ? '#34d399' : c.averageScore >= 5 ? '#fbbf24' : '#fca5a5' }}>
                    {c.sessionsTaken > 0 ? `${c.averageScore} / 10` : 'N/A'}
                  </td>
                  <td>
                    {c.topicsCovered.length > 0 ? (
                      c.topicsCovered.map(t => <span key={t} className="domain-tag">{t}</span>)
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>None yet</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-placeholder">No candidates found matching the query.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="detail-inspector-card">
          {selectedCandidate ? (
            <div>
              <h3 style={{ margin: '0 0 4px 0', color: '#ffffff', fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem' }}>{selectedCandidate.name}</h3>
              <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '0.9rem' }}>{selectedCandidate.email}</p>
              
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Completed Sessions</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>{selectedCandidate.sessionsTaken}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Mean Evaluation Score</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a5b4fc' }}>{selectedCandidate.averageScore} / 10</div>
                  </div>
                </div>
              </div>

              <h4 style={{ margin: '0 0 16px 0', color: '#cbd5e1', fontSize: '1rem' }}>Candidate Session Logs</h4>

              {sessionsLoading ? (
                <p className="empty-placeholder">Loading candidate session logs...</p>
              ) : selectedSessions.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {selectedSessions.map(session => (
                    <div key={session._id} className="session-detail-item">
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>{session.topic} ({session.difficulty})</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                          {new Date(session.createdAt).toLocaleDateString()} • {session.questionsAnswered} questions
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        {session.isCompleted ? (
                          <>
                            <div style={{ fontWeight: 800, color: '#a5b4fc', fontSize: '1.05rem' }}>{session.totalMarks} / {session.totalQuestions * 10}</div>
                            <button 
                              onClick={() => navigate(`/report/${session._id}`)} 
                              className="btn-inspect-report"
                            >
                              Report Card ➔
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-placeholder">No completed sessions logged for this candidate.</p>
              )}
            </div>
          ) : (
            <div className="empty-placeholder">
              Select a candidate from the directory table to inspect their detailed session history and performance report cards.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
