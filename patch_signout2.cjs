const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

if (code.includes('auth.signOut()')) {
  if (!code.includes('signOut } from "firebase/auth"')) {
    code = code.replace(
      'import { onAuthStateChanged, User } from "firebase/auth";',
      'import { onAuthStateChanged, User, signOut } from "firebase/auth";'
    );
  }
  code = code.replace(/auth\.signOut\(\)/g, 'signOut(auth)');
  fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
}
