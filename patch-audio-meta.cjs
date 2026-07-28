const fs = require('fs');
let code = fs.readFileSync('src/domain/audio/AudioEngine.ts', 'utf8');

const badArt = "const artwork = track.artworkUrl ? [";
const goodArt = `const coverArt = track.artworkUrl || (track.youtubeId ? \`https://i.ytimg.com/vi/\${track.youtubeId}/hqdefault.jpg\` : null);
    const artwork = coverArt ? [`;

code = code.replace(badArt, goodArt);
code = code.replace(/track\.artworkUrl/g, "coverArt");
fs.writeFileSync('src/domain/audio/AudioEngine.ts', code);
console.log("Patched MediaSession");

code = fs.readFileSync('src/components/LibraryView.tsx', 'utf8');
const fn = `\nconst getCoverArt = (t: Track) => t.artworkUrl || (t.youtubeId ? \`https://i.ytimg.com/vi/\${t.youtubeId}/hqdefault.jpg\` : null);\n`;
code = code.replace("export const LibraryView: React.FC<LibraryViewProps> = ({", fn + "\nexport const LibraryView: React.FC<LibraryViewProps> = ({");

code = code.replace(/t\.artworkUrl\)/g, "getCoverArt(t))");
code = code.replace(/firstWithArt\?\.artworkUrl/g, "getCoverArt(firstWithArt!)");
code = code.replace(/firstWithArt\.artworkUrl/g, "getCoverArt(firstWithArt!)!");

fs.writeFileSync('src/components/LibraryView.tsx', code);
console.log("Patched LibraryView");
