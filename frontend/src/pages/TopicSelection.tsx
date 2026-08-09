import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

interface Topic {
  id: string;
  name: string;
  description: string;
  icon: string;
}

type Step = 'topics' | 'difficulty' | 'questions';

const DEFAULT_TOPICS: Topic[] = [
  { id: 'docker', name: 'Docker', description: 'Containerization basics, Dockerfiles, multi-stage builds, networking, and volumes.', icon: '🐳' },
  { id: 'kubernetes', name: 'Kubernetes', description: 'Orchestration, Pods, Deployments, Services, ConfigMaps, Secrets, and Ingress.', icon: '☸️' },
  { id: 'cicd', name: 'CI/CD (Jenkins/GitHub Actions)', description: 'Continuous Integration & Deployment pipelines, workflows, runners, and automation.', icon: '🚀' },
  { id: 'linux-shell', name: 'Linux & Shell Scripting', description: 'System administration, bash scripting, file systems, permissions, and process management.', icon: '🐧' },
  { id: 'git-vcs', name: 'Git & Version Control', description: 'Branching strategies, rebasing, merge conflict resolution, and git internals.', icon: '🌲' },
  { id: 'cloud-fundamentals', name: 'Cloud Fundamentals (AWS/Azure/GCP)', description: 'IAM, virtual machines, networking (VPCs), managed services, and serverless.', icon: '☁️' },
  { id: 'monitoring-logging', name: 'Monitoring & Logging', description: 'Prometheus, Grafana, ELK/EFK stack, alert rules, and metrics collection.', icon: '📈' },
  { id: 'iac', name: 'Infrastructure as Code (Terraform/Ansible)', description: 'Declarative resource provisioning, state management, modules, and configuration management.', icon: '🏗️' },
  { id: 'networking-basics', name: 'Networking Basics', description: 'TCP/IP, DNS, HTTP/HTTPS, SSL/TLS, firewalls, and load balancing.', icon: '🌐' },
  { id: 'mixed-random', name: 'Mixed / Random', description: 'A comprehensive interview pulling questions from all topics across the DevOps spectrum.', icon: '🎲' }
];

export const TopicSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedQuestionsCount, setSelectedQuestionsCount] = useState<number | null>(null);
  const [step, setStep] = useState<Step>('topics');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
        const response = await axios.get(`${API_BASE_URL}/api/topics`, { headers });
        if (Array.isArray(response.data) && response.data.length > 0) {
          setTopics(response.data);
        } else {
          setTopics(DEFAULT_TOPICS);
        }
      } catch (err: any) {
        console.error('[TopicSelection] Fetch error:', err);
        setTopics(DEFAULT_TOPICS);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [user]);

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setSelectedDifficulty(null);
    setSelectedQuestionsCount(null);
    setStep('difficulty');
  };

  const handleDifficultySelect = (diff: string) => {
    setSelectedDifficulty(diff);
    setStep('questions');
  };

  const handleStartInterview = () => {
    if (selectedTopic && selectedDifficulty && selectedQuestionsCount) {
      navigate('/interview', {
        state: {
          topicId: selectedTopic.id,
          topicName: selectedTopic.name,
          difficulty: selectedDifficulty,
          questionsCount: selectedQuestionsCount,
        },
      });
    }
  };

  const difficulties = [
    {
      level: 'Easy',
      color: '#34d399',
      colorRgb: '52, 211, 153',
      desc: 'Fundamental core concepts, simple CLI usage, basic definitions & principles.',
      bullets: ['100% MCQ Scenarios', 'Immediate feedback mode', 'Junior / Entry-Level practice'],
    },
    {
      level: 'Medium',
      color: '#fbbf24',
      colorRgb: '251, 191, 36',
      desc: 'Mid-level architecture, debugging scenarios, config files & orchestration.',
      bullets: ['Production troubleshooting', 'Configuration analysis', 'Mid-Level engineer target'],
    },
    {
      level: 'Hard',
      color: '#f87171',
      colorRgb: '248, 113, 113',
      desc: 'Senior-level edge cases, security hardening, high-availability & disaster recovery.',
      bullets: ['Complex architecture problems', 'Security & scaling edge-cases', 'Senior / Lead Architect target'],
    },
  ];

  const questionCounts = [
    { count: 5, label: '5 Questions', sub: 'Quick Pulse Check (~5 mins)', icon: '⚡' },
    { count: 10, label: '10 Questions', sub: 'Standard Assessment (~12 mins)', icon: '🎯' },
    { count: 15, label: '15 Questions', sub: 'Deep Technical Audit (~20 mins)', icon: '🔥' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #6366f1', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '90vh', fontFamily: "'Inter', system-ui, sans-serif", color: '#f8fafc' }}>
      {/* --- Breadcrumb --- */}
      <div className="breadcrumb-row">
        <span
          className={`bc-item ${step === 'topics' ? 'active' : ''}`}
          onClick={() => setStep('topics')}
        >
          📚 All Domains
        </span>
        {selectedTopic && (
          <>
            <span className="bc-sep">›</span>
            <span
              className={`bc-item ${step === 'difficulty' ? 'active' : ''}`}
              onClick={() => setStep('difficulty')}
            >
              {selectedTopic.icon} {selectedTopic.name}
            </span>
          </>
        )}
        {selectedDifficulty && (
          <>
            <span className="bc-sep">›</span>
            <span className={`bc-item ${step === 'questions' ? 'active' : ''}`}>
              {selectedDifficulty} Difficulty
            </span>
          </>
        )}
      </div>

      {/* ======================== STEP 1 : TOPICS ======================== */}
      {step === 'topics' && (
        <div className="step-page-wrapper">
          <div className="step-header">
            <div className="step-eyebrow">⚡ Interview Rooms</div>
            <h1 className="step-title">
              Choose a <span className="grad">DevOps Domain</span>
            </h1>
            <p className="step-subtitle">
              Click any topic to enter its evaluation room. Each domain has curated MCQ questions generated in real-time by Claude AI.
            </p>
          </div>

          {error && (
            <div style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '14px 20px', borderRadius: '12px', marginBottom: '32px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div className="topics-grid-layout">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="topic-tile"
                onClick={() => handleTopicSelect(topic)}
              >
                <div className="topic-icon-wrapper">{topic.icon}</div>
                <div className="topic-tile-name">{topic.name}</div>
                <div className="topic-tile-desc">{topic.description}</div>
                <div className="topic-tile-arrow">
                  Enter Room <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================== STEP 2 : DIFFICULTY ======================== */}
      {step === 'difficulty' && selectedTopic && (
        <div className="step-page-wrapper">
          <div className="step-header">
            <div className="step-eyebrow">{selectedTopic.icon} {selectedTopic.name}</div>
            <h1 className="step-title">
              Choose <span className="grad">Difficulty Level</span>
            </h1>
            <p className="step-subtitle">
              Select how challenging you want your interview to be. Each level unlocks a different class of questions.
            </p>
          </div>

          <div className="diff-cards-row">
            {difficulties.map((d) => (
              <div
                key={d.level}
                className={`diff-mega-card ${d.level.toLowerCase()}`}
                onClick={() => handleDifficultySelect(d.level)}
              >
                <div className="diff-badge">
                  <span className="diff-badge-dot" style={{ background: d.color, boxShadow: `0 0 8px ${d.color}` }}></span>
                  <span style={{ color: d.color }}>{d.level}</span>
                </div>
                <p className="diff-desc">{d.desc}</p>
                <ul className="diff-bullet-list">
                  {d.bullets.map(b => (
                    <li key={b}>
                      <span className="diff-bullet-dot" style={{ background: d.color }}></span>
                      {b}
                    </li>
                  ))}
                </ul>
                <button
                  className="diff-cta"
                  style={{
                    background: `rgba(${d.colorRgb}, 0.15)`,
                    border: `1px solid rgba(${d.colorRgb}, 0.4)`,
                    color: d.color,
                  }}
                >
                  Select {d.level} →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================== STEP 3 : QUESTION COUNT ======================== */}
      {step === 'questions' && selectedTopic && selectedDifficulty && (
        <div className="step-page-wrapper">
          <div className="step-header">
            <div className="step-eyebrow">{selectedTopic.icon} {selectedTopic.name} · {selectedDifficulty}</div>
            <h1 className="step-title">
              Choose <span className="grad">Question Count</span>
            </h1>
            <p className="step-subtitle">
              More questions = more comprehensive assessment. Results and career roadmap generated at the end.
            </p>
          </div>

          <div className="count-cards-row">
            {questionCounts.map((q) => (
              <div
                key={q.count}
                className={`count-tile ${selectedQuestionsCount === q.count ? 'selected' : ''}`}
                onClick={() => setSelectedQuestionsCount(q.count)}
              >
                <div className="count-icon">{q.icon}</div>
                <div className="count-num">{q.label}</div>
                <div className="count-sub">{q.sub}</div>
              </div>
            ))}
          </div>

          <div className="launch-btn-row">
            <button
              className="launch-btn-big"
              disabled={!selectedQuestionsCount}
              onClick={handleStartInterview}
            >
              🚀 Launch Interview Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
