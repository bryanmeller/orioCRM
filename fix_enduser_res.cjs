const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetRes = `      // Fetch license code if created
      let licenseCode = null;
      if (role === 'END_USER') {
        const { data: licData } = await supabaseAdmin.from('licenses').select('code').eq('end_user_id', userId).single();
        if (licData) licenseCode = licData.code;
      }
      
      return res.status(200).json({ 
        success: true, 
        userId: userId, 
        profileCreated: !!finalProfile,
        balanceCreated: balanceCreated,
        providerCode: updatedProfile?.provider_code || null,
        licenseCode: licenseCode,
        password: password || 'ChangeMe123!',
        username: finalUsername,
        user: newUser.user
      });`;

const replacementRes = `      // Fetch license code if created
      let licenseCode = null;
      let licenseId = null;
      if (role === 'END_USER') {
        const { data: licData } = await supabaseAdmin.from('licenses').select('id, code').eq('end_user_id', userId).single();
        if (licData) {
            licenseCode = licData.code;
            licenseId = licData.id;
        }
      }
      
      return res.status(200).json({ 
        success: true, 
        userId: userId, 
        profileCreated: !!finalProfile,
        balanceCreated: balanceCreated,
        providerCode: updatedProfile?.provider_code || null,
        licenseCreated: !!licenseId,
        licenseId: licenseId,
        licenseCode: licenseCode,
        password: password || 'ChangeMe123!',
        username: finalUsername,
        user: newUser.user
      });`;

code = code.replace(targetRes, replacementRes);
fs.writeFileSync('server.ts', code);
