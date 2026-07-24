const fs = require('fs');
const file = 'src/components/VIPLandingView.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `      let uid;
      if (!currentUser) {
         const userCred = await signInAnonymously(auth);
         uid = userCred.user.uid;
      } else {
         uid = currentUser.uid;
      }
      const now = Date.now();
      
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const prefixes = ['FluxUser', 'MusicFan', 'Listener', 'FluxRock', 'Player'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const randomName = \`\${prefix}\${randomId}\`;`;

const replacement = `      let uid;
      let targetUser = currentUser;
      if (!currentUser) {
         const userCred = await signInAnonymously(auth);
         uid = userCred.user.uid;
         targetUser = userCred.user;
      } else {
         uid = currentUser.uid;
      }
      const now = Date.now();
      
      const randomId = Math.floor(100 + Math.random() * 900);
      const prefixes = ['BailarínFeliz', 'OsoMarchoso', 'TiburónDisco', 'PandaRitmo', 'GatoCumbiero', 'RayoSónico', 'PingüinoDJ'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const randomName = \`\${prefix}\${randomId}\`;
      
      if (targetUser && !targetUser.displayName) {
        try {
          await updateProfile(targetUser, { displayName: randomName });
        } catch(e) { console.error(e); }
      }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(file, code);
  console.log("Patched successfully");
} else {
  console.log("Target not found!");
}
