const fs = require('fs');

let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const startStr = '        {[';
const endStr = '          </button>\n        ))}\n';

const idxStart = code.indexOf('label: "Energía"');
if (idxStart !== -1) {
    const sectionStart = code.lastIndexOf(startStr, idxStart);
    const sectionEnd = code.indexOf(endStr, idxStart) + endStr.length;
    
    if (sectionStart !== -1 && sectionEnd !== -1) {
        code = code.substring(0, sectionStart) + code.substring(sectionEnd);
        fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
        console.log("Removed pills.");
    }
}
