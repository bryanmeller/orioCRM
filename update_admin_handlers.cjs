const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel/AdminHandlers.tsx', 'utf8');

// Add state
const targetState = `  const [activePixOrder, setActivePixOrder] = useState<any | null>(null);`;
const replacementState = `  const [activePixOrder, setActivePixOrder] = useState<any | null>(null);
  const [newEndUserCredentials, setNewEndUserCredentials] = useState<any | null>(null);`;
code = code.replace(targetState, replacementState);

// Update handleSaveEndUser
const targetHandler = `  const handleSaveEndUser = async (e: any, formData: any) => {
    e.preventDefault();
    try {
      await saveEndUser(formData, currentUser.id);
      showToast('Usuário final salvo com sucesso.'); reloadData();
    } catch (err: any) {
      showToast(\`Erro: \${err.message}\`);
    }
  }`;

const replacementHandler = `  const handleSaveEndUser = async (e: any, formData: any) => {
    e.preventDefault();
    try {
      const res = await saveEndUser(formData, currentUser.id);
      showToast('Usuário final salvo com sucesso.'); 
      reloadData();
      if (!formData.id && res.licenseCode) {
        setNewEndUserCredentials({
          licenseCode: res.licenseCode,
          username: res.username,
          password: res.password
        });
      }
    } catch (err: any) {
      showToast(\`Erro: \${err.message}\`);
    }
  }`;
code = code.replace(targetHandler, replacementHandler);

// Add to return
const targetReturn = `    handleSaveProviderPlan
  };`;
const replacementReturn = `    handleSaveProviderPlan,
    newEndUserCredentials, setNewEndUserCredentials
  };`;
code = code.replace(targetReturn, replacementReturn);

fs.writeFileSync('src/components/AdminPanel/AdminHandlers.tsx', code);
