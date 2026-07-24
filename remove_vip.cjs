const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ VIP Landing Send Code Endpoint[\s\S]*?\}\);/m;
code = code.replace(regex, '');

fs.writeFileSync('server.ts', code);
