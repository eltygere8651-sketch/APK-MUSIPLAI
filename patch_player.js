const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

// 1. Add states
const stateInjection = `
  const [isDucking, setIsDucking] = useState(false);
  const [aiDjEnabled, setAiDjEnabled] = useState(() => {
    return localStorage.getItem("fai_ai_dj_enabled") !== "false";
  });
  const [aiVoice, setAiVoice] = useState(() => {
    return localStorage.getItem("fai_ai_voice") || "Kore";
  });
  const [showAiDjModal, setShowAiDjModal] = useState(false);
  
  // AI DJ Logic
  const playAiJoke = async () => {
    if (isDucking) return; // already playing
    try {
      const res = await fetch("/api/dj/joke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceName: aiVoice })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          setIsDucking(true);
          const audio = new Audio("data:audio/wav;base64," + data.audio);
          audio.volume = 1;
          audio.onended = () => setIsDucking(false);
          audio.play().catch((e) => {
            console.error("Audio play failed:", e);
            setIsDucking(false);
          });
        }
      }
    } catch (e) {
      console.error("AI DJ Error:", e);
      setIsDucking(false);
    }
  };

  const testAiVoice = async (voiceName: string) => {
    try {
      const res = await fetch("/api/dj/test-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceName })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          setIsDucking(true);
          const audio = new Audio("data:audio/wav;base64," + data.audio);
          audio.volume = 1;
          audio.onended = () => setIsDucking(false);
          audio.play().catch(() => setIsDucking(false));
        }
      }
    } catch (e) {
      console.error("Test Voice Error", e);
    }
  };

  useEffect(() => {
    localStorage.setItem("fai_ai_dj_enabled", String(aiDjEnabled));
  }, [aiDjEnabled]);

  useEffect(() => {
    localStorage.setItem("fai_ai_voice", aiVoice);
  }, [aiVoice]);

  // Trigger DJ joke every 7-12 minutes randomly if playing
  useEffect(() => {
    if (!aiDjEnabled || !isPlaying) return;
    
    let timeout: any;
    const scheduleNext = () => {
      const nextTime = Math.floor(Math.random() * (12 - 7 + 1) + 7) * 60 * 1000;
      timeout = setTimeout(() => {
        playAiJoke().then(scheduleNext);
      }, nextTime);
    };
    
    scheduleNext();
    return () => clearTimeout(timeout);
  }, [aiDjEnabled, isPlaying, aiVoice, isDucking]);
`;

code = code.replace('const [volume, setVolume] = useState(() => {', stateInjection + '\n  const [volume, setVolume] = useState(() => {');

// 2. Ducking logic
code = code.replace('volume={volume / 100}', 'volume={isDucking ? (volume / 100) * 0.15 : (volume / 100)}');

// 3. UI for AI DJ Modal
const modalUi = `
      {/* AI DJ Settings Modal */}
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
`;

code = code.replace('{/* Global Layout and Modals */}', '{/* Global Layout and Modals */}\n' + modalUi);

// 4. Add the settings button in the UI
// Look for user profile button or settings button
const aiButton = `
        <button
          onClick={() => setShowAiDjModal(true)}
          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#17d1a5] transition-all shrink-0 group relative z-[50]"
          title="Locutora AI"
        >
          <Bot className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
          {aiDjEnabled && <div className="absolute top-2 right-2 w-2 h-2 bg-[#17d1a5] rounded-full animate-pulse shadow-[0_0_8px_#17d1a5]" />}
        </button>
`;
code = code.replace('<button\n          onClick={() => setShowNotifications(true)}', aiButton + '\n        <button\n          onClick={() => setShowNotifications(true)}');

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log("Patched GymMusicPlayer.tsx");
