const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel/AdminHandlers.tsx', 'utf8');

code = code.replace(
  /const \[activePixOrder, setActivePixOrder\] = useState<any>\(null\);/, 
  'const [activePixOrder, setActivePixOrder] = useState<any>(null);\n  const [newEndUserCredentials, setNewEndUserCredentials] = useState<any>(null);'
);

fs.writeFileSync('src/components/AdminPanel/AdminHandlers.tsx', code);
