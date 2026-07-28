const fs = require('fs');
let code = fs.readFileSync('src/components/NowPlayingBar.tsx', 'utf8');

code = code.replace(
  'className="fixed bottom-[72px] left-2 right-2 z-40 sm:hidden bg-neutral-900/90 border border-neutral-800 rounded-xl p-2 shadow-2xl backdrop-blur-3xl select-none"',
  'className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-2 right-2 z-40 sm:hidden bg-[#1C1C1E]/95 border border-white/5 rounded-[16px] p-2 shadow-2xl backdrop-blur-xl select-none"'
);

// Make Desktop NowPlayingBar look more premium
code = code.replace(
  'className="hidden sm:flex fixed bottom-0 left-0 right-0 z-40 bg-black/85 backdrop-blur-2xl border-t border-neutral-900 px-4 py-3 text-white shadow-[0_-10px_40px_rgba(0,0,0,0.5)] select-none"',
  'className="hidden sm:flex fixed bottom-0 left-0 right-0 z-40 bg-black/85 backdrop-blur-3xl border-t border-white/5 px-6 py-4 text-white shadow-[0_-20px_40px_rgba(0,0,0,0.8)] select-none"'
);

fs.writeFileSync('src/components/NowPlayingBar.tsx', code);
