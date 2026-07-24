const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

code = code.replace(/duration=\{duration > 0 \? duration \/ 1000 : 0\}/, 'duration={duration > 0 ? duration / 1000 : 0}\n                        triggerAiDj={playAiDj}');

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
