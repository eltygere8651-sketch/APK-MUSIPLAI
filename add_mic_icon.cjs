const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const target = 'Bot } from "lucide-react";';
const replacement = 'Bot, Mic2 } from "lucide-react";';

if (code.includes(target) && !code.includes('Mic2 }')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
    console.log("Added Mic2 icon import.");
} else {
    console.log("Failed to add Mic2 icon or already added.");
}
