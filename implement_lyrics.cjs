const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

// Add states
code = code.replace(
    'const [isPlaying, setIsPlaying] = useState(true);',
    'const [isPlaying, setIsPlaying] = useState(true);\n  const [lyrics, setLyrics] = useState<{time: number, text: string}[] | string | null>(null);\n  const [currentTime, setCurrentTime] = useState(0);\n  const [lyricsState, setLyricsState] = useState<"loading" | "found" | "not_found">("loading");'
);

// Add useEffect
const useEffectStr = `
  useEffect(() => {
    if (currentTrack) {
      setLyrics(null);
      setCurrentTime(0);
      setLyricsState("loading");
      
      let query = currentTrack.title.replace(/karaoke|instrumental|cover|lyrics|letra|video oficial|official video/gi, '').trim();
      query = query.replace(/\\[.*?\\]|\\(.*?\\)/g, '').trim();
      
      fetch(\`https://lrclib.net/api/search?q=\${encodeURIComponent(query)}\`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
             const bestMatch = data.find((d: any) => d.syncedLyrics) || data[0];
             if (bestMatch.syncedLyrics) {
               const lines = bestMatch.syncedLyrics.split('\\n');
               const parsed = [];
               const regex = /\\[(\\d{2}):(\\d{2}\\.\\d{2,3})\\](.*)/;
               for (const line of lines) {
                 const match = line.match(regex);
                 if (match) {
                   const min = parseInt(match[1]);
                   const sec = parseFloat(match[2]);
                   const text = match[3].trim();
                   if (text) parsed.push({ time: min * 60 + sec, text });
                 }
               }
               setLyrics(parsed);
               setLyricsState("found");
             } else if (bestMatch.plainLyrics) {
               setLyrics(bestMatch.plainLyrics);
               setLyricsState("found");
             } else {
               setLyricsState("not_found");
             }
          } else {
             setLyricsState("not_found");
          }
        }).catch(err => {
          console.error("Lyrics fetch error:", err);
          setLyricsState("not_found");
        });
    }
  }, [currentTrack]);
`;

code = code.replace(
    '// Microphone & Audio Engine',
    useEffectStr + '\n  // Microphone & Audio Engine'
);

// Update ReactPlayer to include onProgress
code = code.replace(
    /playing=\{isPlaying\}/,
    'playing={isPlaying}\n                    onProgress={(p) => setCurrentTime(p.playedSeconds)}'
);

// Add the lyrics overlay
const overlayRegex = /\{\/\* Playback Controls Overlay/;
const lyricsOverlay = `
                {/* Lyrics Overlay */}
                <div className="absolute inset-0 z-15 flex flex-col items-center justify-center pointer-events-none p-4 pb-24">
                  {lyricsState === "loading" && (
                    <div className="text-xl font-bold text-white/50 animate-pulse bg-black/40 px-6 py-3 rounded-full backdrop-blur-md">Buscando letras inteligentes...</div>
                  )}
                  {lyricsState === "not_found" && (
                    <div className="text-sm font-bold text-white/30 bg-black/40 px-6 py-3 rounded-full backdrop-blur-md">No se encontraron letras externas para esta pista.</div>
                  )}
                  {lyricsState === "found" && Array.isArray(lyrics) && (
                    <div className="w-full max-w-4xl flex flex-col items-center justify-center space-y-6">
                      {(() => {
                        const activeIndex = lyrics.findIndex((l, i) => l.time <= currentTime && (!lyrics[i+1] || lyrics[i+1].time > currentTime));
                        return lyrics.map((line, idx) => {
                          const isActive = idx === activeIndex;
                          const isPast = idx < activeIndex;
                          const isFuture = idx > activeIndex;
                          
                          if (idx < activeIndex - 1 || idx > activeIndex + 2) return null;
                          
                          return (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ 
                                opacity: isActive ? 1 : isPast ? 0.3 : 0.6, 
                                y: 0,
                                scale: isActive ? 1.1 : 0.95
                              }}
                              className={\`text-center font-black transition-all duration-300 drop-shadow-2xl \${isActive ? 'text-3xl md:text-5xl text-emerald-400' : 'text-xl md:text-3xl text-white'}\`}
                              style={{ textShadow: isActive ? '0 0 20px rgba(16,185,129,0.8)' : '0 2px 10px rgba(0,0,0,0.8)' }}
                            >
                               {line.text}
                            </motion.div>
                          );
                        });
                      })()}
                    </div>
                  )}
                  {lyricsState === "found" && typeof lyrics === "string" && (
                    <div className="w-full max-w-2xl h-[60%] relative overflow-hidden mask-image-vertical bg-black/40 backdrop-blur-sm rounded-3xl p-8 border border-white/5 pointer-events-auto">
                       <div className="absolute inset-0 overflow-y-auto p-8 text-center font-bold text-xl md:text-2xl text-white/90 whitespace-pre-line leading-loose custom-scrollbar">
                          {lyrics}
                       </div>
                    </div>
                  )}
                </div>

                {/* Playback Controls Overlay`;

code = code.replace(overlayRegex, lyricsOverlay);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Lyrics engine injected");
