import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface TopicAnalytics {
  topic: string;
  averageScore: number;
}

interface DifficultyAnalytics {
  difficulty: string;
  averageScore: number;
}

interface MissedConcept {
  concept: string;
  count: number;
}

interface TimelineData {
  date: string;
  count: number;
}

interface AnalyticsData {
  avgScoreByTopic: TopicAnalytics[];
  avgScoreByDifficulty: DifficultyAnalytics[];
  topMissedConcepts: MissedConcept[];
  sessionsTimeline: TimelineData[];
}

import { API_BASE_URL } from '../config/api';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/admin/analytics`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        setData(response.data);
      } catch (err: any) {
        console.error('[Admin Analytics] Fetch error:', err);
        setError(err.response?.data?.message || 'Failed to load admin analytics metrics.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchAnalytics();
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #6366f1', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', padding: '32px', textAlign: 'center', fontFamily: 'Inter, sans-serif', background: 'rgba(15,23,42,0.65)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px' }}>
        <h2 style={{ color: '#fca5a5', marginTop: 0 }}>Analytics Error</h2>
        <p style={{ color: '#cbd5e1' }}>{error || 'Analytics could not be loaded.'}</p>
      </div>
    );
  }

  return (
    <div 
      className="admin-page-wrapper"
    >
      <div>
        <h1 className="admin-header-title">Analytics Panel</h1>
        <p className="admin-header-sub">System-wide performance telemetry, missed concepts analytics, and usage timelines.</p>
      </div>

      <div className="analytics-grid-layout">
        {/* Chart 1: Scores by Topic */}
        <div className="glass-chart-card">
          <div className="chart-box-title">Average Score by Domain (Out of 10)</div>
          {data.avgScoreByTopic.length > 0 ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={data.avgScoreByTopic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="topic" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff' }}
                    formatter={(value) => [`${value} / 10`, 'Average Score']} 
                  />
                  <Bar dataKey="averageScore" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="empty-chart-text">No domain telemetry logged yet.</p>
          )}
        </div>

        {/* Chart 2: Scores by Difficulty */}
        <div className="glass-chart-card">
          <div className="chart-box-title">Average Score by Difficulty (Out of 10)</div>
          {data.avgScoreByDifficulty.some(d => d.averageScore > 0) ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={data.avgScoreByDifficulty} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="difficulty" stroke="#94a3b8" />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff' }}
                    formatter={(value) => [`${value} / 10`, 'Average Score']} 
                  />
                  <Bar dataKey="averageScore" fill="#a855f7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="empty-chart-text">No difficulty analytics logged yet.</p>
          )}
        </div>

        {/* Chart 3: Top Missed Concepts */}
        <div className="glass-chart-card">
          <div className="chart-title">Top 10 Most Missed Concepts</div>
          {data.topMissedConcepts.length > 0 ? (
            <div className="missed-items-stack">
              {data.topMissedConcepts.map((item, index) => (
                <div key={index} className="missed-row-item">
                  <span className="concept-name-text">
                    <span style={{ color: '#6366f1', marginRight: '10px' }}>#{index + 1}</span>
                    {item.concept}
                  </span>
                  <span className="missed-count-pill">{item.count} missed</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-chart-text">No missed concepts logged yet.</p>
          )}
        </div>

        {/* Chart 4: Platform Usage Timeline */}
        <div className="glass-chart-card">
          <div className="chart-title">Sessions Completed Over Time</div>
          {data.sessionsTimeline.length > 0 ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={data.sessionsTimeline} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis allowDecimals={false} stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff' }}
                    formatter={(value) => [value, 'Sessions Completed']} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} name="Total Sessions" dot={{ r: 5, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="empty-chart-text">No timeline logs found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
