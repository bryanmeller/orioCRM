const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: lic } = await supabase.from('licenses').select('*').eq('code', 'O1ZJG8');
  console.log('License O1ZJG8:', lic);
  
  if (lic && lic.length > 0) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', lic[0].end_user_id);
      console.log('Profile:', profile);
  }
}
run();
