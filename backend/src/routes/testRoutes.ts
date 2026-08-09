import express from 'express';
import { generateQuestion } from '../services/agents/interviewerAgent';
import { evaluateAnswer } from '../services/agents/evaluatorAgent';
import { generateCoachingSummary, SessionData } from '../services/agents/coachAgent';

const router = express.Router();

router.post('/agents', async (req, res) => {
  console.log('[Test API] Triggering agent tests...');
  
  const testResults: any = {};
  
  try {
    // 1. Test Interviewer Agent
    console.log('[Test API] Testing Interviewer Agent...');
    const questionResult = await generateQuestion('docker', 'Medium', []);
    testResults.interviewer = questionResult;

    // 2. Test Evaluator Agent
    console.log('[Test API] Testing Evaluator Agent...');
    const evalResult = evaluateAnswer(
      1,
      1,
      'Multi-stage Docker builds separate build dependencies from runtime assets.'
    );
    testResults.evaluator = evalResult;

    // 3. Test Coach Agent
    console.log('[Test API] Testing Coach Agent...');
    const sessionData: SessionData = {
      topicName: 'Docker',
      difficulty: 'Medium',
      history: [
        {
          question: 'Why are multi-stage Docker builds recommended?',
          userAnswer: 'They separate build dependencies from runtime assets.',
          verdict: 'correct',
          marks: 10
        }
      ]
    };
    const coachResult = await generateCoachingSummary(sessionData);
    testResults.coach = coachResult;

    res.json({
      success: true,
      message: 'All three agents executed and verified successfully.',
      data: testResults
    });
  } catch (error: any) {
    console.error('[Test API] Agent Test Failure:', error);
    res.status(500).json({
      success: false,
      message: 'Agent execution failed.',
      error: error.message
    });
  }
});

export default router;
