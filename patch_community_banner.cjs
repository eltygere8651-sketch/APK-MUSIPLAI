const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldCode = `                <div>
                  <h3 className="text-sm sm:text-lg font-black uppercase tracking-[0.4em] text-emerald-400 mb-1">
                    Novedades
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] max-w-sm leading-relaxed">
                    Aquí están las playlists destacadas en novedades
                  </p>
                </div>`;

const newCode = `                <div>
                  <h3 className="text-sm sm:text-lg font-black uppercase tracking-[0.4em] text-emerald-400 mb-1 flex items-center gap-2">
                    Novedades
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full border border-emerald-500/30">Comunidad</span>
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium max-w-md leading-relaxed mt-1">
                    Descubre las creaciones más recientes de otros socios del club. <strong className="text-white">¡Escucha, comparte y apoya a la comunidad!</strong> Las playlists más activas subirán en el ranking global.
                  </p>
                </div>`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
