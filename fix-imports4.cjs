const fs = require('fs');

const fixFn = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  const startIdx = content.indexOf("export const getCoverArt = ");
  const endIdx = content.indexOf("from '../domain/types';", startIdx);
  
  if (startIdx !== -1 && endIdx !== -1) {
    const toReplace = content.substring(startIdx, endIdx + "from '../domain/types';".length);
    const replacement = "import { PlaybackState, Track } from '../domain/types';\nexport const getCoverArt = (t: Track | undefined | null) => t ? (t.artworkUrl || (t.youtubeId ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` : null)) : null;";
    
    newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx + "from '../domain/types';".length);
    fs.writeFileSync(file, newContent);
    console.log("Fixed", file);
  } else {
    console.log("Not found in", file);
  }
}

fixFn('src/components/NowPlayingBar.tsx');
fixFn('src/components/FullScreenPlayerModal.tsx');
