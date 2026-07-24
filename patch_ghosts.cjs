const fs = require('fs');
const file = 'src/components/FirebaseProvider.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetGhosts = `            let finalIsValid = isValid;
            let finalPlan = planType;
            let finalTStart = tStart;
            
            setAccessData({`;

const replacementGhosts = `            let finalIsValid = isValid;
            let finalPlan = planType;
            let finalTStart = tStart;
            
            // Clean up ghost anonymous users that have no trial/plan
            if (u.isAnonymous && !finalIsValid && !finalTStart && planType === "none") {
                console.log("Ghost user detected, signing out...");
                await signOut(auth);
                return;
            }
            
            setAccessData({`;

if (code.includes(targetGhosts)) {
  code = code.replace(targetGhosts, replacementGhosts);
  fs.writeFileSync(file, code);
  console.log("Patched ghosts successfully");
} else {
  console.log("Target ghosts not found!");
}
