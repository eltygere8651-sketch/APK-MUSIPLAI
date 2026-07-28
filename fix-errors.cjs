const fs = require('fs');

// 1. Fix AudioEngine.ts
let code = fs.readFileSync('src/domain/audio/AudioEngine.ts', 'utf8');
code = code.replace(
  "const coverArt = coverArt || (track.youtubeId ? \\`https://i.ytimg.com/vi/\\${track.youtubeId}/hqdefault.jpg\\` : null);",
  "const coverArt = track.artworkUrl || (track.youtubeId ? \\`https://i.ytimg.com/vi/\\${track.youtubeId}/hqdefault.jpg\\` : null);"
);
fs.writeFileSync('src/domain/audio/AudioEngine.ts', code);

// 2. Add getCoverArt to NowPlayingBar and FullScreenPlayerModal
const addFn = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("export const getCoverArt")) {
    const fn = `\nexport const getCoverArt = (t: Track | undefined | null) => t ? (t.artworkUrl || (t.youtubeId ? \`https://i.ytimg.com/vi/\${t.youtubeId}/hqdefault.jpg\` : null)) : null;\n`;
    content = content.replace("import { PlaybackState, Track }", "import { PlaybackState, Track } from '../domain/types';\n" + fn);
    content = content.replace("import { PlaybackState, Track } from '../domain/types';", "");
    fs.writeFileSync(file, content);
  }
}

addFn('src/components/NowPlayingBar.tsx');
addFn('src/components/FullScreenPlayerModal.tsx');

