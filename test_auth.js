import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@streamflixtv.local',
    password: 'Admin@123456'
  });
  console.log("Auth result:", error ? error.message : "Success");
  if (data?.user) {
    console.log("User UUID:", data.user.id);
    const { data: profile, error: pError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    if (pError) console.error("Profile Error:", pError.message);
    else console.log("Profile Data:", profile);
  }
}
test();
