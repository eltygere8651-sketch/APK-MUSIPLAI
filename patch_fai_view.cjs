const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf-8');

const targetStr = `              {/* Generos Toggle */}
              <div 
                className={\`bg-[#243c94] rounded-xl p-4 flex items-center justify-between gap-3 shadow-inner cursor-pointer border-2 transition-all \${genreExploration ? 'border-[#17d1a5]' : 'border-transparent'}\`} 
                onClick={() => {
                  setGenreExploration(!genreExploration);
                  if (!genreExploration) {
                    setShowGenres(true);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={\`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors \${genreExploration ? 'bg-[#17d1a5]/20' : 'bg-white/10'}\`}>
                    <Music className={\`w-4 h-4 \${genreExploration ? 'text-[#17d1a5]' : 'text-white'}\`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-white mb-0.5">Exploración por Géneros</span>
                    <span className="text-[9px] text-white/60 leading-tight">Enfoca FLX en tus géneros favoritos.</span>
                  </div>
                </div>
                <div className={\`w-11 h-6 rounded-full shrink-0 relative transition-colors border-2 \${genreExploration ? 'bg-[#17d1a5] border-[#17d1a5]' : 'bg-transparent border-white/40'}\`}>
                  <div className={\`absolute top-[2px] w-4 h-4 rounded-full transition-all \${genreExploration ? 'left-[22px] bg-black' : 'left-[2px] bg-white/40'}\`} />
                </div>
              </div>

              {genreExploration && (
                <button 
                  onClick={() => setShowGenres(true)}
                  className="bg-[#243c94] hover:bg-[#2d49b3] rounded-xl p-3 flex items-center justify-between transition-colors border border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#17d1a5]" />
                    <span className="text-[11px] text-white font-bold">Género Seleccionado:</span>
                    <span className="text-[11px] text-[#17d1a5] font-black">{selectedGenre}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/50" />
                </button>
              )}`;

code = code.replace(targetStr, '');

fs.writeFileSync('src/components/FAIView.tsx', code);
