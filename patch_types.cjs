const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const regex = /const normalizeDoc = \(doc\) => \{/;

if (regex.test(code)) {
    code = code.replace(regex, "const normalizeDoc = (doc: any) => {");
    fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
    console.log("Patched successfully!");
} else {
    console.log("Regex didn't match.");
}
