const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `                    ) : supportChatMessages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3.5">
                        <div className="p-4 bg-emerald-500/5 rounded-full border border-emerald-500/10 animate-pulse">
                          <MessageSquare className="w-8 h-8 text-[#1ED760]" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-[0.2em]">Soporte Premium en Vivo</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Canal Sincronizado</p>
                        </div>
                        <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed max-w-[280px]">
                          👋 ¡Hola! Escribe tu consulta o duda abajo. El equipo administrativo te responderá directamente aquí en tiempo real.
                        </p>
                      </div>
                    ) : (
                      <>
                        {suggestedMessage ? (`;

const replace = `                    ) : (
                      <>
                        {supportChatMessages.length === 0 && !suggestedMessage && (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3.5 mt-10 mb-6">
                            <div className="p-4 bg-emerald-500/5 rounded-full border border-emerald-500/10 animate-pulse">
                              <MessageSquare className="w-8 h-8 text-[#1ED760]" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-white uppercase tracking-[0.2em]">Soporte Premium en Vivo</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Canal Sincronizado</p>
                            </div>
                            <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed max-w-[280px]">
                              👋 ¡Hola! Escribe tu consulta o duda abajo. El equipo administrativo te responderá directamente aquí en tiempo real.
                            </p>
                          </div>
                        )}
                        {suggestedMessage ? (`;

if (code.includes(target)) {
  code = code.replace(target, replace);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched App.tsx successfully.");
} else {
  console.log("Target not found.");
}
