const fs = require('fs');
let code = fs.readFileSync('src/components/FullScreenPlayerModal.tsx', 'utf8');

const badQueueItem = `                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-semibold text-neutral-500 w-6 text-center">{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{track.title}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{track.artist}</p>
                  </div>`;

const goodQueueItem = `                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-semibold text-neutral-500 w-6 text-center">{idx + 1}</span>
                  {getCoverArt(track) ? (
                    <img src={getCoverArt(track)!} alt={track.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Music className="w-4 h-4 text-neutral-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{track.title}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{track.artist}</p>
                  </div>`;

code = code.replace(badQueueItem, goodQueueItem);
fs.writeFileSync('src/components/FullScreenPlayerModal.tsx', code);
console.log("Patched queue");
