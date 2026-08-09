async function runTests() {
  const baseUrl = 'http://localhost:5000/api';
  const email = `test_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log('--- TEST 1: Register User ---');
  try {
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email,
        password,
        role: 'candidate'
      })
    });
    const regData = await regRes.json();
    console.log('Register Status:', regRes.status);
    console.log('Register Response:', JSON.stringify(regData, null, 2));

    if (regRes.status !== 201) {
      console.error('Registration failed!');
      return;
    }

    console.log('\n--- TEST 2: Register same user again (should fail) ---');
    const regRes2 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email,
        password,
        role: 'candidate'
      })
    });
    const regData2 = await regRes2.json();
    console.log('Register Duplicate Status:', regRes2.status);
    console.log('Register Duplicate Response:', JSON.stringify(regData2, null, 2));

    console.log('\n--- TEST 3: Login User with correct credentials ---');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    console.log('Login Status:', loginRes.status);
    console.log('Login Response:', JSON.stringify(loginData, null, 2));

    if (loginRes.status !== 200) {
      console.error('Login failed!');
      return;
    }

    const token = loginData.token;

    console.log('\n--- TEST 4: Login with wrong password ---');
    const loginRes2 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'wrongpassword' })
    });
    const loginData2 = await loginRes2.json();
    console.log('Login Wrong Pass Status:', loginRes2.status);
    console.log('Login Wrong Pass Response:', JSON.stringify(loginData2, null, 2));

    console.log('\n--- TEST 5: Access protected route ---');
    const dashboardRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dashboardData = await dashboardRes.json();
    console.log('Dashboard Status:', dashboardRes.status);
    console.log('Dashboard Response:', JSON.stringify(dashboardData, null, 2));

    console.log('\n--- TEST 6: Fetch topics ---');
    const topicsRes = await fetch(`${baseUrl}/topics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const topicsData = await topicsRes.json();
    console.log('Topics Status:', topicsRes.status);
    console.log('Topics List Length:', topicsData.length);
    console.log('Sample Topic (first item):', JSON.stringify(topicsData[0], null, 2));

  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

runTests();
