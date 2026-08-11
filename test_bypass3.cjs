const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

serverCode = serverCode.replace(
  "console.error('Profile Insert Error:', insertProfileError);",
  "require('fs').writeFileSync('profile_error.json', JSON.stringify(insertProfileError));\n        console.error('Profile Insert Error:', insertProfileError);"
);

fs.writeFileSync('server.ts', serverCode);
