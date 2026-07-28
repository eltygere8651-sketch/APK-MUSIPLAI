const fs = require('fs');

const fixFn = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    "const getCoverArt = (t: Track) => t.artworkUrl || (t.youtubeId ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` : null);",
    "const getCoverArt = (t: Track | undefined | null) => t ? (t.artworkUrl || (t.youtubeId ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` : null)) : null;"
  );
  fs.writeFileSync(file, content);
}
fixFn('src/components/LibraryView.tsx');
fixFn('src/components/TrackList.tsx');
