const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const targetSpan = 'text-[8px] font-black uppercase tracking-widest text-white drop-shadow-md';
const replacementSpan = 'text-[8px] font-black uppercase tracking-widest'; // Let it inherit the color from the parent wrapper!

code = code.split(targetSpan).join(replacementSpan);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
