const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

const regex = /<select[\s\S]*?value=\{endUserFormPlanId\}[\s\S]*?onChange=\{\(e\) => setEndUserFormPlanId\(e\.target\.value\)\}[\s\S]*?>[\s\S]*?<\/select>/;

const replacement = `{plans.filter(p => p.status === 'ACTIVE' && p.deleted_at === null).length === 0 ? (
                    <div className="w-full bg-[#000000] border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400 font-medium">
                      Nenhum Plano de Licença ativo foi cadastrado pelo Super Admin.
                    </div>
                  ) : (
                  <select
                    value={endUserFormPlanId}
                    onChange={(e) => setEndUserFormPlanId(e.target.value)}
                    className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                    required
                  >
                    <option value="" disabled>Selecione um plano</option>
                    {plans.filter(p => p.status === 'ACTIVE' && p.deleted_at === null).map((p) => {
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
                    })}
                  </select>
                  )}`;

content = content.replace(regex, replacement);

const buttonRegex = /<button[\s\S]*?type="submit"[\s\S]*?>[\s\S]*?Salvar Usuário Final[\s\S]*?<\/button>/;
const buttonReplacement = `<button
                type="submit"
                disabled={!editingEndUser && plans.filter(p => p.status === 'ACTIVE' && p.deleted_at === null).length === 0}
                className="flex-1 bg-[#6A00FF] hover:bg-[#5900D9] disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Salvar Usuário Final
              </button>`;

content = content.replace(buttonRegex, buttonReplacement);

fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', content);
console.log('Empty state added.');
