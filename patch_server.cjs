const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `      const userDoc = await db.collection("users").doc(userId).get().catch(() => null);
      if (userDoc && userDoc.exists) {
         const data = userDoc.data();
         if (data && data.deviceHash) {
            // Expire the device trial instead of deleting it, so they don't get a new one
            await db.collection("vip_devices").doc(data.deviceHash).update({ activatedAt: 0 }).catch(() => {});
         }
      }`;

const replace = `      let foundHash = null;
      const userDoc = await db.collection("users").doc(userId).get().catch(() => null);
      if (userDoc && userDoc.exists) {
         const data = userDoc.data();
         if (data && data.deviceHash) foundHash = data.deviceHash;
      }
      
      const vipActDoc = await db.collection("vip_activations").doc(userId).get().catch(() => null);
      if (vipActDoc && vipActDoc.exists) {
         const data = vipActDoc.data();
         if (data && data.deviceHash) foundHash = data.deviceHash;
      }

      if (foundHash) {
          // Expire the device trial instead of deleting it, so they don't get a new one
          await db.collection("vip_devices").doc(foundHash).update({ activatedAt: 0 }).catch(() => {});
      }`;

code = code.replace(target, replace);
fs.writeFileSync('server.ts', code);
