const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldCode = `    };
    fetchCommunity();

    const fetchUserPlaylists = async (force = false) => {`;

const newCode = `    };
    fetchCommunity();

    const handleRefreshCommunity = () => fetchCommunity(true);
    window.addEventListener("refreshCommunity", handleRefreshCommunity);

    const fetchUserPlaylists = async (force = false) => {`;

code = code.replace(oldCode, newCode);

const oldCleanup = `    return () => {
      window.removeEventListener("refreshUserPlaylists", handleRefresh);
    };`;
    
const newCleanup = `    return () => {
      window.removeEventListener("refreshUserPlaylists", handleRefresh);
      window.removeEventListener("refreshCommunity", handleRefreshCommunity);
    };`;

code = code.replace(oldCleanup, newCleanup);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
