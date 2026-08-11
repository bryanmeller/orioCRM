const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

serverCode = serverCode.replace(
  "if (insertProfileError) {",
  "if (insertProfileError) {\n        console.error('Profile Insert Error:', insertProfileError);"
);

fs.writeFileSync('server.ts', serverCode);
