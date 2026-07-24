const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

code = code.replace(/blocked: null as number \| null, suspicious: null as number \| null/g, '');
code = code.replace(/blocked: null,\s*suspicious: null/g, '');
code = code.replace(/conversions: 0,\s*\}/g, 'conversions: 0 }');
code = code.replace(/conversions: conversionsSnap\.data\(\)\.count,\s*\}/g, 'conversions: conversionsSnap.data().count }');

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
