const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const target = `{/* Volume Adjuster */}
                      <div className="flex items-center justify-end gap-2 group/vol w-[100px]">`;

const replacement = `{/* Karaoke Mode Button */}
                      <button
                        onClick={() => setIsKaraokeMode(true)}
                        className="p-2 text-slate-400 hover:text-emerald-400 active:scale-90 transition-all cursor-pointer rounded-full bg-white/5"
                        title="Modo Karaoke ECO"
                      >
                        <Mic2 className="w-[15px] h-[15px]" />
                      </button>

                      {/* Volume Adjuster */}
                      <div className="flex items-center justify-end gap-2 group/vol w-[100px]">`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
    console.log("Added Karaoke button.");
} else {
    console.log("Failed to add Karaoke button.");
}
