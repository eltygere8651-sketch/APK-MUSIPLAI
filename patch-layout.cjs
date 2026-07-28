const fs = require('fs');
let code = fs.readFileSync('src/components/FullScreenPlayerModal.tsx', 'utf8');

const badPlayerTab = `        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-[420px] mx-auto w-full pb-8">
          {/* Large Album Artwork */}
          <div className="w-full aspect-square rounded-[32px] bg-neutral-900 overflow-hidden shadow-2xl mb-12 relative group">
            {getCoverArt(currentTrack) ? (
              <img src={getCoverArt(currentTrack)} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-neutral-600 p-6 text-center">
                <Music className="w-24 h-24 mb-4 text-neutral-700" />
              </div>
            )}
          </div>`;

const goodPlayerTab = `        <div className="relative z-10 flex-1 flex flex-col items-center justify-between max-w-[420px] mx-auto w-full pb-6 md:pb-8">
          {/* Large Album Artwork */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center mb-6 mt-2">
            <div className="w-full max-w-[420px] max-h-full aspect-square rounded-2xl md:rounded-[32px] bg-neutral-900 overflow-hidden shadow-2xl relative group">
              {getCoverArt(currentTrack) ? (
                <img src={getCoverArt(currentTrack)} alt={currentTrack.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-neutral-600 p-6 text-center">
                  <Music className="w-24 h-24 mb-4 text-neutral-700" />
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full shrink-0">`;

// Add closing div for the new wrapper
code = code.replace(badPlayerTab, goodPlayerTab);

const controlsEndMatch = `            {/* Volume Control */}
            <div className="flex items-center gap-3 w-full max-w-[280px] mx-auto opacity-70 hover:opacity-100 transition-opacity">
              <button onClick={onToggleMute} className="text-white hover:text-emerald-400">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-emerald-400"
              />
            </div>
        </div>`;

const controlsEndGood = `            {/* Volume Control */}
            <div className="flex items-center gap-3 w-full max-w-[280px] mx-auto opacity-70 hover:opacity-100 transition-opacity">
              <button onClick={onToggleMute} className="text-white hover:text-emerald-400">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-emerald-400"
              />
            </div>
          </div>
        </div>`;

code = code.replace(controlsEndMatch, controlsEndGood);

// Make the layout smaller to fit in the screen without scrolling
code = code.replace('mb-8 px-2"', 'mb-4 px-2"'); // Track Info & Quick Actions margin
code = code.replace('mb-10 px-2"', 'mb-6 px-2"'); // Progress Slider margin
code = code.replace('mb-10"', 'mb-6"'); // Playback Controls margin

fs.writeFileSync('src/components/FullScreenPlayerModal.tsx', code);
console.log("Patched layout in modal");
