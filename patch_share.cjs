const fs = require('fs');
let code = fs.readFileSync('src/components/ShareModal.tsx', 'utf-8');

code = code.replace(/\\`/g, '`');
code = code.replace(/\\\$/g, '$');

fs.writeFileSync('src/components/ShareModal.tsx', code);
