const fs = require('fs');

// 1. GymMusicPlayer
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const oldText = 'font-black tracking-widest text-white drop-shadow-md uppercase';
const newText = 'font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase';
code = code.split(oldText).join(newText);

const oldInactive = '"bg-[#1e1e1e] border-white/20 text-white hover:bg-[#2a2a2a] shadow-sm"';
const newInactive = '"bg-white/10 backdrop-blur-md border-white/10 text-white hover:bg-white/20 shadow-lg"';
code = code.split(oldInactive).join(newInactive);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);

// 2. FAIView
let fai = fs.readFileSync('src/components/FAIView.tsx', 'utf8');
fai = fai.replace(/text-white drop-shadow-md/g, 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 drop-shadow-sm');
// Be careful with replacing all text-white, I will just leave FAIView with the first replace if that works, but I also replaced the one without shadow.
// Let's check where FAIView had 'text-white' replacing the gradient.
// In the previous command I did:
// sed -i 's/text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400/text-white/g' src/components/FAIView.tsx
fs.writeFileSync('src/components/FAIView.tsx', fai);
