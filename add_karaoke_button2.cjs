const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const target = `{/* Volume Adjuster */}
                        <div className="flex justify-end items-center gap-1.5 sm:gap-3 w-full pr-1 sm:pr-2">`;

const replacement = `{/* Karaoke Mode Button */}
                        <button
                          onClick={() => setIsKaraokeMode(true)}
                          className="p-1 sm:p-2 text-slate-400 hover:text-emerald-400 transition-all transform active:scale-90 flex-shrink-0"
                          title="Modo Karaoke ECO"
                        >
                          <Mic2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        {/* Volume Adjuster */}
                        <div className="flex justify-end items-center gap-1.5 sm:gap-3 w-full pr-1 sm:pr-2">`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
    console.log("Added Karaoke button 2.");
} else {
    console.log("Failed to add Karaoke button 2.");
}
