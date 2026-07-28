const fs = require('fs');

let code = fs.readFileSync('src/domain/audio/AudioEngine.ts', 'utf8');

if (!code.includes("private currentObjectUrl: string | null = null;")) {
  code = code.replace(
    'private pendingPlayPromise: Promise<void> | null = null;',
    'private pendingPlayPromise: Promise<void> | null = null;\n  private currentObjectUrl: string | null = null;'
  );

  const newBlobLoading2 = `const storedBlob = await localStorageService.getAudioBlob(track.id);
        if (storedBlob) {
          if (this.currentObjectUrl) {
            URL.revokeObjectURL(this.currentObjectUrl);
          }
          mediaUrl = URL.createObjectURL(storedBlob);
          this.currentObjectUrl = mediaUrl;
          track.url = mediaUrl;
        }`;

  code = code.replace(
    /const storedBlob = await localStorageService\.getAudioBlob\(track\.id\);\s*if \(storedBlob\) \{\s*if \(Capacitor\.isNativePlatform\(\)\) \{\s*\/\/ For native plugin[\s\S]*?mediaUrl = await URL\.createObjectURL\(storedBlob\);\s*\} else \{\s*mediaUrl = URL\.createObjectURL\(storedBlob\);\s*\}\s*track\.url = mediaUrl;\s*\}/,
    newBlobLoading2
  );

  fs.writeFileSync('src/domain/audio/AudioEngine.ts', code);
  console.log("Patched blob revoking");
}
