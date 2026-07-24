const fs = require('fs');
const file = 'src/components/GymMusicPlayer.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `  useEffect(() => {
    if (user && !authLoading) {
      const name = user.displayName;
      if (!name || name.includes("@") || name === "Usuario") {
        setShowNicknameModal(true);
      }
    }
  }, [user, authLoading]);`;

const replacement = `  useEffect(() => {
    if (user && !authLoading && !user.isAnonymous) {
      const name = user.displayName;
      if (!name || name.includes("@") || name === "Usuario") {
        setShowNicknameModal(true);
      }
    }
  }, [user, authLoading]);`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(file, code);
  console.log("Patched successfully");
} else {
  console.log("Target not found!");
}
