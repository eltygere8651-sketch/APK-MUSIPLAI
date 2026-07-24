const fs = require('fs');
let lines = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8').split('\n');
for (let i = 1210; i < 1220; i++) {
  if (lines[i].includes('<>')) {
    lines[i] = '  return (\n    <>';
    break;
  }
}
// Remove the duplicated div
for (let i = 1210; i < 1220; i++) {
  if (lines[i].includes('bg-black/95 backdrop-blur-md font-sans')) {
    lines.splice(i, 1);
    break;
  }
}
fs.writeFileSync('src/components/UserManagementAdmin.tsx', lines.join('\n'));
