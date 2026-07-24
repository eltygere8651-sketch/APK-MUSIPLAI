const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const oldGradient = '? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-black" : "text-slate-500 hover:text-white"';
const newGlow = '? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] font-black" : "text-slate-500 hover:text-white"';

code = code.split(oldGradient).join(newGlow);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
