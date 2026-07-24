const fs = require('fs');
const file = 'src/components/VIPLandingView.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `      if (userDocExists) {
        await updateDoc(doc(db, "users", uid), {
          isVIPGuest: true,
          lastActiveAt: now,
          plan: "free",
          trialStart: now,
          maxUsers: 1,
          originCampaign: campaignId || null,
        });
      } else {`;

const replacement = `      if (userDocExists) {
        await updateDoc(doc(db, "users", uid), {
          isVIPGuest: true,
          lastActiveAt: now,
          plan: "free",
          trialStart: now,
          maxUsers: 1,
          originCampaign: campaignId || null,
          displayName: targetUser.displayName || randomName,
        });
      } else {`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(file, code);
  console.log("Patched successfully");
} else {
  console.log("Target not found!");
}
