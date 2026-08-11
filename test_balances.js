import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || 'https://waizpfclurmujnxscxyd.supabase.co', process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaXpwZmNsdXJtdWpueHNjeHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzQxNzMsImV4cCI6MjEwMDkxMDE3M30.kiLVchYrRQ1QYcZoqfXSU8Zu5d7HnV2hmCYUdoDFrEg');
async function run() {
  const { data } = await supabase.from('credit_balances').select('*').limit(1);
  console.log(data);
}
run();
