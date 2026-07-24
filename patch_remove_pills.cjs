const fs = require('fs');

let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const regex = /\{\[\s*\{\s*label:\s*"Energía"[\s\S]*?\s*\}\)\}\s*\]\.map\(\(pill,\s*idx\)\s*=>\s*\([\s\S]*?\}\)\)}/g;
if (regex.test(code)) {
    code = code.replace(regex, '');
    fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
    console.log("Replaced pills successfully");
} else {
    console.log("Could not find pills to remove");
}
