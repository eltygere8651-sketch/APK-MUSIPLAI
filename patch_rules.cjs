const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf-8');
code = code.replace(
  "allow delete: if isAdmin() && (request.auth.uid == userId);",
  "allow delete: if isAdmin();"
);
fs.writeFileSync('firestore.rules', code);
