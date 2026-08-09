import express from 'express';
import { protect, AuthRequest } from '../middleware/authMiddleware';
import { Session } from '../models/Session';
import { generateQuestion } from '../services/agents/interviewerAgent';
import { evaluateAnswer } from '../services/agents/evaluatorAgent';
import { generateCoachingSummary, SessionData } from '../services/agents/coachAgent';
import { 
  validateSchema, 
  sessionStartSchema, 
  questionGenerateSchema, 
  answerSubmitSchema 
} from '../middleware/validation';

const router = express.Router();

// 1. POST /api/session/start
router.post('/session/start', protect as any, validateSchema(sessionStartSchema) as any, async (req: AuthRequest, res) => {
  try {
    const { topic, difficulty, totalQuestions } = req.body;
    const candidateId = req.user?._id;

    // Delete any stale 0-question abandoned sessions for this candidate
    // (avoids Mongoose VersionError from reusing stale documents)
    await Session.deleteMany({
      candidateId,
      isCompleted: false,
      questionsAnswered: 0
    });

    // Always create a fresh session
    const session = await Session.create({
      candidateId,
      topic,
      difficulty,
      totalQuestions: Number(totalQuestions),
      questionsAnswered: 0,
      totalMarks: 0,
      isCompleted: false,
      questions: []
    });

    res.status(201).json(session);
  } catch (error: any) {
    console.error('[Session Route] Error starting session:', error);
    res.status(500).json({ message: 'Failed to start interview session', error: error.message });
  }
});

const handleGetNextQuestion = async (req: AuthRequest, res: any) => {
  try {
    const { sessionId } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.candidateId.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this session' });
    }

    // Check if session is already completed or all questions answered
    if (session.isCompleted || session.questionsAnswered >= session.totalQuestions) {
      session.isCompleted = true;
      await session.save();
      return res.status(200).json({ isCompleted: true });
    }

    // 1. Check if there's an existing unanswered question in session.questions
    const unansweredQuestion = session.questions.find((q: any) => q.userSelectedIndex === undefined);
    if (unansweredQuestion) {
      return res.status(200).json({
        questionId: unansweredQuestion._id,
        question: unansweredQuestion.question,
        options: unansweredQuestion.options,
        isCompleted: false
      });
    }

    // 2. If no unanswered question and we haven't reached totalQuestions limit, generate a new one
    if (session.questions.length < session.totalQuestions) {
      const previousQuestions = session.questions.map(q => q.question);

      console.log(`[Session Route] Generating question ${session.questions.length + 1}/${session.totalQuestions} for topic: ${session.topic}, difficulty: ${session.difficulty}`);
      const generated = await generateQuestion(session.topic, session.difficulty as any, previousQuestions);

      session.questions.push({
        question: generated.question,
        options: generated.options,
        correctOptionIndex: generated.correctOptionIndex,
        explanation: generated.explanation,
        referenceAnswer: generated.options[generated.correctOptionIndex],
        keyPointsExpected: [generated.options[generated.correctOptionIndex] || '']
      } as any);

      await session.save();

      const newQuestion = session.questions[session.questions.length - 1];

      return res.status(200).json({
        questionId: newQuestion._id,
        question: newQuestion.question,
        options: newQuestion.options,
        isCompleted: false
      });
    }

    // 3. Fallback: all generated & answered
    session.isCompleted = true;
    await session.save();
    return res.status(200).json({ isCompleted: true });
  } catch (error: any) {
    console.error('[Session Route] Error generating question:', error);
    res.status(500).json({ message: 'Failed to generate question', error: error.message });
  }
};

router.post('/question/next', protect as any, handleGetNextQuestion as any);
router.post('/question/generate', protect as any, handleGetNextQuestion as any);

// 3. POST /api/answer/submit
router.post('/answer/submit', protect as any, validateSchema(answerSubmitSchema) as any, async (req: AuthRequest, res) => {
  try {
    const { sessionId, questionId, userSelectedIndex } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.candidateId.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this session' });
    }

    const question = session.questions.find((q: any) => q._id.toString() === questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found in this session' });
    }

    if (question.userSelectedIndex !== undefined) {
      return res.status(400).json({ message: 'This question has already been answered' });
    }

    const selectedIndex = Number(userSelectedIndex);
    const evaluation = evaluateAnswer(selectedIndex, question.correctOptionIndex, question.explanation);

    question.userSelectedIndex = selectedIndex;
    question.isCorrect = evaluation.isCorrect;
    question.marks = evaluation.marks;
    question.verdict = evaluation.isCorrect ? 'correct' : 'incorrect';
    question.userAnswer = question.options[selectedIndex] || `Option ${selectedIndex}`;
    question.explanation = evaluation.explanation;

    session.questionsAnswered += 1;
    session.totalMarks += evaluation.marks;

    if (session.questionsAnswered >= session.totalQuestions) {
      session.isCompleted = true;
    }

    await session.save();

    // Silent response - do NOT leak verdict, marks, or explanation yet!
    res.status(200).json({
      success: true,
      isCompleted: session.isCompleted,
      questionsAnswered: session.questionsAnswered,
      totalQuestions: session.totalQuestions
    });
  } catch (error: any) {
    console.error('[Session Route] Error submitting answer:', error);
    res.status(500).json({ message: 'Failed to submit answer', error: error.message });
  }
});

// 3.5. GET /api/sessions/my
router.get('/sessions/my', protect as any, async (req: AuthRequest, res) => {
  try {
    const candidateId = req.user?._id;
    const sessions = await Session.find({ 
      candidateId,
      $or: [
        { isCompleted: true },
        { questionsAnswered: { $gt: 0 } }
      ]
    }).sort({ createdAt: -1 });
    res.status(200).json(sessions);
  } catch (error: any) {
    console.error('[Session Route] Error getting my sessions:', error);
    res.status(500).json({ message: 'Failed to retrieve sessions list', error: error.message });
  }
});

// 4. GET /api/session/:id/report
router.get('/session/:id/report', protect as any, async (req: AuthRequest, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.candidateId.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this session' });
    }

    if (!session.isCompleted) {
      return res.status(400).json({ message: 'Session is not completed yet' });
    }

    if (!session.coachingSummary || !session.coachingSummary.overallFeedback) {
      console.log(`[Session Route] Generating coaching report for session: ${session._id}`);
      
      const historyData: SessionData = {
        topicName: session.topic,
        difficulty: session.difficulty as any,
        history: session.questions.map(q => ({
          question: q.question,
          userAnswer: q.options[q.userSelectedIndex ?? 0] || '',
          verdict: q.isCorrect ? 'correct' : 'incorrect',
          marks: q.marks || 0
        }))
      };

      const coachReport = await generateCoachingSummary(historyData);
      
      session.coachingSummary = {
        overallFeedback: coachReport.overallFeedback,
        strengths: coachReport.strengths,
        weakAreas: coachReport.weakAreas,
        recommendedResources: coachReport.recommendedResources,
        nextSteps: coachReport.nextSteps
      };

      await session.save();
    }

    res.status(200).json(session);
  } catch (error: any) {
    console.error('[Session Route] Error getting report:', error);
    res.status(500).json({ message: 'Failed to retrieve coaching report', error: error.message });
  }
});

export default router;
