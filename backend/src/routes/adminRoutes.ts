import express from 'express';
import { protect, admin, AuthRequest } from '../middleware/authMiddleware';
import { Session } from '../models/Session';

const router = express.Router();

// GET /api/admin/analytics (admin only)
router.get('/analytics', protect as any, admin as any, async (req: AuthRequest, res) => {
  try {
    const sessions = await Session.find({ isCompleted: true });

    // 1. Avg score per topic
    const topicStats: Record<string, { totalMarks: number, totalQuestions: number }> = {};
    
    // 2. Avg score by difficulty
    const diffStats: Record<string, { totalMarks: number, totalQuestions: number }> = {};
    
    // 3. Most commonly missed concepts
    const missedConceptsCount: Record<string, number> = {};
    
    // 4. Total sessions over time
    const sessionsOverTime: Record<string, number> = {};

    sessions.forEach(s => {
      // Topic stats
      if (!topicStats[s.topic]) {
        topicStats[s.topic] = { totalMarks: 0, totalQuestions: 0 };
      }
      const tStat = topicStats[s.topic]!;
      tStat.totalMarks += s.totalMarks;
      tStat.totalQuestions += s.totalQuestions;

      // Difficulty stats
      if (!diffStats[s.difficulty]) {
        diffStats[s.difficulty] = { totalMarks: 0, totalQuestions: 0 };
      }
      const dStat = diffStats[s.difficulty]!;
      dStat.totalMarks += s.totalMarks;
      dStat.totalQuestions += s.totalQuestions;

      // Missed concepts
      s.questions.forEach(q => {
        if (q.pointsMissed) {
          q.pointsMissed.forEach(concept => {
            const trimmed = concept.trim();
            if (trimmed) {
              missedConceptsCount[trimmed] = (missedConceptsCount[trimmed] || 0) + 1;
            }
          });
        }
      });

      // Daily sessions count (YYYY-MM-DD)
      const dateStr = s.createdAt.toISOString().split('T')[0] || 'Unknown';
      sessionsOverTime[dateStr] = (sessionsOverTime[dateStr] || 0) + 1;
    });

    // Format topic stats
    const avgScoreByTopic = Object.keys(topicStats).map(topic => {
      const stats = topicStats[topic]!;
      return {
        topic,
        averageScore: stats.totalQuestions > 0 ? Number((stats.totalMarks / stats.totalQuestions).toFixed(2)) : 0
      };
    });

    // Format difficulty stats
    const avgScoreByDifficulty = ['Easy', 'Medium', 'Hard'].map(difficulty => {
      const stats = diffStats[difficulty] || { totalMarks: 0, totalQuestions: 0 };
      return {
        difficulty,
        averageScore: stats.totalQuestions > 0 ? Number((stats.totalMarks / stats.totalQuestions).toFixed(2)) : 0
      };
    });

    // Format missed concepts (top 10)
    const topMissedConcepts = Object.keys(missedConceptsCount)
      .map(concept => ({
        concept,
        count: missedConceptsCount[concept] || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Format sessions over time (sorted by date)
    const sessionsTimeline = Object.keys(sessionsOverTime)
      .map(date => ({
        date,
        count: sessionsOverTime[date] || 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      avgScoreByTopic,
      avgScoreByDifficulty,
      topMissedConcepts,
      sessionsTimeline
    });
  } catch (error: any) {
    console.error('[Admin Route] Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to retrieve analytics dashboard data', error: error.message });
  }
});

export default router;
