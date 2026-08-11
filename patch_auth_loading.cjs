const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');

content = content.replace(
`          if (error) {
            console.error("Profile error:", error);
            setIsAuthLoading(false);
          } else if (data) {
            const roleMap: any = { 'PROVIDER': 'PROVEDOR', 'RESELLER': 'REVENDA', 'SUB_RESELLER': 'SUBREVENDA', 'END_USER': 'USUARIO_FINAL' };
            setCurrentUser({
              id: data.id,
              name: data.full_name || data.email,
              email: data.email,
              role: roleMap[data.role] || data.role,
              accountId: data.id
            });
            setIsAuthLoading(false);
          }`,
`          if (error) {
            console.error("Profile error:", error);
            setIsAuthLoading(false);
          } else if (data) {
            const roleMap: any = { 'PROVIDER': 'PROVEDOR', 'RESELLER': 'REVENDA', 'SUB_RESELLER': 'SUBREVENDA', 'END_USER': 'USUARIO_FINAL' };
            setCurrentUser({
              id: data.id,
              name: data.full_name || data.email,
              email: data.email,
              role: roleMap[data.role] || data.role,
              accountId: data.id
            });
            setIsAuthLoading(false);
          } else {
            setIsAuthLoading(false);
          }`
);

fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', content);
