const fs = require('fs');

let code = fs.readFileSync('src/domain/audio/AudioEngine.ts', 'utf8');
if (!code.includes("public getYoutubeContainer")) {
  code = code.replace(
    "public getQueue(): Track[] {",
    "public getYoutubeContainer() { return this.ytPlayer.getContainer(); }\n  public getQueue(): Track[] {"
  );
  fs.writeFileSync('src/domain/audio/AudioEngine.ts', code);
  console.log("Patched getYoutubeContainer");
}
