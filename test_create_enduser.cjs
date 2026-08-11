async function run() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const { createClient } = require('@supabase/supabase-js');
  const anonClient = createClient(url, anonKey);
  const { data: sessionData } = await anonClient.auth.signInWithPassword({
    email: 'admin@streamflixtv.local',
    password: 'Admin@123456'
  });
  const token = sessionData.session.access_token;
  
  // Find a plan ID
  const { data: plans } = await anonClient.from('license_plans').select('*').limit(1);
  if (!plans || plans.length === 0) {
    console.error("No license plans found");
    return;
  }
  const planId = plans[0].id;
  
  const res = await fetch('http://localhost:3000/api/admin/create-auth-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      email: `enduser_${Date.now()}@test.com`,
      password: 'TestPassword123!',
      full_name: 'Test End User',
      username: `user_${Date.now()}`,
      role: 'END_USER',
      plan_id: planId
    })
  });
  const json = await res.json();
  console.log("Response:", json);
}
run();
