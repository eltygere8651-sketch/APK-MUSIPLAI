const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const targetDropdown = `
                    {deferredPrompt && (
                      <button
                        onClick={() => {
                          handleInstallClick();
                          setIsMembershipDropdownOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 transition-colors cursor-pointer text-[11px] font-bold"
                      >
                        <Download className="w-4 h-4 text-yellow-400" />
                        <span>Instalar App en el Móvil</span>
                      </button>
                    )}

                    <div className="border-t border-white/5 my-1" />
`;

code = code.replace(targetDropdown, '');
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log('Removed from GymMusicPlayer dropdown');
