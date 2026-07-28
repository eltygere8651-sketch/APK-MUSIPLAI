const fs = require('fs');

// Patch YoutubePlayerWrapper
let code = fs.readFileSync('src/domain/audio/YoutubePlayerWrapper.ts', 'utf8');
if (!code.includes("public getContainer")) {
  code = code.replace(
    "public getDuration(): number {",
    "public getContainer(): HTMLDivElement | null { return this.container; }\n  public getDuration(): number {"
  );
  fs.writeFileSync('src/domain/audio/YoutubePlayerWrapper.ts', code);
  console.log("Patched YoutubePlayerWrapper");
}

// Patch AudioEngine
code = fs.readFileSync('src/domain/audio/AudioEngine.ts', 'utf8');
if (!code.includes("public getYoutubeContainer")) {
  code = code.replace(
    "public getQueue() {",
    "public getYoutubeContainer() { return this.ytPlayer.getContainer(); }\n  public getQueue() {"
  );
  fs.writeFileSync('src/domain/audio/AudioEngine.ts', code);
  console.log("Patched AudioEngine");
}
