const { createClient } = require('@supabase/supabase-js');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
  const timestamp = Date.now();
  const email = `test_${timestamp}@test.com`;
  const username = `test_user_${timestamp}`;
  const full_name = `Test User ${timestamp}`;
  
  // 1. Create auth user
  console.log("Creating auth user...");
  const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: 'Password123!',
    email_confirm: true,
  });
  
  if (createErr) {
    console.error("Auth Error:", createErr);
    return;
  }
  
  console.log("Auth user created:", newUser.user.id);
  
  // 2. Create profile
  const profilePayload = {
    id: newUser.user.id,
    full_name,
    email,
    username,
    role: 'PROVIDER',
    business_mode: 'PROVIDER',
    status: 'ACTIVE',
    portal_access: true,
    parent_id: null
  };
  
  console.log("Profile Payload:", JSON.stringify(profilePayload, null, 2));
  
  const { error: profileErr } = await supabase
    .from('profiles')
    .insert(profilePayload);
    
  if (profileErr) {
    console.error("Profile Insert Error:", JSON.stringify(profileErr, null, 2));
  } else {
    console.log("Profile inserted successfully.");
  }
  
  // Cleanup
  console.log("Cleaning up...");
  await supabase.auth.admin.deleteUser(newUser.user.id);
}
run();
