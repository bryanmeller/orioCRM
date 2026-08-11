const fs = require('fs');
let content = fs.readFileSync('src/hooks/useSupabaseData.ts', 'utf8');
content = content.replace(
  "supabase.from('license_plans').select('*').is('deleted_at', null).order('created_at', { ascending: false })",
  "supabase.from('license_plans').select('id, name, validity_days, reseller_credit_cost, self_service_price, devices_allowed, max_servers, trial_days, status, deleted_at').is('deleted_at', null).order('validity_days', { ascending: true })"
);
fs.writeFileSync('src/hooks/useSupabaseData.ts', content);
console.log('Fixed useSupabaseData.ts');
