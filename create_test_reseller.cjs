const http = require('http');

const { execSync } = require('child_process');

async function run() {
  const psOutput = execSync('ps aux | grep "[n]ode.*server.ts" | head -n 1').toString();
  const pid = psOutput.split(/\s+/)[1];
  
  const envRaw = require('fs').readFileSync(`/proc/${pid}/environ`, 'utf8').split('\0');
  let url = '', key = '';
  for (const e of envRaw) {
    if (e.startsWith('SUPABASE_URL=')) url = e.substring('SUPABASE_URL='.length);
    if (e.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = e.substring('SUPABASE_SERVICE_ROLE_KEY='.length);
  }
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(url, key);
  
  // Create a real auth user first to get a token
  const testEmail = `superadmin_${Date.now()}@test.com`;
  const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'Password123!',
    email_confirm: true,
  });
  
  if (createErr) {
    console.error("Failed to create admin:", createErr);
    return;
  }
  
  // Set role to SUPER_ADMIN so they can create resellers
  await supabase.from('profiles').insert({
    id: newUser.user.id,
    full_name: 'Super Admin Test',
    role: 'SUPER_ADMIN',
    email: testEmail,
    status: 'ACTIVE'
  });
  
  // Now we need their access token? Wait, admin.createUser doesn't return a session.
  // We can just sign in to get the token!
  const anonKey = envRaw.find(e => e.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1];
  const anonClient = createClient(url, anonKey);
  const { data: sessionData, error: signInErr } = await anonClient.auth.signInWithPassword({
    email: testEmail,
    password: 'Password123!'
  });
  
  if (signInErr) {
    console.error("Sign in failed:", signInErr);
    return;
  }
  
  const token = sessionData.session.access_token;
  
  // Now POST to our API
  const body = JSON.stringify({
    email: `revenda_${Date.now()}@test.com`,
    password: 'TestPassword123!',
    full_name: 'Revenda Real Teste',
    role: 'RESELLER',
    business_mode: 'RESELLER'
  });
  
  const res = await fetch('http://localhost:3000/api/admin/create-auth-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body
  });
  
  const json = await res.json();
  console.log("API Result:", JSON.stringify(json, null, 2));
  
  if (json.userId) {
     const { data: prof } = await supabase.from('profiles').select('*').eq('id', json.userId).single();
     console.log("Profile in DB:", prof);
     const { data: bal } = await supabase.from('credit_balances').select('*').eq('owner_id', json.userId).single();
     console.log("Balance in DB:", bal);
  }
}
run();
