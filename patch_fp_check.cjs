const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const targetQuery = 'const q = query(requestsRef, where("uid", "==", user.uid));';
const replacementQuery = 'const q = query(requestsRef, where("fingerprint", "==", fp));';

code = code.replace(targetQuery, replacementQuery);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
