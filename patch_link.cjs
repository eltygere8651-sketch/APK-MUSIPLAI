const fs = require('fs');
const file = 'src/components/VIPLandingView.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetLink = `     try {
         if (auth.currentUser) {
             await createUserWithEmailAndPassword(auth, email, password);
             window.history.replaceState({}, '', '/');
             window.location.reload();
         }
     } catch (err: any) {`;

const replacementLink = `     try {
         if (auth.currentUser) {
             const { updateEmail, updatePassword } = await import('firebase/auth');
             await updateEmail(auth.currentUser, email);
             await updatePassword(auth.currentUser, password);
             window.history.replaceState({}, '', '/');
             window.location.reload();
         }
     } catch (err: any) {`;

if (code.includes(targetLink)) {
  code = code.replace(targetLink, replacementLink);
  fs.writeFileSync(file, code);
  console.log("Patched Link successfully");
} else {
  console.log("Target Link not found!");
}
