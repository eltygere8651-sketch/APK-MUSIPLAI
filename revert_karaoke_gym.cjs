const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

// Revert imports
code = code.replace('import { KaraokeView } from "./KaraokeView";\n', '');
code = code.replace('Bot, Mic2 } from "lucide-react";', 'Bot } from "lucide-react";');

// Revert state
code = code.replace('const [isPlaying, setIsPlaying] = useState(false);\n  const [isKaraokeMode, setIsKaraokeMode] = useState(false);', 'const [isPlaying, setIsPlaying] = useState(false);');

// Revert button (we might have added it in a couple of places or just one, let's use regex or string replace)
const btnRegex1 = /\{\/\*\s*Karaoke Mode Button\s*\*\/\}[\s\S]*?<Mic2 className="[^"]+" \/>\s*<\/button>\s*\{\/\*\s*Volume Adjuster\s*\*\/\}/g;
code = code.replace(btnRegex1, '{/* Volume Adjuster */}');

// Revert render block
const renderRegex = /<AnimatePresence>\s*\{isKaraokeMode && currentTrack && \([\s\S]*?<\/AnimatePresence>/g;
code = code.replace(renderRegex, '');

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log("Reverted GymMusicPlayer.tsx");
