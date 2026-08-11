const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

const target1 = `<div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Código do Servidor (DNS)</label>
                  <input type="text" value={newAccServerCode} onChange={(e) => setNewAccServerCode(e.target.value)} className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-white/30" disabled={currentUser.role !== 'SUPER_ADMIN'} />
                </div>`;
const replacement1 = `<div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Código do Provedor</label>
                  <input type="text" value="gerado automaticamente" disabled className="w-full bg-[#000000] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-500 font-mono cursor-not-allowed focus:outline-none" />
                </div>`;
code = code.replace(target1, replacement1);

const targetTh = `<th className="p-3">Código do Servidor</th>`;
const replacementTh = `<th className="p-3">Código do Provedor</th>`;
code = code.replace(targetTh, replacementTh);

// Also we need to change where it displays `acc.server_code` to `acc.provider_code`
const targetTd = `<td className="p-3 font-mono text-gray-400">{acc.server_code || '-'}</td>`;
const replacementTd = `<td className="p-3 font-mono text-gray-400">{acc.provider_code || '-'}</td>`;
code = code.replace(targetTd, replacementTd);

fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', code);
