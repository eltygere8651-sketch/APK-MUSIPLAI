const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

const target = `
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
`;

const replace = `
            let deviceHasTrial = false;
            let deviceTrialActive = false;
            let deviceTrialStart = 0;
            try {
              const hash = await generateDeviceHash();
              const hashRef = doc(db, 'vip_devices', hash);
              const hashDoc = await getDoc(hashRef);
              if (hashDoc.exists()) {
                deviceHasTrial = true;
                const hd = hashDoc.data();
                deviceTrialStart = hd.activatedAt || 0;
                if (Date.now() <= deviceTrialStart + 7 * 24 * 60 * 60 * 1000) {
                  deviceTrialActive = true;
                }
              }
            } catch (e) {
              console.error("Device hash check failed", e);
            }
`;

code = code.replace(target.trim(), replace.trim());

const targetValid = `
              let finalIsValid = isValid;
              let finalPlan = planType;
              let finalTStart = tStart;
              
              if (deviceIsExpired && u.email !== "eltygere8651@gmail.com" && !(subEnd && subEnd > now)) {
                finalIsValid = false;
                finalPlan = "free"; 
                finalTStart = 1; // Force truthy so GymMusicPlayer considers it expired
              }
`;

const replaceValid = `
              let finalIsValid = isValid;
              let finalPlan = planType;
              let finalTStart = tStart;
              
              if (deviceHasTrial && u.email !== "eltygere8651@gmail.com" && !(subEnd && subEnd > now)) {
                if (deviceTrialActive) {
                  finalIsValid = true;
                  finalPlan = "free";
                  finalTStart = deviceTrialStart;
                  daysRemaining = Math.max(0, Math.ceil(((deviceTrialStart + 7 * msPerDay) - now) / msPerDay));
                } else {
                  finalIsValid = false;
                  finalPlan = "free";
                  finalTStart = 1; // Force truthy so GymMusicPlayer considers it expired
                }
              }
`;

code = code.replace(targetValid.trim(), replaceValid.trim());
fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
console.log('Patched with device inheritance logic');
