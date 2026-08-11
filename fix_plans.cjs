const fs = require('fs');

const path = 'src/components/AdminPanel/AdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

// The plans are from DB directly, so they have DB column names.
content = content.replace(/p\.nome/g, 'p.name');
content = content.replace(/p\.dias/g, 'p.validity_days');
content = content.replace(/p\.creditCost/g, 'p.reseller_credit_cost');
content = content.replace(/p\.sellPrice/g, 'p.self_service_price');
content = content.replace(/p\.maxDevices/g, 'p.devices_allowed');
content = content.replace(/p\.maxDns/g, 'p.max_servers');

// Also update the `<select>` for "Cadastrar Novo Usuário Final"
// Replace:
// {plans.map((p) => (
//   <option key={p.id} value={p.id}>
//     {p.nome} - {p.dias} dias ({p.creditCost} Créditos)
//   </option>
// ))}
// With the new logic

fs.writeFileSync(path, content);
console.log('Replaced AdminPanel.tsx successfully.');
