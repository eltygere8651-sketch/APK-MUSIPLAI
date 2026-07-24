const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

const targetLogic = `            if (deviceHasTrial && u.email !== "eltygere8651@gmail.com") {
              const shouldApplyDeviceTrial = !isSubExpired && !isTrialExpired && !isPlanNone;
              
              if (shouldApplyDeviceTrial) {
                if (deviceTrialActive) {
                  finalIsValid = true;
                  finalPlan = "free";
                  finalTStart = deviceTrialStart;
                  daysRemaining = Math.max(0, Math.ceil(((deviceTrialStart + 7 * msPerDay) - now) / msPerDay));
                } else if (!hasExplicitSub && !hasExplicitTrial) {
                  // Only force expiration from device trial if the user has no explicit trial/sub themselves
                  finalIsValid = false;
                  finalPlan = "free";
                  finalTStart = 1; 
                }
              }
            }`;

const replacementLogic = `            if (deviceHasTrial && u.email !== "eltygere8651@gmail.com") {
              // If the user has a valid subscription, don't override it.
              // Otherwise, we enforce the device's trial status.
              const hasActiveSub = hasExplicitSub && !isSubExpired;
              
              if (!hasActiveSub) {
                if (deviceTrialActive) {
                  finalIsValid = true;
                  finalPlan = "free";
                  finalTStart = deviceTrialStart;
                  daysRemaining = Math.max(0, Math.ceil(((deviceTrialStart + 7 * msPerDay) - now) / msPerDay));
                } else {
                  // Device trial is EXPIRED!
                  // Enforce expiration so they can't request again.
                  finalIsValid = false;
                  finalPlan = "free";
                  finalTStart = 1; 
                }
              }
            }`;

code = code.replace(targetLogic, replacementLogic);
fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
