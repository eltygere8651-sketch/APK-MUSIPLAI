const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

const target = `            if (snapshot.exists()) {
              const data = snapshot.data();`;

const replace = `            if (snapshot.exists()) {
              const data = snapshot.data();
              if (deviceHasTrial) {
                // Keep the deviceHash in sync with the user document so the admin can delete it if needed
                generateDeviceHash().then(hash => {
                  if (data.deviceHash !== hash) {
                    setDoc(userRef, { deviceHash: hash }, { merge: true }).catch(() => {});
                  }
                }).catch(() => {});
              }`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
