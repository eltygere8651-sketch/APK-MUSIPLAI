const fs = require('fs');
const file = 'src/components/VIPLandingView.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetActivate = `      if (!currentUser) {
         const userCred = await signInAnonymously(auth);
         uid = userCred.user.uid;
         targetUser = userCred.user;
      } else {`;

const replacementActivate = `      if (!currentUser) {
         try {
           const { signInWithEmailAndPassword } = await import('firebase/auth');
           const fakeEmail = \`device_\${hash}@fluxplay.cc\`;
           const fakePassword = \`Flux-\${hash}\`;
           let userCred;
           try {
              userCred = await createUserWithEmailAndPassword(auth, fakeEmail, fakePassword);
           } catch(e: any) {
              if (e.code === 'auth/email-already-in-use') {
                 userCred = await signInWithEmailAndPassword(auth, fakeEmail, fakePassword);
              } else {
                 throw e;
              }
           }
           uid = userCred.user.uid;
           targetUser = userCred.user;
         } catch(e) {
           console.error("Fallback to anonymous:", e);
           const userCred = await signInAnonymously(auth);
           uid = userCred.user.uid;
           targetUser = userCred.user;
         }
      } else {`;

if (code.includes(targetActivate)) {
  code = code.replace(targetActivate, replacementActivate);
  fs.writeFileSync(file, code);
  console.log("Patched Activate successfully");
} else {
  console.log("Target Activate not found!");
}
