const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const modalUi = `      {/* AI DJ Settings Modal */}
      <AnimatePresence>
        {showAiDjModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAiDjModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111113] border border-white/10 rounded-3xl p-6 w-full max-w-sm flex flex-col gap-5 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowAiDjModal(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <Bot className="w-6 h-6 text-[#17d1a5]" />
                <h2 className="text-lg font-black text-white uppercase tracking-wider">Locutora AI</h2>
              </div>
              
              <p className="text-sm text-white/60">
                Tu locutora personal de FAI-Radio. Ocasionalmente contará un chiste y animará tu sesión de música, bajando el volumen inteligentemente.
              </p>

              <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                <span className="text-sm font-bold text-white">Activar Locutora AI</span>
                <button
                  onClick={() => setAiDjEnabled(!aiDjEnabled)}
                  className={\`w-12 h-6 rounded-full transition-colors flex items-center px-1 \${aiDjEnabled ? 'bg-[#17d1a5]' : 'bg-white/20'}\`}
                >
                  <div className={\`w-4 h-4 rounded-full bg-white transition-transform \${aiDjEnabled ? 'translate-x-6' : 'translate-x-0'}\`} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
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
                  className="mt-2 w-full py-3 bg-[#1e3280] hover:bg-[#2d49b3] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Probar Voz Actual
                </button>
                <button 
                  onClick={playAiJoke}
                  className="w-full py-3 bg-[#17d1a5] hover:bg-[#12b38c] text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  Contar Chiste Ahora
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
`;

code = code.replace(/    <\/div>\n  \);\n\}\n?$/, modalUi);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
