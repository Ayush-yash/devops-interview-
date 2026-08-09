async function runE2E() {
  const baseUrl = 'http://localhost:5000/api';
  const email = `candidate_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log('--- STARTING CANDIDATE INTERVIEW FLOW E2E VERIFICATION ---');

  try {
    // 1. Register candidate
    console.log('\n[E2E] Registering new candidate...');
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Candidate DevOps', email, password })
    });
    const regData = await regRes.json();
    console.log('Register Status:', regRes.status);
    if (!regRes.ok) throw new Error('Registration failed');
    const token = regData.token;

    // 2. Start Session
    console.log('\n[E2E] Starting session: topic=Kubernetes, difficulty=Medium, questionsCount=3...');
    const startRes = await fetch(`${baseUrl}/session/start`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ topic: 'Kubernetes', difficulty: 'Medium', totalQuestions: 3 })
    });
    const session = await startRes.json();
    console.log('Session Start Status:', startRes.status);
    console.log('Session ID:', session._id);
    const sessionId = session._id;

    // 3. Question-Answer Loop (3 questions)
    for (let qNum = 1; qNum <= 3; qNum++) {
      console.log(`\n[E2E] --- Question ${qNum} ---`);
      
      // Generate question
      console.log(`[E2E] Generating question ${qNum}...`);
      const qRes = await fetch(`${baseUrl}/question/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      });
      const qData = await qRes.json();
      console.log('Question Generation Status:', qRes.status);
      console.log('Question Text:', qData.question);
      const questionId = qData.questionId;

      // Submit answer
      console.log(`[E2E] Submitting answer for question ${qNum}...`);
      const answerText = `For this Kubernetes scenario, I would configure a StatefulSet with a persistent volume claim templates to ensure stable identifiers and data durability. I would also add readiness and liveness probes to prevent routing issues.`;
      
      const submitRes = await fetch(`${baseUrl}/answer/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId, questionId, userAnswer: answerText })
      });
      const evalData = await submitRes.json();
      console.log('Answer Submission Status:', submitRes.status);
      console.log('Verdict:', evalData.verdict);
      console.log('Marks:', evalData.marks);
      console.log('AI Explanation:', evalData.explanation);
    }

    // 4. Retrieve Final Session Report and Coaching Roadmap
    console.log('\n[E2E] Fetching completed interview report...');
    const reportRes = await fetch(`${baseUrl}/session/${sessionId}/report`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const reportData = await reportRes.json();
    console.log('Report Fetch Status:', reportRes.status);
    console.log('Total Marks Scored:', reportData.totalMarks);
    console.log('Questions Answered:', reportData.questionsAnswered);
    console.log('Is Completed:', reportData.isCompleted);
    
    console.log('\n--- Career Coaching Feedback ---');
    console.log('Overall Career Feedback:', reportData.coachingSummary?.overallFeedback);
    console.log('Strengths:', reportData.coachingSummary?.strengths);
    console.log('Weak Areas:', reportData.coachingSummary?.weakAreas);
    console.log('Recommended Resources:', reportData.coachingSummary?.recommendedResources);
    console.log('Next Steps:', reportData.coachingSummary?.nextSteps);

    console.log('\n[E2E] Verification completed successfully!');

  } catch (err) {
    console.error('[E2E] flow crashed with error:', err);
  }
}

runE2E();
