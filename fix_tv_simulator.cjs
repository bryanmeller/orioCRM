const fs = require('fs');
let code = fs.readFileSync('src/components/TVSimulator/TVLoginScreen.tsx', 'utf8');

const targetHandle = `  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      try {
        localStorage.setItem('streamflix_user', username || 'usuario_demo');
        localStorage.setItem('streamflix_license_code', licenseCode || 'LIC-88942');
        localStorage.setItem('streamflix_authenticated', 'true');
      } catch (err) {}
      onLoginSuccess();
    }, 800);
  };`;

const replacementHandle = `  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/lynx/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseCode, username, password })
      });
      const data = await res.json();
      
      setLoading(false);
      if (data.success) {
        if (data.servers.length === 0) {
           setErrorMsg(data.message || 'Nenhum servidor disponível.');
           return;
        }
        localStorage.setItem('streamflix_user', username);
        localStorage.setItem('streamflix_license_code', licenseCode);
        localStorage.setItem('streamflix_authenticated', 'true');
        localStorage.setItem('streamflix_servers', JSON.stringify(data.servers));
        onLoginSuccess();
      } else {
        setErrorMsg(data.error || 'Erro na autenticação.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('Erro de conexão ao servidor.');
    }
  };`;

code = code.replace(targetHandle, replacementHandle);
fs.writeFileSync('src/components/TVSimulator/TVLoginScreen.tsx', code);
