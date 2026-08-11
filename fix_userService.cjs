const fs = require('fs');
let userService = fs.readFileSync('src/services/admin/userService.ts', 'utf8');

userService = userService.replace(`  // Create credit balance
  if (['RESELLER', 'SUB_RESELLER'].includes(payload.role)) {
    await supabase.from('credit_balances').insert({
      owner_id: user.id,
      balance: 0
    });
  }`, '');

fs.writeFileSync('src/services/admin/userService.ts', userService);
