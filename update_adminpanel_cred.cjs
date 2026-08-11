const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

// Update destructuring
code = code.replace(/handleSaveProviderPlan } = handlers;/, 'handleSaveProviderPlan, newEndUserCredentials, setNewEndUserCredentials } = handlers;');

// Add modal JSX before final closing div
const targetEnd = `    </div>
  );
}`;
const replacementEnd = `
      {newEndUserCredentials && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 max-w-md w-full shadow-sm animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-emerald-400 border-b border-white/10 pb-3 mb-4">
              Acesso Criado com Sucesso
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-gray-400">Código da Licença</label>
                <div className="text-lg font-mono text-white bg-white/5 px-3 py-2 rounded-lg mt-1">{newEndUserCredentials.licenseCode}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400">Usuário</label>
                <div className="text-lg font-mono text-white bg-white/5 px-3 py-2 rounded-lg mt-1">{newEndUserCredentials.username}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400">Senha</label>
                <div className="text-lg font-mono text-white bg-white/5 px-3 py-2 rounded-lg mt-1">{newEndUserCredentials.password}</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  const txt = \`Código: \${newEndUserCredentials.licenseCode}\\nUsuário: \${newEndUserCredentials.username}\\nSenha: \${newEndUserCredentials.password}\`;
                  navigator.clipboard.writeText(txt);
                  showToast('Acesso copiado para a área de transferência');
                }} 
                className="flex-1 px-4 py-2 bg-[#6A00FF] text-white text-xs font-bold rounded-lg hover:bg-[#5900D9] transition-colors cursor-pointer"
              >
                COPIAR ACESSO
              </button>
              <button 
                onClick={() => setNewEndUserCredentials(null)} 
                className="flex-1 px-4 py-2 bg-white/5 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;
code = code.replace(targetEnd, replacementEnd);
fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', code);
