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
  
  const res = await fetch('http://localhost:3000/api/admin/create-auth-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      email: `revenda_${Date.now()}@test.com`,
      password: 'TestPassword123!',
      full_name: 'Test Reseller',
      role: 'RESELLER'
    })
  });
  const json = await res.json();
  console.log("Response:", json);
}
run();
