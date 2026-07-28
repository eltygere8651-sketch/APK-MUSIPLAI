const fs = require('fs');

const fixFn = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace("export const getCoverArt = (t: Track | undefined | null) => t ? (t.artworkUrl || (t.youtubeId ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` : null)) : null; from '../domain/types';", 
    "import { PlaybackState, Track } from '../domain/types';\nexport const getCoverArt = (t: Track | undefined | null) => t ? (t.artworkUrl || (t.youtubeId ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` : null)) : null;");
  fs.writeFileSync(file, content);
}
fixFn('src/components/NowPlayingBar.tsx');
fixFn('src/components/FullScreenPlayerModal.tsx');
