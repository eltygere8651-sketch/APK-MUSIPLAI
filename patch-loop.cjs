const fs = require('fs');

let code = fs.readFileSync('src/domain/audio/AudioEngine.ts', 'utf8');
code = code.replace(
  "if ((this.audioElement.error || !this.audioElement.src) && this.state.currentTrack) {",
  "if (this.currentSource === 'html5' && (this.audioElement.error || !this.audioElement.src) && this.state.currentTrack) {"
);

fs.writeFileSync('src/domain/audio/AudioEngine.ts', code);
