const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldCode = `                              {!previewPlaylist && (
                                <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1 z-30">
                                  <div
                                    className={\`px-2.5 py-1 \${pl.isAdminContent ? "bg-[#1ED760] text-black ring-2 ring-[#1ED760]/20 shadow-[0_0_15px_rgba(30,215,96,0.4)]" : "bg-emerald-500 text-black"} text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg flex items-center gap-1.5\`}
                                  >`;

const newCode = `                              {!previewPlaylist && (
                                <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1 z-30">
                                  {(() => {
                                    let isNew = false;
                                    if (pl.createdAt) {
                                      const ms = pl.createdAt.toMillis ? pl.createdAt.toMillis() : new Date(pl.createdAt).getTime();
                                      isNew = (Date.now() - ms) < 48 * 60 * 60 * 1000;
                                    }
                                    return isNew ? (
                                      <div className="px-2.5 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center gap-1.5 animate-pulse mb-0.5">
                                        <Sparkles className="w-2.5 h-2.5" />
                                        Novedad
                                      </div>
                                    ) : null;
                                  })()}
                                  <div
                                    className={\`px-2.5 py-1 \${pl.isAdminContent ? "bg-[#1ED760] text-black ring-2 ring-[#1ED760]/20 shadow-[0_0_15px_rgba(30,215,96,0.4)]" : "bg-emerald-500 text-black"} text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg flex items-center gap-1.5\`}
                                  >`;

code = code.replace(oldCode, newCode);

// Add Sparkles to lucide-react import if missing
if (!code.includes("Sparkles,")) {
  code = code.replace("import {", "import { Sparkles,");
}

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
