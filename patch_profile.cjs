const fs = require('fs');
const file = 'src/components/UserProfileModal.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `                  {/* Email */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-1 flex justify-between items-center">
                      <span>Correo Electrónico</span>
                      {isGoogleProvider && (
                        <span className="text-[9px] text-[#1ED760] normal-case font-bold bg-[#1ED760]/5 border border-[#1ED760]/10 px-2 py-0.5 rounded">
                          Cuenta Google
                        </span>
                      )}
                    </label>`;

const replacement = `                  {/* Email */}
                  {!user.isAnonymous && (
                    <>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-1 flex justify-between items-center">
                          <span>Correo Electrónico</span>
                          {isGoogleProvider && (
                            <span className="text-[9px] text-[#1ED760] normal-case font-bold bg-[#1ED760]/5 border border-[#1ED760]/10 px-2 py-0.5 rounded">
                              Cuenta Google
                            </span>
                          )}
                        </label>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  
  const targetEnd = `                          className="w-full pl-11 pr-11 py-2.5 bg-[#121214] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1ED760]/50 transition-all font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-3 hover:text-white text-slate-500 transition-colors"
                        >
                          {showPass ? (
                            <EyeOff className="w-4 h-4 cursor-pointer" />
                          ) : (
                            <Eye className="w-4 h-4 cursor-pointer" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>`;
                
  const replacementEnd = `                          className="w-full pl-11 pr-11 py-2.5 bg-[#121214] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1ED760]/50 transition-all font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-3 hover:text-white text-slate-500 transition-colors"
                        >
                          {showPass ? (
                            <EyeOff className="w-4 h-4 cursor-pointer" />
                          ) : (
                            <Eye className="w-4 h-4 cursor-pointer" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  </>
                  )}
                </div>`;

  code = code.replace(targetEnd, replacementEnd);
  fs.writeFileSync(file, code);
  console.log("Patched successfully");
} else {
  console.log("Target not found!");
}
