const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

const oldFetch = `
        const fetchUserData = () => {
          getDoc(userRef).then((snapshot) => {
            if (snapshot.exists()) {
`;

const newFetch = `
        const fetchUserData = async () => {
          try {
            const snapshot = await getDoc(userRef);
            let deviceIsExpired = false;
            try {
              const hash = await generateDeviceHash();
              const hashRef = doc(db, 'vip_devices', hash);
              const hashDoc = await getDoc(hashRef);
              if (hashDoc.exists()) {
                const hd = hashDoc.data();
                const act = hd.activatedAt || 0;
                if (Date.now() > act + 7 * 24 * 60 * 60 * 1000) {
                  deviceIsExpired = true;
                }
              }
            } catch (e) {
              console.error("Device hash check failed", e);
            }
            
            if (snapshot.exists()) {
`;

code = code.replace(oldFetch.trim(), newFetch.trim());

// Now patch the part where isValid is set
const oldValid = `
              } else if (planType === "free" && tStart) {
                const trialEnd = tStart + 7 * msPerDay;
                if (trialEnd > now) {
                  isValid = true;
                  daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / msPerDay));
                }
              }

              setAccessData({
`;

const newValid = `
              } else if (planType === "free" && tStart) {
                const trialEnd = tStart + 7 * msPerDay;
                if (trialEnd > now) {
                  isValid = true;
                  daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / msPerDay));
                }
              }
              
              let finalIsValid = isValid;
              let finalPlan = planType;
              let finalTStart = tStart;
              
              if (deviceIsExpired && u.email !== "eltygere8651@gmail.com" && !(subEnd && subEnd > now)) {
                finalIsValid = false;
                finalPlan = "free"; 
                finalTStart = 1; // Force truthy so GymMusicPlayer considers it expired
              }

              setAccessData({
`;

code = code.replace(oldValid.trim(), newValid.trim());

// And finally update the variables inside setAccessData
code = code.replace(`trialStart: tStart,`, `trialStart: finalTStart,`);
code = code.replace(`plan: planType,`, `plan: finalPlan,`);
code = code.replace(`isValid,`, `isValid: finalIsValid,`);

const oldCatch = `
          }).catch((err) => {
            console.error("Firestore getDoc error:", err);
          });
        };
`;

const newCatch = `
          } catch(err) {
            console.error("Firestore getDoc error:", err);
          }
        };
`;
code = code.replace(oldCatch.trim(), newCatch.trim());

fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
console.log('Patched fetchUserData');
