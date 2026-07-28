const fs = require('fs');

let code = fs.readFileSync('src/domain/audio/AudioEngine.ts', 'utf8');

code = code.replace(
  "this.state.error = \"YouTube Error: \" + error;",
  "this.state.error = \"YouTube Error: \" + error;\n      console.warn(\"YT Error: \", error);\n      if (this.state.currentTrack) { this.startSynthFallback(this.state.currentTrack); }"
);

fs.writeFileSync('src/domain/audio/AudioEngine.ts', code);
console.log("Patched YT onError in AudioEngine");
