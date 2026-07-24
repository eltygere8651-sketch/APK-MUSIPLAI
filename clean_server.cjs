const fs = require('fs');
let lines = fs.readFileSync('server.ts', 'utf-8').split('\n');

let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// DJ AI Endpoints')) {
    startIndex = i;
  }
  if (lines[i].includes('async function startServer() {')) {
    endIndex = i;
    break;
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex);
  fs.writeFileSync('server.ts', lines.join('\n'));
}
