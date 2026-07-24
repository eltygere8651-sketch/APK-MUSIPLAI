const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const target = 'import { FAIView } from "./FAIView";';
const replacement = 'import { FAIView } from "./FAIView";\nimport { KaraokeView } from "./KaraokeView";';

if (code.includes(target) && !code.includes('KaraokeView"')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
    console.log("Added Karaoke import.");
} else {
    console.log("Failed to add Karaoke import or already added.");
}
