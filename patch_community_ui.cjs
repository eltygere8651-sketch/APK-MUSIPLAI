const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const bannerOld = `                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium max-w-md leading-relaxed mt-1">
                    Descubre las creaciones más recientes de otros socios del club. <strong className="text-white">¡Escucha, comparte y apoya a la comunidad!</strong> Las playlists más activas subirán en el ranking global.
                  </p>`;

const bannerNew = `                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium max-w-md leading-relaxed mt-1">
                    Apoya el talento local. <strong className="text-emerald-400">Cada reproducción cuenta.</strong> Las playlists que alcancen más de <strong className="text-white">10 reproducciones</strong> reales conseguirán la insignia <strong className="text-purple-400 font-black">TOP DJ</strong>, aumentando su visibilidad y posicionamiento global.
                  </p>`;

code = code.replace(bannerOld, bannerNew);

const statsOld = `                                  <div className="px-2 py-0.5 bg-black/85 rounded-md text-[9px] sm:text-[10.5px] font-extrabold text-white uppercase tracking-widest border border-white/10 shadow-md">
                                    {pl.tracks.length} P •{" "}
                                    {calculatePlaylistDuration(pl.tracks)}
                                  </div>`;

const statsNew = `                                  {pl.plays >= 10 && (
                                    <div className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-md text-[9px] sm:text-[10.5px] font-black text-white uppercase tracking-widest shadow-[0_0_10px_rgba(168,85,247,0.5)] mb-1">
                                      🏆 TOP DJ
                                    </div>
                                  )}
                                  <div className="flex flex-col gap-1 w-full items-end">
                                    {pl.plays > 0 && (
                                      <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-md flex items-center gap-1">
                                        <Play className="w-2.5 h-2.5" />
                                        {pl.plays}
                                      </div>
                                    )}
                                    <div className="px-2 py-0.5 bg-black/85 rounded-md text-[9px] sm:text-[10.5px] font-extrabold text-white uppercase tracking-widest border border-white/10 shadow-md">
                                      {pl.tracks.length} P •{" "}
                                      {calculatePlaylistDuration(pl.tracks)}
                                    </div>
                                  </div>`;

code = code.replace(statsOld, statsNew);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
