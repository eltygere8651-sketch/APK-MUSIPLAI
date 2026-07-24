const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

// The inactive tab styles
const inactiveOld1 = '"bg-white/5 border-white/10 text-white hover:bg-white/10"';
const inactiveNew1 = '"bg-[#1e1e1e] border-white/20 text-white hover:bg-[#2a2a2a] shadow-sm"';

code = code.split(inactiveOld1).join(inactiveNew1);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
