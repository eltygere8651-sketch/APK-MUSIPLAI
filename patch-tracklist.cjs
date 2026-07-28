const fs = require('fs');

let code = fs.readFileSync('src/components/TrackList.tsx', 'utf8');

const fn = `\nconst getCoverArt = (t: Track) => t.artworkUrl || (t.youtubeId ? \`https://i.ytimg.com/vi/\${t.youtubeId}/hqdefault.jpg\` : null);\n`;
code = code.replace("export const TrackList: React.FC<TrackListProps> = ({", fn + "\nexport const TrackList: React.FC<TrackListProps> = ({");

code = code.replace(/track\.artworkUrl/g, "getCoverArt(track)");

fs.writeFileSync('src/components/TrackList.tsx', code);
console.log("Patched TrackList");
