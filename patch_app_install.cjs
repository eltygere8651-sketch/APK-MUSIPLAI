const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetMobileMenuInstall = `                {canShowInstallHelper && (
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); handleInstallPress(); }}
                    className="flex-1 min-w-[90px] h-8 bg-gradient-to-r from-emerald-500 to-[#1ED760] text-black font-extrabold uppercase text-[9px] tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-[0_2px_8px_rgba(30,215,96,0.15)] active:scale-[0.98]"
                  >
                    <Download className="w-3 h-3 stroke-[2.5px]" />
                    <span>Instalar App</span>
                  </button>
                )}`;

const targetDesktopMenuInstall = `              {canShowInstallHelper && (
                <button
                  type="button"
                  onClick={() => { setIsDesktopMenuOpen(false); handleInstallPress(); }}
                  className="h-8 bg-gradient-to-r from-emerald-500 to-[#1ED760] text-black font-extrabold uppercase text-[9px] tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5px]" />
                  <span>Instalar App</span>
                </button>
              )}`;

code = code.replace(targetMobileMenuInstall, '');
code = code.replace(targetDesktopMenuInstall, '');
fs.writeFileSync('src/App.tsx', code);
console.log('Removed from App.tsx menus');
