const fs = require('fs');
const file = 'src/components/FirebaseProvider.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetAuth = `        // Just fall back to anonymous if not logged in
        try {
            await signInAnonymously(auth);
        } catch (e) {
            console.error("Failed auto sign-in:", e);
            setDbUserProfile(null);
            setAccessData(null);
            setLoading(false);
        } finally {`;

const replacementAuth = `        // Attempt to recover VIP session from device hash
        try {
            const { generateDeviceHash } = await import('../lib/deviceHash');
            const hash = await generateDeviceHash();
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            await signInWithEmailAndPassword(auth, \`device_\${hash}@fluxplay.cc\`, \`Flux-\${hash}\`);
            // If successful, onAuthStateChanged will fire again with the user!
            return;
        } catch (e) {
            // Do not create ghost anonymous users! Just stay unauthenticated.
            setDbUserProfile(null);
            setAccessData(null);
            setLoading(false);
        } finally {`;

if (code.includes(targetAuth)) {
  code = code.replace(targetAuth, replacementAuth);
  fs.writeFileSync(file, code);
  console.log("Patched Provider successfully");
} else {
  console.log("Target Provider not found!");
}
