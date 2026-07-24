const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

if (!rules.includes('match /migration_locks')) {
  rules = rules.replace(
    'match /databases/{database}/documents {',
    'match /databases/{database}/documents {\n\n    // Migration Locks\n    match /migration_locks/{lockId} {\n      allow read, write: if true; // Permitimos lectura y escritura publica para bloqueos temporales\n    }\n'
  );
  fs.writeFileSync('firestore.rules', rules);
  console.log('Added migration_locks rules');
}
