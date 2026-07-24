const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(/app\.post\("\/api\/dj\/joke"[\s\S]*?\}\);\n/g, '');
code = code.replace(/app\.post\("\/api\/dj\/test-voice"[\s\S]*?\}\);\n/g, '');

fs.writeFileSync('server.ts', code);
