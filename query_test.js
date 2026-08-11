import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://waizpfclurmujnxscxyd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaXpwZmNsdXJtdWpueHNjeHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzQxNzMsImV4cCI6MjEwMDkxMDE3M30.kiLVchYrRQ1QYcZoqfXSU8Zu5d7HnV2hmCYUdoDFrEg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const res = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
  console.log(res);
}
run();
