const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

if (!code.includes('  Globe,')) {
    code = code.replace('import {', 'import {\\n  Globe,');
    fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
}
