async function runAgentTests() {
  const url = 'http://localhost:5000/api/test/agents';
  
  console.log('--- TRIGGERING MULTI-AGENT PIPELINE VERIFICATION ---');
  console.log(`Sending POST request to ${url}... (this may take a few seconds if calling Claude API)`);
  
  try {
    const start = Date.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`Request completed in ${duration}s.`);
    console.log('Response Status:', res.status);
    
    const body = await res.json();
    if (!res.ok) {
      console.error('API Error Response:', JSON.stringify(body, null, 2));
      return;
    }
    
    console.log('\n--- 1. Interviewer Agent Output ---');
    console.log(JSON.stringify(body.data.interviewer, null, 2));
    
    console.log('\n--- 2. Evaluator Agent Output ---');
    console.log(JSON.stringify(body.data.evaluator, null, 2));
    
    console.log('\n--- 3. Career Coach Agent Output ---');
    console.log(JSON.stringify(body.data.coach, null, 2));
    
    console.log('\n--- VERIFICATION STATUS ---');
    console.log('Result Status Success:', body.success);
    console.log(body.message);

  } catch (err) {
    console.error('Fetch Failed:', err);
  }
}

runAgentTests();
