const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

const targetStr = `            if (snapshot.exists()) {
              const data = snapshot.data();`;

const replaceStr = `            if (!snapshot.exists()) {
              const creationTime = new Date(u.metadata.creationTime).getTime();
              const isNewUser = (Date.now() - creationTime) < 120000;
              if (!isNewUser) {
                console.warn("User deleted remotely. Signing out.");
                auth.signOut();
                return;
              }
            }
            if (snapshot.exists()) {
              const data = snapshot.data();`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
