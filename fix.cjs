const fs = require('fs');
let lines = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8').split('\n');
lines.splice(1718, 5); // remove 1718, 1719, 1720, 1721, 1722
fs.writeFileSync('src/components/UserManagementAdmin.tsx', lines.join('\n'));
