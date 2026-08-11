const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

// Fix button type
code = code.replace(
  /<button\s*type="button"\s*className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm border border-white\/10 cursor-pointer"\s*>\s*Confirmar Redefinição\s*<\/button>/,
  `<button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!resetGeneratedPassword) return;
                    
                    const btn = e.currentTarget;
                    btn.disabled = true;
                    btn.innerText = 'Redefinindo...';
                    
                    try {
                      const res = await fetch('/api/admin/reset-user-password', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': \`Bearer \${localStorage.getItem('supabase_auth_token') || ''}\` // Need to get the actual session token, Supabase SDK might be easier... Wait, I can just use supabase.auth.getSession()
                        },
                        body: JSON.stringify({ userId: selectedUserForResetPassword.id, newPassword: resetGeneratedPassword })
                      });
                      
                      const data = await res.json();
                      if (data.success) {
                        showToast('Senha redefinida com sucesso.');
                        setSelectedUserForResetPassword(null);
                      } else {
                        showToast(data.error || 'Erro ao redefinir a senha.');
                      }
                    } catch (err: any) {
                       showToast('Erro de conexão com o servidor.');
                    } finally {
                       btn.disabled = false;
                       btn.innerText = 'Confirmar Redefinição';
                    }
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm border border-white/10 cursor-pointer disabled:opacity-50"
                >
                  Confirmar Redefinição
                </button>`
);

// We need to fetch the session token
code = code.replace(
  /'Authorization': \`Bearer \$\{localStorage.getItem\('supabase_auth_token'\) \|\| ''\}\` \/\/ Need to get the actual session token, Supabase SDK might be easier\.\.\. Wait, I can just use supabase\.auth\.getSession\(\)/,
  `'Authorization': \`Bearer \${(await supabase.auth.getSession()).data.session?.access_token || ''}\``
);

fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', code);
