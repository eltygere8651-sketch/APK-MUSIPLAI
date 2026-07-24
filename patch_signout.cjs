const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

code = code.replace(
  'import { onAuthStateChanged, User } from "firebase/auth";',
  'import { onAuthStateChanged, User, signOut } from "firebase/auth";'
);

code = code.replace(/auth\.signOut\(\)/g, 'signOut(auth)');

fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
