import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = 'https://waizpfclurmujnxscxyd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaXpwZmNsdXJtdWpueHNjeHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzQxNzMsImV4cCI6MjEwMDkxMDE3M30.kiLVchYrRQ1QYcZoqfXSU8Zu5d7HnV2hmCYUdoDFrEg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
    email: 'hplaysmart@protonmail.com',
    password: 'ChangeMe123!'
  });
  console.log("Logged in?", user?.id);
  // We don't have exec_sql. Is there a way to run sql?
  // Wait, I can use the cloudsql-execute-sql skill or similar? No, this is Supabase PostgreSQL.
}
run();
