const fs = require('fs');
const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `                {user && (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); window.dispatchEvent(new Event('open-profile-modal')); }}
                    className="w-full h-9 bg-transparent hover:bg-white/5 text-white font-medium text-xs rounded-md transition-colors cursor-pointer flex items-center justify-start px-2.5 gap-2.5"
                  >
                    <img 
                      src={user.photoURL || \`https://api.dicebear.com/7.x/adventurer/svg?seed=\${encodeURIComponent(user.uid || 'flux')}\`} 
                      alt="Perfil" 
                      className="w-4 h-4 rounded-full object-cover border border-white/10" 
                      referrerPolicy="no-referrer"
                    />
                    <span>Perfil</span>
                  </button>
                )}`;

const replacement = `                {user && (
                  <button
                    type="button"
                    onClick={() => { setIsMenuOpen(false); window.dispatchEvent(new Event('open-profile-modal')); }}
                    className="w-full py-2 bg-transparent hover:bg-white/5 text-white font-medium text-xs rounded-md transition-colors cursor-pointer flex items-center justify-start px-2.5 gap-2.5"
                  >
                    <img 
                      src={user.photoURL || \`https://api.dicebear.com/7.x/adventurer/svg?seed=\${encodeURIComponent(user.uid || 'flux')}\`} 
                      alt="Perfil" 
                      className="w-8 h-8 rounded-full object-cover border border-[#1ED760]" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col items-start leading-tight">
                      <span className="font-bold text-white truncate max-w-[120px]">{user.displayName || "Usuario"}</span>
                      {accessData?.plan === 'free' && accessData.daysRemaining !== undefined && (
                        <span className="text-[9px] text-[#1ED760] font-black uppercase tracking-widest mt-0.5">
                          Prueba: {accessData.daysRemaining} días
                        </span>
                      )}
                    </div>
                  </button>
                )}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(file, code);
  console.log("Patched menu successfully");
} else {
  console.log("Menu Target not found!");
}
