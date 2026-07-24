const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');
const target = `import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";`;
const replace = `import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";`;
if (code.includes(target)) {
  code = code.replace(target, replace);
  fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
  console.log("Patched GymMusicPlayer");
} else {
  console.log("Could not find target");
}
