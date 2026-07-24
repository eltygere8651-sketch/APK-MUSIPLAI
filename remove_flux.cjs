const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

const target = `<div className="absolute bottom-3 left-0 right-0 flex justify-center z-20 pointer-events-none">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                  <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 uppercase">FLUX AI Engine</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse shadow-[0_0_8px_rgba(232,121,249,1)]" />
                </span>
              </div>`;

code = code.replace(target, '');
fs.writeFileSync('src/components/FAIView.tsx', code);
console.log("Removed FLUX AI Engine text");
