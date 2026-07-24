const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldModalContent = `              <div className="flex flex-col gap-3">
                <span className="text-sm font-bold text-white">Selecciona la Voz (Femenina)</span>
                <div className="grid grid-cols-2 gap-2">
                  {["Kore", "Puck", "Charon", "Zephyr"].map(v => (
                    <button
                      key={v}
                      onClick={() => setAiVoice(v)}
                      className={\`py-2 px-3 rounded-lg text-sm font-bold transition-colors border \${aiVoice === v ? 'bg-[#17d1a5]/20 border-[#17d1a5] text-[#17d1a5]' : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10'}\`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => testAiVoice(aiVoice)}
                  disabled={isDjLoading}
                  className={\`mt-2 w-full py-3 \${isDjLoading ? 'bg-white/10 text-white/40' : 'bg-[#1e3280] hover:bg-[#2d49b3] text-white'} font-bold rounded-xl transition-colors flex items-center justify-center gap-2\`}
                >
                  {isDjLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {isDjLoading ? "Generando..." : "Probar Voz Actual"}
                </button>
                <button 
                  onClick={playAiJoke}
                  disabled={isDjLoading}
                  className={\`w-full py-3 \${isDjLoading ? 'bg-white/10 text-white/40' : 'bg-[#17d1a5] hover:bg-[#12b38c] text-black'} font-bold rounded-xl transition-colors flex items-center justify-center gap-2\`}
                >
                  {isDjLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  {isDjLoading ? "Generando..." : "Contar Chiste Ahora"}
                </button>
              </div>`;

const newModalContent = `              <div className="flex flex-col gap-3">
                <button 
                  onClick={playAiJoke}
                  disabled={isDjLoading}
                  className={\`w-full py-3 \${isDjLoading ? 'bg-white/10 text-white/40' : 'bg-[#17d1a5] hover:bg-[#12b38c] text-black'} font-bold rounded-xl transition-colors flex items-center justify-center gap-2\`}
                >
                  {isDjLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  {isDjLoading ? "Generando..." : "Contar Chiste Ahora"}
                </button>
              </div>`;

code = code.replace(oldModalContent, newModalContent);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
