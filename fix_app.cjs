const fs = require('fs');
const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `{user {user && !user.isAnonymous && ({user && !user.isAnonymous && ( (`;
const replacement = `{user && (`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(file, code);
  console.log("Patched 903");
} else {
  console.log("Target not found on 903!");
}
