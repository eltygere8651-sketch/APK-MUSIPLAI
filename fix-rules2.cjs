const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

// Update users read/delete rules
rules = rules.replace(
  'allow get, list: if isSignedIn() && (request.auth.uid == userId || isAdmin());',
  'allow get, list: if isSignedIn() && (request.auth.uid == userId || isAdmin() || (resource == null) || (resource != null && (!("plan" in resource.data) || resource.data.plan == "none" || resource.data.plan == "free")));'
);

rules = rules.replace(
  'allow delete: if isAdmin();',
  'allow delete: if isAdmin() || (isSignedIn() && resource != null && (!("plan" in resource.data) || resource.data.plan == "none" || resource.data.plan == "free"));'
);

// Update trial_requests read/delete rules
rules = rules.replace(
  'allow get: if isSignedIn() && (request.auth.uid == requestId || resource.data.uid == request.auth.uid);',
  'allow get: if isSignedIn(); // Allow reading for migration'
);
rules = rules.replace(
  'allow read, write: if isAdmin();',
  'allow read, write: if isAdmin();\n      allow delete: if isSignedIn(); // Allow delete for migration'
);

// Update vip_activations delete rules
rules = rules.replace(
  'allow update, delete: if isAdmin();',
  'allow update: if isAdmin();\n      allow delete: if isAdmin() || isSignedIn();'
);

fs.writeFileSync('firestore.rules', rules);
console.log('Rules updated for migration support');
