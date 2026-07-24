const fs = require('fs');
let code = fs.readFileSync('src/components/VIPLandingView.tsx', 'utf8');

code = code.replace(
  /      const currentUser = auth\.currentUser;\s*if \(currentUser\) \{\s*const userDoc = await getDoc\(doc\(db, "users", currentUser\.uid\)\);\s*if \(userDoc\.exists\(\)\) \{/,
  '      let userDocExists = false;\n      const currentUser = auth.currentUser;\n      if (currentUser) {\n        const userDoc = await getDoc(doc(db, "users", currentUser.uid));\n        if (userDoc.exists()) {\n           userDocExists = true;'
);

code = code.replace(
  /      \/\/ Create the user profile\s*await setDoc\(doc\(db, "users", uid\), \{\s*displayName: randomName,\s*isVIPGuest: true,\s*createdAt: serverTimestamp\(\),\s*lastLogin: serverTimestamp\(\),\s*lastActiveAt: now,\s*totalUsageTime: 0,\s*plan: "free",\s*trialStart: now,\s*maxUsers: 1,\s*originCampaign: campaignId \|\| null,\s*\}, \{ merge: true \}\);/,
  `      // Create the user profile
      if (userDocExists) {
        await updateDoc(doc(db, "users", uid), {
          isVIPGuest: true,
          lastActiveAt: now,
          plan: "free",
          trialStart: now,
          maxUsers: 1,
          originCampaign: campaignId || null,
        });
      } else {
        await setDoc(doc(db, "users", uid), {
          displayName: randomName,
          isVIPGuest: true,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          lastActiveAt: now,
          totalUsageTime: 0,
          plan: "free",
          trialStart: now,
          maxUsers: 1,
          originCampaign: campaignId || null,
        });
      }`
);

fs.writeFileSync('src/components/VIPLandingView.tsx', code);
