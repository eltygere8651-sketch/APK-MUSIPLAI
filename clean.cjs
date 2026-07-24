const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf-8');

const badBlock = `              )}
              
              
              {restoreProgress && (
                  <div className="bg-purple-500/10 text-purple-300 text-xs p-3 rounded-lg border border-purple-500/20 font-medium">
                    {restoreProgress}
                  </div>
                )}
                
                <button
                  onClick={handleRestoreThumbnails}
                  disabled={isRestoringThumbnails}
                  className="w-full py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-purple-500/20 disabled:opacity-50"
                >
                  {isRestoringThumbnails ? "Restaurando..." : "Restaurar Carátulas Faltantes"}
                </button>
              </div>`;
code = code.replace(badBlock, "              )}");
fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
