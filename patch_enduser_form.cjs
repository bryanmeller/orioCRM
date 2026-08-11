const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

// Replace label 1
content = content.replace(
  '<label className="text-xs font-bold text-gray-300 block mb-1">Selecione o Modelo do Código:</label>',
  '<label className="text-xs font-bold text-gray-300 block mb-1">Plano / Licença</label>'
);

// Replace label 2
content = content.replace(
  '<label className="text-xs font-bold text-gray-300 block mb-1">Selecione o Modelo do Código:</label>',
  '<label className="text-xs font-bold text-gray-300 block mb-1">Plano / Licença</label>'
);

// Replace checkboxes label
content = content.replace(
  '<label className="flex items-center gap-2 cursor-pointer mt-4">\n                    <input type="checkbox" checked={endUserFormPortalAccess} onChange={e => setEndUserFormPortalAccess(e.target.checked)} className="rounded border-white/20 bg-[#000000] text-[#6A00FF] focus:ring-[#6A00FF]" />\n                    <span className="text-xs font-medium text-gray-300">Permitir acesso ao Portal do Cliente (Self-Service)</span>\n                  </label>',
  `{currentUser.role === 'SUPER_ADMIN' && (
                  <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <input type="checkbox" checked={endUserFormPortalAccess} onChange={e => setEndUserFormPortalAccess(e.target.checked)} className="rounded border-white/20 bg-[#000000] text-[#6A00FF] focus:ring-[#6A00FF]" />
                    <span className="text-xs font-medium text-gray-300">Permitir acesso ao Portal do Cliente</span>
                  </label>
                  )}`
);

fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', content);
