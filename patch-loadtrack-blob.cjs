const fs = require('fs');

let code = fs.readFileSync('src/domain/audio/AudioEngine.ts', 'utf8');

const oldBlobLoading = `const storedBlob = await localStorageService.getAudioBlob(track.id);
        if (storedBlob) {
          mediaUrl = await LocalFolderImporter.fileToDataUrl(storedBlob, track.title);
          track.url = mediaUrl;
        }`;

const newBlobLoading = `const storedBlob = await localStorageService.getAudioBlob(track.id);
        if (storedBlob) {
          if (Capacitor.isNativePlatform()) {
             // For native plugin, we might need a file path or base64. Let's fallback to base64 if needed, 
             // but only when strictly needed for NativeAudio, or better, use HTML5 audio for IDB blobs on native if NativeAudio fails.
             mediaUrl = await URL.createObjectURL(storedBlob);
          } else {
             mediaUrl = URL.createObjectURL(storedBlob);
          }
          track.url = mediaUrl;
        }`;

code = code.replace(oldBlobLoading, newBlobLoading);

// Fix the condition for html5 loading
const html5ConditionOld = `if (track.sourceType === 'local_file' || (mediaUrl && mediaUrl.startsWith('blob:'))) {`;
const html5ConditionNew = `if (track.sourceType === 'local_file' || track.sourceType === 'folder' || (mediaUrl && (mediaUrl.startsWith('blob:') || mediaUrl.startsWith('data:')))) {`;

code = code.replace(html5ConditionOld, html5ConditionNew);

fs.writeFileSync('src/domain/audio/AudioEngine.ts', code);
console.log("Patched loadTrack to use object URLs");
