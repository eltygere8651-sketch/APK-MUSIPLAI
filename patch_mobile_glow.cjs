const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const targetStr = '"text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] font-black"';
const replacementStr = '"text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)] font-black"';

code = code.split(targetStr).join(replacementStr);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
