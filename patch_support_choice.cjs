const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

// 1. Add state
const stateTarget = `  const [isCheckingTrialRequest, setIsCheckingTrialRequest] = useState(false);`;
const stateReplacement = `  const [isCheckingTrialRequest, setIsCheckingTrialRequest] = useState(false);
  const [showSupportChoice, setShowSupportChoice] = useState(false);`;
code = code.replace(stateTarget, stateReplacement);

// 2. Add Modal UI at the end of the file, before the last closing div.
const uiTarget = `      {/* PWA / Instalación en iOS Helper */}`;
const uiReplacement = `      {/* Support Auto-Message Choice Modal */}
      <AnimatePresence>
        {showSupportChoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#121214] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                <MessageSquare className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Mensaje de Soporte</h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                ¿Deseas que generemos un mensaje automático para solicitar tu suscripción o prefieres escribir uno tú mismo?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => {
                    setShowSupportChoice(false);
                    let defaultMessage = "";
                    if (accessData?.plan !== "none" && accessData?.plan !== "free") {
                      defaultMessage = "Mi suscripción a Flux Music ha finalizado y quiero volver a disfrutar de todas las ventajas Premium. ¿Podéis ayudarme a reactivarla?";
                    } else {
                      defaultMessage = "Hola.\\n\\nHe utilizado mi prueba gratuita de Flux Music y quiero activar la suscripción Premium de 5 €/mes.";
                    }
                    window.dispatchEvent(new CustomEvent("open-support", { detail: { message: defaultMessage } }));
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Sí, Mensaje Automático
                </button>
                <button
                  onClick={() => {
                    setShowSupportChoice(false);
                    window.dispatchEvent(new CustomEvent("open-support"));
                  }}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  No, Contacto Directo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA / Instalación en iOS Helper */}`;
code = code.replace(uiTarget, uiReplacement);

// 3. Change the contact button to open the modal instead of confirm()
const btnTarget = `                    <button
                      onClick={() => {
                        const wantsAutoMsg = window.confirm("¿Deseas que generemos un mensaje automático para solicitar tu suscripción?");
                        if (wantsAutoMsg) {
                          let defaultMessage = "";
                          if (accessData.plan !== "none" && accessData.plan !== "free") {
                            defaultMessage = "Mi suscripción a Flux Music ha finalizado y quiero volver a disfrutar de todas las ventajas Premium. ¿Podéis ayudarme a reactivarla?";
                          } else {
                            defaultMessage = "Hola.\\n\\nHe utilizado mi prueba gratuita de Flux Music y quiero activar la suscripción Premium de 5 €/mes.";
                          }
                          window.dispatchEvent(new CustomEvent("open-support", { detail: { message: defaultMessage } }));
                        } else {
                          window.dispatchEvent(new CustomEvent("open-support"));
                        }
                      }}
                      className="w-full bg-gradient-to-r from-emerald-500 to-[#1ED760] hover:from-emerald-400 hover:to-[#1fdf64] text-black py-2.5 sm:py-3 px-3 sm:px-4 rounded-full font-black uppercase text-[10px] sm:text-[10.5px] tracking-wider shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/20"
                    >`;

const btnReplacement = `                    <button
                      onClick={() => setShowSupportChoice(true)}
                      className="w-full bg-gradient-to-r from-emerald-500 to-[#1ED760] hover:from-emerald-400 hover:to-[#1fdf64] text-black py-2.5 sm:py-3 px-3 sm:px-4 rounded-full font-black uppercase text-[10px] sm:text-[10.5px] tracking-wider shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/20"
                    >`;
code = code.replace(btnTarget, btnReplacement);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log('Done Support Choice');
