async function runRbacTests() {
  const baseUrl = 'http://localhost:5000/api';
  const timestamp = Date.now();
  const candidateEmail = `candidate_${timestamp}@test.com`;
  const recruiterEmail = `recruiter_${timestamp}@test.com`;
  const adminEmail = `admin_${timestamp}@test.com`;
  const password = 'Password123!';

  console.log('--- STARTING ROLE-BASED ACCESS CONTROL (RBAC) VERIFICATION ---');

  try {
    // 1. Helper to register and login
    const getSessionToken = async (name, email, role) => {
      // Register
      const reg = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const regData = await reg.json();
      return regData.token;
    };

    console.log('[RBAC] Provisioning test users...');
    const candidateToken = await getSessionToken('Test Candidate', candidateEmail, 'candidate');
    const recruiterToken = await getSessionToken('Test Recruiter', recruiterEmail, 'recruiter');
    const adminToken = await getSessionToken('Test Admin', adminEmail, 'admin');

    console.log('[RBAC] User tokens successfully generated.');

    // Helper to query and report
    const verifyRoute = async (routeName, endpoint, token, expectedStatus) => {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const success = res.status === expectedStatus;
      console.log(`Endpoint: ${endpoint} | Role: ${routeName} | Expected: ${expectedStatus} | Got: ${res.status} | RESULT: ${success ? '✅ PASS' : '❌ FAIL'}`);
      return success;
    };

    let allPassed = true;

    console.log('\n--- VERIFYING RECRUITER ROUTE: GET /api/recruiter/candidates ---');
    allPassed = await verifyRoute('Candidate', '/recruiter/candidates', candidateToken, 403) && allPassed;
    allPassed = await verifyRoute('Recruiter', '/recruiter/candidates', recruiterToken, 200) && allPassed;
    allPassed = await verifyRoute('Admin', '/recruiter/candidates', adminToken, 200) && allPassed;

    console.log('\n--- VERIFYING ADMIN ROUTE: GET /api/admin/analytics ---');
    allPassed = await verifyRoute('Candidate', '/admin/analytics', candidateToken, 403) && allPassed;
    allPassed = await verifyRoute('Recruiter', '/admin/analytics', recruiterToken, 403) && allPassed;
    allPassed = await verifyRoute('Admin', '/admin/analytics', adminToken, 200) && allPassed;

    console.log('\n--- RBAC TEST SUMMARY ---');
    if (allPassed) {
      console.log('🎉 ALL RBAC AUTHORIZATION TESTS PASSED SUCCESSFULLY!');
    } else {
      console.error('❌ SOME RBAC TESTS FAILED. PLEASE CHECK ROUTE MIDDLEWARES.');
    }

  } catch (err) {
    console.error('[RBAC] Test execution failed with error:', err);
  }
}

runRbacTests();
