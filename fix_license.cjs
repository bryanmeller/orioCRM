const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const regex = /if \(licError\) \{\s*await supabaseAdmin\.auth\.admin\.deleteUser\(userId\);\s*await supabaseAdmin\.from\('profiles'\)\.delete\(\)\.eq\('id', userId\);\s*return res\.status\(500\)\.json\(\{ error: 'Erro ao criar licença\.' \}\);\s*\}/m;

const replacement = `if (licError) {
           console.error('License Insert Error:', licError);
           await supabaseAdmin.auth.admin.deleteUser(userId);
           await supabaseAdmin.from('profiles').delete().eq('id', userId);
           return res.status(500).json({ error: 'Erro ao criar licença.', code: licError.code, details: licError.message });
        }`;

serverCode = serverCode.replace(regex, replacement);

const originRegex = /origin: origin \|\| 'WEB',/m;
const originReplacement = `origin: creatorProfile.role,`;
serverCode = serverCode.replace(originRegex, originReplacement);

fs.writeFileSync('server.ts', serverCode);
