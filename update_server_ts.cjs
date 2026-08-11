const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetResponse = `      return res.status(200).json({ 
        success: true, 
        userId: userId, 
        profileCreated: !!finalProfile,
        balanceCreated: balanceCreated,
        user: newUser.user
      });`;

const replacementResponse = `      // Fetch updated profile to get provider_code if it was generated
      const { data: updatedProfile } = await supabaseAdmin.from('profiles').select('provider_code').eq('id', userId).single();
      
      return res.status(200).json({ 
        success: true, 
        userId: userId, 
        profileCreated: !!finalProfile,
        balanceCreated: balanceCreated,
        providerCode: updatedProfile?.provider_code || null,
        user: newUser.user
      });`;

code = code.replace(targetResponse, replacementResponse);
fs.writeFileSync('server.ts', code);
