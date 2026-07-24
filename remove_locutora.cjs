const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

// Remove states
code = code.replace(/  const \[aiDjEnabled, setAiDjEnabled\] = useState[^;]+;\n  \}\);\n/g, '');
code = code.replace(/  const \[aiVoice, setAiVoice\] = useState[^;]+;\n  \}\);\n/g, '');
code = code.replace(/  const \[showAiDjModal, setShowAiDjModal\] = useState\(false\);\n/g, '');
code = code.replace(/  const \[isDjLoading, setIsDjLoading\] = useState\(false\);\n/g, '');
code = code.replace(/  const \[isDucking, setIsDucking\] = useState\(false\);\n/g, '');

// Remove AI DJ logic (playAiJoke, testAiVoice, etc)
code = code.replace(/\/\/ AI DJ Logic[\s\S]*?(?=  const \[volume)/g, '');

// Remove Locutora button 1
code = code.replace(/\{.*?Locutora.*?\}[\s\S]*?trackListTab === "radio-fai" && \([\s\S]*?<\/button>\s*\)\}/g, '');
// Remove Locutora button 2
code = code.replace(/\{.*?Locutora.*?\}[\s\S]*?trackListTab === "radio-fai" && \([\s\S]*?<\/button>\s*\)\}/g, '');

// Remove Modal
code = code.replace(/\{?\/\* AI DJ Settings Modal \*\/\}?[\s\S]*?<\/AnimatePresence>/g, '');

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
