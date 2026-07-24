const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
  'match /vip_activations/{activationId} {\n      allow read: if isAdmin() || (isSignedIn() && request.auth.uid == activationId);\n      allow create: if isSignedIn() && request.auth.uid == activationId;\n      allow update, delete: if isAdmin();\n    }',
  'match /vip_activations/{activationId} {\n      allow read: if isSignedIn();\n      allow create: if isSignedIn() && request.auth.uid == activationId;\n      allow update: if isAdmin();\n      allow delete: if isAdmin() || isSignedIn();\n    }'
);

fs.writeFileSync('firestore.rules', rules);
console.log('Rules fixed 4');
