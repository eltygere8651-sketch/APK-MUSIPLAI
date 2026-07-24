const fs = require('fs');
let code = fs.readFileSync('src/components/VIPLandingView.tsx', 'utf-8');
const target = `import { signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';`;
const replace = `import { signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';`;
if (code.includes(target)) {
  code = code.replace(target, replace);
  fs.writeFileSync('src/components/VIPLandingView.tsx', code);
  console.log("Patched VIPLandingView imports");
}
