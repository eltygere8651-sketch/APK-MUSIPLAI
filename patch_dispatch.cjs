const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

code = code.replace(/window\.dispatchEvent\(new Event\("refreshUserPlaylists"\)\);/g, 'window.dispatchEvent(new Event("refreshUserPlaylists"));\n      window.dispatchEvent(new Event("refreshCommunity"));');

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
