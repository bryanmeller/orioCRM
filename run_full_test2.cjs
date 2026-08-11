const http = require('http');

async function run() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(url, key);
  
  // Create a real SUPER_ADMIN directly with Admin API
  const testEmail = `superadmin_${Date.now()}@test.com`;
  const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'Password123!',
    email_confirm: true,
  });
  
  const adminId = newUser.user.id;
  await supabase.from('profiles').insert({
    id: adminId,
    full_name: 'Super Admin Test',
    role: 'SUPER_ADMIN',
    email: testEmail,
    status: 'ACTIVE'
  });
  
  const anonClient = createClient(url, anonKey);
  const { data: sessionData, error: signInErr } = await anonClient.auth.signInWithPassword({
    email: testEmail,
    password: 'Password123!'
  });
  
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
  console.log("RESELLER JSON:", json1);
  
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
  console.log("PROVIDER JSON:", json2);
}
run();
