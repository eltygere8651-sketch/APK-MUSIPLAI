const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetChatArea = `{supportChatMessages.map((msg: any) => {`;
const replacementChatArea = `{suggestedMessage && (
                        <div className="mb-4">
                          <div className="flex flex-col max-w-[85%] mr-auto text-left gap-1 items-start">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-2">Sistema</span>
                            <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm font-medium leading-relaxed bg-[#1a1a1c] text-white border border-white/5 relative shadow-sm">
                              <p className="mb-3 text-slate-300">¿Quieres enviar este mensaje predeterminado o prefieres escribir el tuyo propio?</p>
                              <div className="p-3 bg-white/5 rounded-xl border border-white/10 mb-3 italic text-emerald-400 text-xs">
                                "{suggestedMessage}"
                              </div>
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => {
                                    setSupportMessage(suggestedMessage);
                                    setSuggestedMessage("");
                                  }}
                                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition-colors"
                                >
                                  Usar Mensaje Predeterminado
                                </button>
                                <button
                                  onClick={() => setSuggestedMessage("")}
                                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-[10px] tracking-wider rounded-xl transition-colors"
                                >
                                  Escribir mi propio mensaje
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {supportChatMessages.map((msg: any) => {`;
code = code.replace(targetChatArea, replacementChatArea);

fs.writeFileSync('src/App.tsx', code);
