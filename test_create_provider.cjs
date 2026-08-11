const http = require('http');

async function run() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  const { createClient } = require('@supabase/supabase-js');
  const anonClient = createClient(url, anonKey);
  
  // Login as admin
  const { data: sessionData, error: signInErr } = await anonClient.auth.signInWithPassword({
    email: 'admin@streamflixtv.local',
    password: 'Admin@123456'
  });
  
  if (signInErr) {
    console.error("Sign in failed:", signInErr);
    return;
  }
  
  const token = sessionData.session.access_token;
  
  // Create Provider
  const res = await fetch('http://localhost:3000/api/admin/create-auth-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      email: `prov_${Date.now()}@test.com`,
      password: 'TestPassword123!',
      full_name: 'Test Provider',
      role: 'PROVIDER'
    })
  });
  const json = await res.json();
  console.log("Response:", json);
}
run();
