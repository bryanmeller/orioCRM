const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

// Replace label 1 (line 1758)
content = content.replace(
  '<label className="text-xs font-bold text-gray-300 block mb-1">Selecione o Modelo do Código:</label>',
  '<label className="text-xs font-bold text-gray-300 block mb-1">Plano / Licença</label>'
);

// Replace label 2 (line 2032)
content = content.replace(
  '<label className="text-xs font-bold text-gray-300 block mb-1">Selecione o Modelo do Código:</label>',
  '<label className="text-xs font-bold text-gray-300 block mb-1">Plano / Licença</label>'
);

// Replace portal access logic (2090-2100)
content = content.replace(
  /\{currentUser\.role === 'SUPER_ADMIN' && \([\s\S]*?Permitir acesso ao Portal do Cliente \(Self-Service\)[\s\S]*?<\/label>\s*<\/div>\s*\)\}/g,
  `{currentUser.role === 'SUPER_ADMIN' && (
              <div>
                <label className="flex items-center gap-2 text-xs text-white cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    id="endUserPortalAccess"
                    className="accent-[#9C4DFF]"
                  />
                  Permitir acesso ao Portal do Cliente
                </label>
              </div>
              )}`
);

fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', content);
