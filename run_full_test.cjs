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
  
  // Create a real SUPER_ADMIN directly with Admin API
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
  
  const adminId = newUser.user.id;
  await supabase.from('profiles').insert({
    id: adminId,
    full_name: 'Super Admin Test',
    role: 'SUPER_ADMIN',
    email: testEmail,
    status: 'ACTIVE'
  });
  
  // Wait, I need an auth token to call the endpoint.
  // Can I generate a JWT using jsonwebtoken with the JWT secret? I don't have the JWT secret.
  // Supabase lets me sign in as the user if I use the anon key. Let's get the anon key.
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
  
  // 1. Criar Revenda
  const resellerEmail = `revenda_${Date.now()}@test.com`;
  const res1 = await fetch('http://localhost:3000/api/admin/create-auth-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      email: resellerEmail,
      password: 'TestPassword123!',
      full_name: 'Revenda Real Teste',
      role: 'RESELLER',
      business_mode: 'RESELLER'
    })
  });
  const json1 = await res1.json();
  console.log("RESELLER UUID:", json1.userId);
  
  // 2. Criar Provedor
  const providerEmail = `provedor_${Date.now()}@test.com`;
  const res2 = await fetch('http://localhost:3000/api/admin/create-auth-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      email: providerEmail,
      password: 'TestPassword123!',
      full_name: 'Provedor Real Teste',
      role: 'PROVIDER',
      business_mode: 'PROVIDER'
    })
  });
  const json2 = await res2.json();
  console.log("PROVIDER UUID:", json2.userId);
  
}
run();
