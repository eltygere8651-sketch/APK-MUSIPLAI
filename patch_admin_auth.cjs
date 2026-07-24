const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `    try {
      await admin.auth().deleteUser(userId);
    } catch (authErr) {
      console.warn("User not found in Auth, but proceeding to delete from DB", authErr);
    }`;

const replace = `    // In AI Studio, we don't have admin access to the user's Firebase Auth project
    // We only delete the user from Firestore. The client will automatically sign them out
    // when it detects the user document is deleted.`;

code = code.replace(target, replace);
fs.writeFileSync('server.ts', code);
