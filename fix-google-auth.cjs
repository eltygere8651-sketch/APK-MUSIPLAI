const fs = require('fs');
const file = 'src/lib/firebase.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('Capacitor.isNativePlatform()')) {
  // Add Capacitor import
  code = `import { Capacitor } from '@capacitor/core';\n` + code;
  
  // Replace the loginWithGoogle logic
  code = code.replace(/export const loginWithGoogle = async \(\) => {[\s\S]*?await signInWithPopup\(auth, googleProvider\);[\s\S]*?\} catch \(error: any\) {[\s\S]*?console\.warn\("Popup authentication failed, trying redirect fallback:", error\);[\s\S]*?if \(error\?\.code !== "auth\/unauthorized-domain"\) {[\s\S]*?try {[\s\S]*?await signInWithRedirect\(auth, googleProvider\);[\s\S]*?} catch \(redirectError: any\) {[\s\S]*?console\.warn\("Redirect login selection failed:", redirectError\.code \|\| redirectError\.message\);[\s\S]*?if \(onAuthErrorCallback\) {[\s\S]*?onAuthErrorCallback\(redirectError\);[\s\S]*?}[\s\S]*?}[\s\S]*?}[\s\S]*?}[\s\S]*?};/,
`export const loginWithGoogle = async () => {
  const user = auth.currentUser;
  try {
    if (Capacitor.isNativePlatform()) {
      // In Capacitor (Android/iOS), popup flow often fails or opens external browser.
      // Use redirect flow directly.
      await signInWithRedirect(auth, googleProvider);
    } else {
      // Standard web behavior
      await signInWithPopup(auth, googleProvider);
    }
  } catch (error: any) {
    console.warn("Authentication failed:", error);
    if (onAuthErrorCallback) {
      onAuthErrorCallback(error);
    }
    if (!Capacitor.isNativePlatform() && error?.code !== "auth/unauthorized-domain") {
       try {
         await signInWithRedirect(auth, googleProvider);
       } catch(e: any) {
         if (onAuthErrorCallback) onAuthErrorCallback(e);
       }
    }
  }
};`);

  fs.writeFileSync(file, code);
  console.log('Fixed Google Auth for Capacitor in firebase.ts');
}
