const fs = require('fs');

let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

// Replace mobile bottom bar button colors
code = code.replace(
  /\? "text-blue-400 font-bold"\s*: "text-slate-500 hover:text-blue-400"/g,
  `? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 drop-shadow-md font-black" : "text-slate-500 hover:text-white"`
);

code = code.replace(
  /\? "text-white font-bold"\s*: "text-slate-500 hover:text-white"/g,
  `? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 drop-shadow-md font-black" : "text-slate-500 hover:text-white"`
);

// We should also replace the gradient text to match the premium one used elsewhere
// which is: text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]

code = code.replace(
  /from-cyan-400 via-fuchsia-500 to-amber-400 drop-shadow-md/g,
  'from-cyan-300 via-fuchsia-400 to-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
