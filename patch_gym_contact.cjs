const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const targetImport = 'import { motion, AnimatePresence } from "motion/react";';
const replacementImport = 'import { motion, AnimatePresence } from "motion/react";\nimport { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";\nimport { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";\nimport { auth, db } from "../lib/firebase";';

if (!code.includes('signInWithEmailAndPassword')) {
  code = code.replace(targetImport, replacementImport);
}

const targetButton = "onClick={() => window.dispatchEvent(new CustomEvent('open-support', { detail: { message: 'Hola.\\n\\nHe utilizado mi prueba gratuita de Flux Music y quiero activar la suscripción Premium de 5 €/mes.\\n\\nQuedo pendiente.' } }))}";
const replacementButton = `onClick={async () => {
                        if (!user) {
                          try {
                            const fp = getBrowserFingerprint();
                            const vipEmail = \`socio.\${fp.substring(0, 6)}@fluxmusic.com\`;
                            const vipPass = \`\${fp.substring(0, 10)}_fluxvip\`;
                            try {
                              await signInWithEmailAndPassword(auth, vipEmail, vipPass);
                            } catch (e) {
                              const userCred = await createUserWithEmailAndPassword(auth, vipEmail, vipPass);
                              await setDoc(doc(db, "users", userCred.user.uid), {
                                email: vipEmail,
                                displayName: "Socio VIP",
                                plan: "free",
                                trialStart: Date.now() - (8 * 24 * 60 * 60 * 1000)
                              }, { merge: true });
                            }
                            setTimeout(() => {
                              window.dispatchEvent(new CustomEvent('open-support', { detail: { message: 'Hola.\\n\\nHe utilizado mi prueba gratuita de Flux Music y quiero activar la suscripción Premium de 5 €/mes.\\n\\nQuedo pendiente.' } }));
                            }, 1000);
                          } catch(err) {
                            console.error(err);
                          }
                        } else {
                          window.dispatchEvent(new CustomEvent('open-support', { detail: { message: 'Hola.\\n\\nHe utilizado mi prueba gratuita de Flux Music y quiero activar la suscripción Premium de 5 €/mes.\\n\\nQuedo pendiente.' } }));
                        }
                      }}`;

code = code.replace(targetButton, replacementButton);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
