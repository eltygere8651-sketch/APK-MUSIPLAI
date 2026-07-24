const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

// Replace fetchUserData with onSnapshot
const target1 = `const fetchUserData = async () => {`;
const replace1 = `unsubscribeFirestore = onSnapshot(userRef, async (snapshot) => {`;
code = code.replace(target1, replace1);

const target2 = `const pollInterval = setInterval(() => {
          // Fetch access state & also sync general app usage stats every 5 minutes (incredibly cost efficient!)
          fetchUserData();
          if (document.visibilityState === "visible") {
            syncUsageAndActivity();
          }
        }, 5 * 60 * 1000);`;
const replace2 = `const pollInterval = setInterval(() => {
          if (document.visibilityState === "visible") {
            syncUsageAndActivity();
          }
        }, 5 * 60 * 1000);`;
code = code.replace(target2, replace2);

const target3 = `fetchUserData();`;
const replace3 = `// fetchUserData();`;
code = code.replace(/fetchUserData\(\);/g, replace3);

const target4 = `} catch(err) {
            console.error("Firestore getDoc error:", err);
          }
        };`;
const replace4 = `} catch(err) {
            console.error("Firestore getDoc error:", err);
          }
        });`;
code = code.replace(target4, replace4);

fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
