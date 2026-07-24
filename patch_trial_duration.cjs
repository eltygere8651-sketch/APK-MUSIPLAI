const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

const target1 = `            let tStart = null;
            let subEnd = null;
            let planType = isVipAccount ? "free" : "none";`;

const replace1 = `            let tStart = null;
            let subEnd = null;
            let trialDurationDays = 7;
            let planType = isVipAccount ? "free" : "none";`;

const target2 = `              tStart = data.trialStart !== undefined ? data.trialStart : null;
              subEnd = data.subscriptionEnd !== undefined ? data.subscriptionEnd : null;
              planType = data.plan || (isVipAccount ? "free" : "none");`;

const replace2 = `              tStart = data.trialStart !== undefined ? data.trialStart : null;
              subEnd = data.subscriptionEnd !== undefined ? data.subscriptionEnd : null;
              trialDurationDays = data.trialDuration || 7;
              planType = data.plan || (isVipAccount ? "free" : "none");`;

const target3 = `            const isSubExpired = hasExplicitSub && subEnd <= now;
            const isTrialExpired = hasExplicitTrial && (tStart + 7 * msPerDay) <= now;`;

const replace3 = `            const isSubExpired = hasExplicitSub && subEnd <= now;
            const isTrialExpired = hasExplicitTrial && (tStart + trialDurationDays * msPerDay) <= now;`;

const target4 = `            } else if (planType === "free" && tStart) {
              const trialEnd = tStart + 7 * msPerDay;`;

const replace4 = `            } else if (planType === "free" && tStart) {
              const trialEnd = tStart + trialDurationDays * msPerDay;`;

code = code.replace(target1, replace1);
code = code.replace(target2, replace2);
code = code.replace(target3, replace3);
code = code.replace(target4, replace4);

fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
