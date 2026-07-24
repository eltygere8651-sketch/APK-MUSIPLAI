const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add suggestedMessage state
const targetState = 'const [supportMessage, setSupportMessage] = useState("");';
const replacementState = 'const [supportMessage, setSupportMessage] = useState("");\n  const [suggestedMessage, setSuggestedMessage] = useState("");';
code = code.replace(targetState, replacementState);

// 2. Change handleOpenSupport to use suggestedMessage instead of supportMessage
const targetHandle = `    const handleOpenSupport = (e: any) => {
      setIsSupportModalOpen(true);
      if (e.detail && e.detail.message) {
        setSupportMessage(e.detail.message);
      }
    };`;
const replacementHandle = `    const handleOpenSupport = (e: any) => {
      setIsSupportModalOpen(true);
      if (e.detail && e.detail.message) {
        setSuggestedMessage(e.detail.message);
      }
    };`;
code = code.replace(targetHandle, replacementHandle);

// 3. Clear suggestedMessage on modal close
const targetClose1 = 'setSupportMessage("");';
const replacementClose1 = 'setSupportMessage("");\n                      setSuggestedMessage("");';
code = code.replace(targetClose1, replacementClose1);
const targetClose2 = 'setIsSupportModalOpen(false);';
const replacementClose2 = 'setIsSupportModalOpen(false);\n                            setSuggestedMessage("");';
code = code.replace(targetClose2, replacementClose2);

// 4. Inject the suggestedMessage UI inside the chat area
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
