const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  'const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);',
  'const supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;'
);

content = content.replace(
  '      if (!supabaseServiceKey) {',
  '      if (!supabaseAdmin) {'
);

fs.writeFileSync('server.ts', content);
