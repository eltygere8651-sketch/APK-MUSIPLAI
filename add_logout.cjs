const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const targetLogoutStr = `                  )}
                </div>
              </>`;
const replacementLogoutStr = `                  )}
                  
                  {user && (
                    <button
                      onClick={() => auth.signOut()}
                      className="mt-4 text-white/40 hover:text-white/80 transition-colors text-[9px] uppercase font-bold tracking-widest flex items-center justify-center gap-1 w-full"
                    >
                      <LogOut className="w-3 h-3" />
                      Cerrar Sesión
                    </button>
                  )}
                </div>
              </>`;

code = code.replace(targetLogoutStr, replacementLogoutStr);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
