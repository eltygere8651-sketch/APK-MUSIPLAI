const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

// Fix accidental replacements

rules = rules.replace(
  'match /system_settings/{settingId} {\n      allow read, write: if isAdmin();\n      allow delete: if isSignedIn(); // Allow delete for migration\n    }',
  'match /system_settings/{settingId} {\n      allow read, write: if isAdmin();\n    }'
);

rules = rules.replace(
  'allow update: if isAdmin();\n      allow delete: if isAdmin() || isSignedIn();\n    }\n    match /vip_activations/{activationId} {\n      allow read: if isAdmin() || (isSignedIn() && request.auth.uid == activationId);\n      allow create: if isSignedIn() && request.auth.uid == activationId;\n      allow update, delete: if isAdmin();\n    }',
  'allow update, delete: if isAdmin();\n    }\n    match /vip_activations/{activationId} {\n      allow read: if isSignedIn();\n      allow create: if isSignedIn() && request.auth.uid == activationId;\n      allow update: if isAdmin();\n      allow delete: if isSignedIn();\n    }'
);

fs.writeFileSync('firestore.rules', rules);
console.log('Rules fixed');
