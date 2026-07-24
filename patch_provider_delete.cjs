const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

const targetStr = `            if (!userSnap.exists()) {
              // Create user doc without trial
              const defaultAvatar = u.photoURL || \`https://api.dicebear.com/7.x/adventurer/svg?seed=\${encodeURIComponent(u.displayName || u.email || u.uid)}\`;
              await setDoc(userRef, {`;
              
const replaceStr = `            if (!userSnap.exists()) {
              // Distinguish between a new sign up and an administratively deleted user
              const creationTime = new Date(u.metadata.creationTime).getTime();
              const isNewUser = (Date.now() - creationTime) < 120000; // 2 minutes window
              
              if (!isNewUser) {
                 // User was deleted by admin from Firestore! Force logout.
                 console.warn("User document deleted by admin. Logging out.");
                 auth.signOut();
                 return;
              }

              // Create user doc without trial
              const defaultAvatar = u.photoURL || \`https://api.dicebear.com/7.x/adventurer/svg?seed=\${encodeURIComponent(u.displayName || u.email || u.uid)}\`;
              await setDoc(userRef, {`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
