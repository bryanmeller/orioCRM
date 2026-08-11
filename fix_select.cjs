const fs = require('fs');

const path = 'src/components/AdminPanel/AdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{plans\.map\(\(p\) => \([\s\S]*?<option key=\{p\.id\} value=\{p\.id\}>[\s\S]*?<\/option>\n\s*\}\)\}/g;

const replacement = `{plans.filter(p => p.status === 'ACTIVE' && p.deleted_at === null).map((p) => {
                      if (!p.name || !p.validity_days) {
                        console.error('Plano inválido:', p);
                        return <option key={p.id} value={p.id}>Plano inválido</option>;
                      }
                      
                      let label = '';
                      if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'PROVEDOR') {
                        label = \`\${p.name} — \${p.validity_days} dias\`;
                      } else {
                        if (p.reseller_credit_cost === undefined || p.reseller_credit_cost === null) {
                           console.error('Plano com custo inválido:', p);
                           return <option key={p.id} value={p.id}>Plano inválido</option>;
                        }
                        label = \`\${p.name} — \${p.validity_days} dias — \${p.reseller_credit_cost} créditos\`;
                      }
                      
                      return (
                        <option key={p.id} value={p.id}>
                          {label}
                        </option>
                      );
                    })}`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log('Replaced select options successfully.');
