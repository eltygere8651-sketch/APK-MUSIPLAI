const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `      if (userDoc && userDoc.exists) {
         const data = userDoc.data();
         if (data && data.deviceHash) {
            await db.collection("vip_devices").doc(data.deviceHash).delete().catch(() => {});
         }
      }`;

const replace = `      if (userDoc && userDoc.exists) {
         const data = userDoc.data();
         if (data && data.deviceHash) {
            // Expire the device trial instead of deleting it, so they don't get a new one
            await db.collection("vip_devices").doc(data.deviceHash).update({ activatedAt: 0 }).catch(() => {});
         }
      }`;

code = code.replace(target, replace);
fs.writeFileSync('server.ts', code);
