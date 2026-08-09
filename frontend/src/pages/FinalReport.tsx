import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface QuestionReport {
  _id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  userSelectedIndex: number;
  isCorrect: boolean;
  marks: number;
  explanation: string;
}

interface SessionReport {
  _id: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  totalQuestions: number;
  questionsAnswered: number;
  totalMarks: number;
  isCompleted: boolean;
  questions: QuestionReport[];
  coachingSummary: {
    overallFeedback: string;
    strengths: string[];
    weakAreas: string[];
    recommendedResources: string[];
    nextSteps: string;
  };
}

import { API_BASE_URL } from '../config/api';

export const FinalReport = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState<SessionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const optionLetters = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/session/${sessionId}/report`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        setReport(response.data);
      } catch (err: any) {
        console.error('[Final Report] Fetch error:', err);
        setError(err.response?.data?.message || 'Failed to fetch the final evaluation report.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token && sessionId) {
      fetchReport();
    }
  }, [user, sessionId]);

  const toggleAccordion = (id: string) => {
    setExpandedQuestionId(prev => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ border: '4px solid #e0e7ff', borderTop: '4px solid #4f46e5', borderRadius: '50%', width: '44px', height: '44px', animation: 'spin 1s linear infinite' }} />
        <h3 style={{ marginTop: '24px', color: '#334155' }}>Compiling Performance & Coaching Report...</h3>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', padding: '32px', textAlign: 'center', fontFamily: 'Inter, sans-serif', background: '#ffffff', borderRadius: '16px', border: '1px solid #fee2e2' }}>
        <h2 style={{ color: '#ef4444', marginTop: 0 }}>Report Error</h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>{error || 'Report not found.'}</p>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '12px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const maxPossibleMarks = report.totalQuestions * 10;
  const scorePercentage = Math.round((report.totalMarks / maxPossibleMarks) * 100);

  // Circle SVG calculations for score ring
  const circleRadius = 54;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (scorePercentage / 100) * circumference;

  return (
    <div 
      className="report-page-container"
    >
      <div className="report-header">
        <h1 className="report-title">Interview Performance Report</h1>
        <p className="report-subtitle">Detailed evaluation score, question explanations, and career roadmap</p>
      </div>

      {/* Scorecard Banner */}
      <div className="scorecard-banner">
        <div className="banner-info">
          <h2>Candidate Scorecard</h2>
          <p>DevOps Competency Evaluation</p>
          <div className="meta-tags">
            <span className="meta-pill">Domain: {report.topic}</span>
            <span className="meta-pill">Difficulty: {report.difficulty}</span>
            <span className="meta-pill">{report.questionsAnswered} Questions</span>
          </div>
        </div>

        <div className="ring-container">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={circleRadius}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="70"
              cy="70"
              r={circleRadius}
              stroke="#6366f1"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              transform="rotate(-90 70 70)"
            />
          </svg>
          <div className="ring-text">
            <div className="ring-score">{scorePercentage}%</div>
            <div className="ring-sub">{report.totalMarks} / {maxPossibleMarks} Marks</div>
          </div>
        </div>
      </div>

      {/* Career Coach Section */}
      <div className="section-heading">DevOps Career Coaching</div>
      {report.coachingSummary && (
        <div className="coach-summary-card">
          <div className="overall-quote">
            "{report.coachingSummary.overallFeedback}"
          </div>

          <div className="coach-grid">
            <div className="coach-box">
              <div className="coach-box-label box-green">💪 Demonstrated Strengths</div>
              <ul className="coach-list">
                {report.coachingSummary.strengths.map((st, idx) => <li key={idx}>{st}</li>)}
              </ul>
            </div>

            <div className="coach-box">
              <div className="coach-box-label box-red">🎯 Growth Opportunities</div>
              <ul className="coach-list">
                {report.coachingSummary.weakAreas.map((wk, idx) => <li key={idx}>{wk}</li>)}
              </ul>
            </div>
          </div>

          <div className="resource-box">
            <div className="resource-title">📚 Recommended Learning Resources</div>
            <ul className="coach-list" style={{ color: '#1e3a8a' }}>
              {report.coachingSummary.recommendedResources.map((rc, idx) => <li key={idx}>{rc}</li>)}
            </ul>
          </div>

          <div className="nextstep-box">
            <div className="nextstep-title">🚀 Strategic Next Steps</div>
            <p style={{ margin: 0, color: '#065f46', fontSize: '0.95rem', lineHeight: 1.5 }}>
              {report.coachingSummary.nextSteps}
            </p>
          </div>
        </div>
      )}

      {/* MCQ Question Breakdown */}
      <div className="section-heading">Detailed Question Explanations</div>
      <div className="breakdown-list">
        {report.questions.map((q, index) => {
          const isExpanded = expandedQuestionId === q._id;
          const isCorrect = q.isCorrect;

          return (
            <div key={q._id || index} className="mcq-report-card">
              <div className="report-card-header" onClick={() => toggleAccordion(q._id)}>
                <div className="q-header-text">
                  <span style={{ color: '#6366f1', fontWeight: 800 }}>Q{index + 1}.</span>
                  <span>{q.question}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`status-badge ${isCorrect ? 'badge-correct' : 'badge-wrong'}`}>
                    {isCorrect ? 'Correct (10 Marks)' : 'Incorrect (0 Marks)'}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="card-body">
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                    Options & Choices:
                  </div>

                  <div className="mcq-options-breakdown">
                    {q.options.map((optText, optIdx) => {
                      const isUserSelection = q.userSelectedIndex === optIdx;
                      const isCorrectOpt = q.correctOptionIndex === optIdx;

                      let classNames = "report-opt";
                      if (isCorrectOpt) classNames += " opt-correct";
                      else if (isUserSelection && !isCorrect) classNames += " opt-wrong-user";

                      return (
                        <div key={optIdx} className={classNames}>
                          <span>
                            <strong>{optionLetters[optIdx]}.</strong> {optText}
                          </span>

                          <div>
                            {isCorrectOpt && (
                              <span className="opt-tag tag-correct">✔ Correct Answer</span>
                            )}
                            {isUserSelection && !isCorrectOpt && (
                              <span className="opt-tag tag-wrong">✖ Your Selection</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="explanation-box">
                    <div className="explanation-title">Technical Explanation</div>
                    <div>{q.explanation}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="footer-buttons">
        <button 
          onClick={() => navigate('/topics')} 
          className="btn-primary-action"
        >
          Try Another Topic
        </button>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="btn-secondary-action"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
