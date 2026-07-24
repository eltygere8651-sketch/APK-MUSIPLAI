const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const target = 'const [isPlaying, setIsPlaying] = useState(false);';
const replacement = 'const [isPlaying, setIsPlaying] = useState(false);\n  const [isKaraokeMode, setIsKaraokeMode] = useState(false);';

if (code.includes(target) && !code.includes('isKaraokeMode')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
    console.log("Added Karaoke state.");
} else {
    console.log("Failed to add Karaoke state or already added.");
}
