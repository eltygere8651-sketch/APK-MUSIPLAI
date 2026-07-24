const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const targetH1 = `
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase mb-1 font-sans">
                  {accessData.plan === "none" && !accessData.trialStart
                    ? "Acceso Restringido"
                    : "Fin de la Prueba VIP"}
                </h1>
`;
const repH1 = `
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase mb-1 font-sans">
                  {accessData.plan === "none" && !accessData.trialStart
                    ? "Acceso Restringido"
                    : "Gracias por probar Flux Music."}
                </h1>
`;
code = code.replace(targetH1.trim(), repH1.trim());

const targetP2 = `
                <p className="text-[#a7a7a7] max-w-xs mx-auto mb-4 sm:mb-6 text-[10.5px] sm:text-xs font-medium leading-relaxed">
                  {accessData.plan === "none" && !accessData.trialStart
                    ? "Para garantizar máxima estabilidad y baja latencia, controlamos manualmente el aforo. Adquiere o solicita tu prueba."
                    : "Tu Pase VIP ha finalizado. Renueva tu membresía por solo 5 €/mes y sigue disfrutando de música ilimitada, Flux Radio y Karaoke sin anuncios."}
                </p>
`;
const repP2 = `
                <p className="text-[#a7a7a7] max-w-xs mx-auto mb-4 sm:mb-6 text-[10.5px] sm:text-xs font-medium leading-relaxed">
                  {accessData.plan === "none" && !accessData.trialStart
                    ? "Para garantizar máxima estabilidad y baja latencia, controlamos manualmente el aforo. Adquiere o solicita tu prueba."
                    : "Tu prueba gratuita ya finalizó. Continúa escuchando sin anuncios por solo 5 €/mes."}
                </p>
`;
code = code.replace(targetP2.trim(), repP2.trim());

const targetBtn = `
                    <button
                      onClick={async () => {
                        try {
                          const emailVal = user?.email || "Anónimo";
                          const nameVal = user?.displayName || "Socio Contigo";
                          const currentUserId = user?.uid || "guest_uid";
                          
                          const newMsgObj = {
                            userId: currentUserId,
                            userEmail: emailVal,
                            userName: nameVal,
                            message: \`¡Hola! Quiero hacerme Premium por 5 €/mes. Mi correo es \${emailVal}.\`,
                            createdAt: Date.now(),
                            isAdminReply: false,
                            readByAdmin: false,
                            readByUser: true,
                          };
                          const { addDoc, collection } = await import("firebase/firestore");
                          const { db } = await import("../lib/firebase");
                          await addDoc(collection(db, "support_messages"), newMsgObj);
                          
                          window.dispatchEvent(new Event("openSupportModal"));
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="w-full bg-gradient-to-r from-emerald-500 to-[#1ED760] hover:from-emerald-400 hover:to-[#1fdf64] text-black py-2.5 sm:py-3 px-3 sm:px-4 rounded-full font-black uppercase text-[10px] sm:text-[10.5px] tracking-wider shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/20"
                    >
                      <Star className="w-4 h-4" />
                      <span>Quiero hacerme Premium (5 €/mes)</span>
                    </button>
`;
const repBtn = `
                    <button
                      onClick={async () => {
                        try {
                          const emailVal = user?.email || "Anónimo";
                          const nameVal = user?.displayName || "Socio Contigo";
                          const currentUserId = user?.uid || "guest_uid";
                          
                          const newMsgObj = {
                            userId: currentUserId,
                            userEmail: emailVal,
                            userName: nameVal,
                            message: \`¡Hola! Quiero hacerme Premium por 5 €/mes. Mi correo es \${emailVal}.\`,
                            createdAt: Date.now(),
                            isAdminReply: false,
                            readByAdmin: false,
                            readByUser: true,
                          };
                          const { addDoc, collection } = await import("firebase/firestore");
                          const { db } = await import("../lib/firebase");
                          await addDoc(collection(db, "support_messages"), newMsgObj);
                          
                          window.dispatchEvent(new Event("openSupportModal"));
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="w-full bg-gradient-to-r from-emerald-500 to-[#1ED760] hover:from-emerald-400 hover:to-[#1fdf64] text-black py-2.5 sm:py-3 px-3 sm:px-4 rounded-full font-black uppercase text-[10px] sm:text-[10.5px] tracking-wider shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/20"
                    >
                      <span>💬 CONTACTAR PARA ACTIVAR PREMIUM</span>
                    </button>
`;
code = code.replace(targetBtn.trim(), repBtn.trim());
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log('Patched GymMusicPlayer texts');
