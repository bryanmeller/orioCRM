const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel/AdminPanel.tsx', 'utf8');
content = content.replace(
  '<div className="w-full min-h-[600px] flex items-center justify-center p-6 b        <div className="bg-[#111111] border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-6">',
  '<div className="w-full min-h-[600px] flex items-center justify-center p-6 bg-[#000000]">\n        <div className="bg-[#111111] border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-6">'
);
content = content.replace(
`    );
  }  </div>
      </div>
    );
  }`,
`    );
  }`
);
fs.writeFileSync('src/components/AdminPanel/AdminPanel.tsx', content);
