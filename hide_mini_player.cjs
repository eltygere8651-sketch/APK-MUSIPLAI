const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

code = code.replace(
    'trackListTab !== "entertainment" &&\n        trackListTab !== "radio-fai" && (',
    'trackListTab !== "entertainment" &&\n        trackListTab !== "radio-fai" &&\n        trackListTab !== "karaoke" && ('
);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log("Mini player hidden in karaoke mode");
