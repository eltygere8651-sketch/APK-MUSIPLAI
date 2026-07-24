const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');
code = code.replace(/                            const isFullPlaylistAlreadySaved =(.*?)\s+return isFullPlaylistAlreadySaved \? \(.*?\) : \(.*?Añadir Playlist Completa.*?<\/button>\s+\);\s+\}\(\)\)}/gs, '');
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
