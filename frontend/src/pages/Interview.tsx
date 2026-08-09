import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export const Interview = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { topicId, topicName, difficulty, questionsCount: rawCount } = location.state || {};
  const questionsCount = rawCount ? Number(rawCount) : null;

  useEffect(() => {
    if (!location.state || !topicId || !difficulty || !questionsCount) {
      navigate('/topics', { replace: true });
    }
  }, []);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(1);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

  const [status, setStatus] = useState<'initializing' | 'fetching_question' | 'answering' | 'submitting'>('initializing');
  const [error, setError] = useState<string>('');

  const optionLetters = ['A', 'B', 'C', 'D'];
  const initRef = useRef(false);

  // 1. Initialize Interview Session (Runs ONCE)
  useEffect(() => {
    if (initRef.current) return;
    if (!topicId || !difficulty || !questionsCount || !user?.token) return;

    initRef.current = true;

    const startSession = async () => {
      setStatus('initializing');
      setError('');
      try {
        const response = await axios.post(`${API_BASE_URL}/api/session/start`, {
          topic: topicName || topicId,
          difficulty,
          totalQuestions: Number(questionsCount)
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        const newSessionId = response.data._id || response.data.sessionId;
        setSessionId(newSessionId);
        setStatus('fetching_question');
      } catch (err: any) {
        console.error('[Interview Flow] Start session error:', err);
        setError(err.response?.data?.message || 'Failed to start interview session');
      }
    };

    startSession();
  }, [topicId, topicName, difficulty, questionsCount, user]);

  // 2. Fetch Question when currentQuestionNumber updates
  useEffect(() => {
    if (status !== 'fetching_question' || !sessionId || !user?.token) return;

    const fetchQuestion = async () => {
      setError('');
      setSelectedOptionIndex(null);

      try {
        const response = await axios.post(`${API_BASE_URL}/api/question/next`, {
          sessionId
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        const { questionId: qId, question, options: opts, isCompleted } = response.data;

        if (isCompleted) {
          navigate(`/report/${sessionId}`);
          return;
        }

        setQuestionId(qId);
        setQuestionText(question);
        setOptions(opts);
        setStatus('answering');
      } catch (err: any) {
        console.error('[Interview Flow] Fetch question error:', err);
        setError(err.response?.data?.message || 'Failed to fetch the next question.');
      }
    };

    fetchQuestion();
  }, [status, sessionId, user]);

  const handleNextQuestion = async () => {
    if (selectedOptionIndex === null || !sessionId || !questionId) return;

    setStatus('submitting');
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/answer/submit`, {
        sessionId,
        questionId,
        userSelectedIndex: selectedOptionIndex
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });

      const { isCompleted } = response.data;

      if (isCompleted || currentQuestionNumber >= Number(questionsCount)) {
        navigate(`/report/${sessionId}`);
      } else {
        setCurrentQuestionNumber(prev => prev + 1);
        setStatus('fetching_question');
      }
    } catch (err: any) {
      console.error('[Interview Flow] Answer submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit answer.');
      setStatus('answering');
    }
  };

  const handleQuit = () => {
    if (window.confirm('Are you sure you want to quit? Your progress in this session will be lost.')) {
      navigate('/dashboard');
    }
  };

  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', padding: '32px', textAlign: 'center', fontFamily: 'Inter, sans-serif', background: 'rgba(15,23,42,0.8)', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.3)' }}>
        <h2 style={{ color: '#fca5a5', marginTop: 0 }}>Session Error</h2>
        <p style={{ color: '#cbd5e1', marginBottom: '24px' }}>{error}</p>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '12px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (status === 'initializing') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #6366f1', borderRadius: '50%', width: '44px', height: '44px', animation: 'spin 1s linear infinite' }} />
        <h3 style={{ marginTop: '24px', color: '#cbd5e1' }}>Initializing Candidate Sandbox...</h3>
      </div>
    );
  }

  const isLastQuestion = currentQuestionNumber >= Number(questionsCount);

  return (
    <div className="interview-room-container">

      <div className="room-header">
        <div className="header-meta">
          <span className="topic-title">{topicName || topicId}</span>
          <span className={`diff-tag diff-${difficulty}`}>{difficulty}</span>
        </div>
        <div className="progress-tracker">
          Question {currentQuestionNumber} of {questionsCount}
        </div>
      </div>

      <div className="progress-track-bg">
        <div 
          className="progress-track-fill" 
          style={{ width: `${(currentQuestionNumber / Number(questionsCount)) * 100}%` }} 
        />
      </div>

      {status === 'fetching_question' ? (
        <div className="mcq-question-card animate-pulse">
          <div className="skel-line" style={{ width: '25%' }}></div>
          <div className="skel-line" style={{ width: '90%' }}></div>
          <div className="skel-line" style={{ width: '60%' }}></div>
          <div style={{ marginTop: '30px' }}>
            <div className="skel-card"></div>
            <div className="skel-card"></div>
            <div className="skel-card"></div>
            <div className="skel-card"></div>
          </div>
        </div>
      ) : (
        <div>
          <div className="mcq-question-card">
            <div className="question-label">Question {currentQuestionNumber}</div>
            <h2 className="question-heading">{questionText}</h2>
          </div>

          <div className="options-list">
            {options.map((optText, index) => {
              const isSelected = selectedOptionIndex === index;
              return (
                <div
                  key={index}
                  className={`option-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedOptionIndex(index)}
                >
                  <div className="badge-circle">{optionLetters[index]}</div>
                  <div className="option-text">{optText}</div>
                </div>
              );
            })}
          </div>

          <div className="action-row">
            <button type="button" onClick={handleQuit} className="btn-quit">
              Quit Interview
            </button>
            <button
              type="button"
              className="btn-next"
              disabled={selectedOptionIndex === null || status === 'submitting'}
              onClick={handleNextQuestion}
            >
              {status === 'submitting' 
                ? 'Saving Answer...' 
                : isLastQuestion 
                  ? 'Submit & Complete Interview ➔' 
                  : 'Next Question ➜'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
