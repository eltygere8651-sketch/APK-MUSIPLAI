const fs = require('fs');

let code = fs.readFileSync('src/components/TrackList.tsx', 'utf8');

code = code.replace(
  'const { tracks, currentTrackId, isPlaying, onPlayTrack, onToggleFavorite, onDeleteTrack } = data;',
  'const { tracks, currentTrackId, isPlaying, onPlayTrack, onToggleFavorite, onDeleteTrack, ariaAttributes } = data;'
);

code = code.replace(
  '<div style={style}>',
  '<div style={style} {...ariaAttributes}>'
);

fs.writeFileSync('src/components/TrackList.tsx', code);
console.log("Patched aria attributes for TrackList");
