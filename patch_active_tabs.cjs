const fs = require('fs');

let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const oldActive = '"bg-blue-600 text-white border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]"';
const newActive = '"bg-white/20 backdrop-blur-xl border-white/40 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/20"';

code = code.split(oldActive).join(newActive);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
