const { createClient } = require('@supabase/supabase-js');
const url = process.env.SUPABASE_URL || 'https://waizpfclurmujnxscxyd.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_udOrPrSH4-w2sJFaCLZZlA_gqNW3A2BVITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'; // I'll get the real one from env
