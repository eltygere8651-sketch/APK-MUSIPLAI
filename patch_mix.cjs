const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

code = code.replace(
  /if \(track && !track\.isPlaylist\) \{[\s\S]*?mixedTracks\.push\(track\);\s*\}\s*\}/g,
  `if (track && !track.isPlaylist && isReasonableTrack(track.duration, track.title)) {
                                // Avoid duplicate tracks
                                if (
                                  !mixedTracks.find(
                                    (t) =>
                                      t.url === track.url || t.id === track.id,
                                  )
                                ) {
                                  mixedTracks.push(track);
                                }
                              }`
);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
