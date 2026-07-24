const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const target = `) : trackListTab === "queue" ? (`;

const artistTabCode = `) : trackListTab === "artist" ? (
                    <div className="space-y-4 px-1 pb-20">
                      {artistDetails ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setTrackListTab("search")} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                              <ChevronRight className="w-5 h-5 text-white transform rotate-180" />
                            </button>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">{artistDetails.header}</h2>
                          </div>
                          {artistDetails.sections.map((section: any, sIdx: number) => (
                            <div key={sIdx} className="mb-6">
                              <h3 className="text-[14px] font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                {section.title}
                              </h3>
                              <div className="flex overflow-x-auto pb-4 gap-3 snap-x scrollbar-hide">
                                {section.items.map((item: any, iIdx: number) => (
                                  <div key={iIdx} className="shrink-0 w-[140px] snap-start group/item cursor-pointer" onClick={() => {
                                      if (item.isPlaylist) {
                                        loadPlaylistAndPlay(item);
                                      } else {
                                        setOverrideCurrentTrack({
                                          id: 'yt_temp_' + item.id,
                                          title: item.title,
                                          artist: item.artist || artistDetails.header,
                                          duration: item.duration || "",
                                          url: item.url,
                                          bpm: 120
                                        });
                                        setIsPlaying(true);
                                      }
                                  }}>
                                    <div className="relative aspect-square rounded-xl overflow-hidden mb-2 shadow-lg group-hover/item:shadow-emerald-500/20 transition-all duration-300">
                                      <img src={item.thumbnail} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                      <div className="absolute inset-0 bg-black/20 group-hover/item:bg-black/40 transition-colors flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all transform scale-75 group-hover/item:scale-100 shadow-xl">
                                          <Play className="w-5 h-5 text-black fill-black ml-1" />
                                        </div>
                                      </div>
                                    </div>
                                    <h4 className="text-[11px] font-bold text-white line-clamp-2 leading-tight uppercase">{item.title}</h4>
                                    <p className="text-[9px] text-white/50 truncate uppercase tracking-widest mt-1">{item.subType}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-white/50">
                          <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                          <p className="text-[10px] uppercase tracking-widest">Cargando artista...</p>
                        </div>
                      )}
                    </div>
                  ) : trackListTab === "queue" ? (`;

code = code.replace(target, artistTabCode);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
