import express from 'express';
import { protect, checkRoles, AuthRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { Session } from '../models/Session';

const router = express.Router();

// Allow recruiters and admins
const authorizeRecruiterOrAdmin = checkRoles(['recruiter', 'admin']);

// 1. GET /api/recruiter/candidates
router.get('/candidates', protect as any, authorizeRecruiterOrAdmin as any, async (req: AuthRequest, res) => {
  try {
    // Get all candidates
    const candidates = await User.find({ role: 'candidate' }).select('-passwordHash');
    
    const candidateSummaries = [];

    for (const candidate of candidates) {
      // Find all completed sessions for this candidate
      const sessions = await Session.find({ candidateId: candidate._id, isCompleted: true });
      
      const topics = new Set<string>();
      const difficulties = new Set<string>();
      let totalMarks = 0;
      let totalQuestions = 0;

      sessions.forEach(s => {
        topics.add(s.topic);
        difficulties.add(s.difficulty);
        totalMarks += s.totalMarks;
        totalQuestions += s.totalQuestions;
      });

      // Calculate average score (average marks out of 10 per question)
      const avgScore = totalQuestions > 0 ? Number((totalMarks / totalQuestions).toFixed(2)) : 0;

      candidateSummaries.push({
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        createdAt: candidate.createdAt,
        sessionsTaken: sessions.length,
        averageScore: avgScore, // out of 10
        topicsCovered: Array.from(topics),
        difficultiesCovered: Array.from(difficulties)
      });
    }

    res.json(candidateSummaries);
  } catch (error: any) {
    console.error('[Recruiter Route] Error fetching candidates:', error);
    res.status(500).json({ message: 'Failed to retrieve candidates list', error: error.message });
  }
});

// 2. GET /api/recruiter/candidate/:id/sessions
router.get('/candidate/:id/sessions', protect as any, authorizeRecruiterOrAdmin as any, async (req: AuthRequest, res) => {
  try {
    const candidateId = req.params.id;
    
    const candidate = await User.findById(candidateId).select('-passwordHash');
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const sessions = await Session.find({ candidateId }).sort({ createdAt: -1 });

    res.json({
      candidate,
      sessions
    });
  } catch (error: any) {
    console.error('[Recruiter Route] Error fetching candidate sessions:', error);
    res.status(500).json({ message: 'Failed to retrieve candidate sessions', error: error.message });
  }
});

export default router;
