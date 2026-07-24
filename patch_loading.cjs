const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldState = `  const [showAiDjModal, setShowAiDjModal] = useState(false);`;
const newState = `  const [showAiDjModal, setShowAiDjModal] = useState(false);
  const [isDjLoading, setIsDjLoading] = useState(false);`;
code = code.replace(oldState, newState);

const oldPlayJoke = `  const playAiJoke = async () => {
    if (isDucking) return; // already playing
    try {
      const res = await fetch("/api/dj/joke", {`;
const newPlayJoke = `  const playAiJoke = async () => {
    if (isDucking || isDjLoading) return; // already playing
    setIsDjLoading(true);
    try {
      const res = await fetch("/api/dj/joke", {`;
code = code.replace(oldPlayJoke, newPlayJoke);

const oldPlayJokeCatch = `    } catch (e) {
      console.error("AI DJ Error:", e);
      setIsDucking(false);
    }
  };`;
const newPlayJokeCatch = `    } catch (e) {
      console.error("AI DJ Error:", e);
      setIsDucking(false);
    } finally {
      setIsDjLoading(false);
    }
  };`;
code = code.replace(oldPlayJokeCatch, newPlayJokeCatch);

const oldTestVoice = `  const testAiVoice = async (voiceName) => {
    try {
      const res = await fetch("/api/dj/test-voice", {`;
const newTestVoice = `  const testAiVoice = async (voiceName: string) => {
    if (isDucking || isDjLoading) return;
    setIsDjLoading(true);
    try {
      const res = await fetch("/api/dj/test-voice", {`;
code = code.replace(oldTestVoice, newTestVoice);

const oldTestVoiceCatch = `    } catch (e) {
      console.error("Test Voice Error", e);
    }
  };`;
const newTestVoiceCatch = `    } catch (e) {
      console.error("Test Voice Error", e);
    } finally {
      setIsDjLoading(false);
    }
  };`;
code = code.replace(oldTestVoiceCatch, newTestVoiceCatch);

// Update Modal Buttons
const oldTestBtn = `<button 
                  onClick={() => testAiVoice(aiVoice)}
                  className="mt-2 w-full py-3 bg-[#1e3280] hover:bg-[#2d49b3] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Probar Voz Actual
                </button>`;
const newTestBtn = `<button 
                  onClick={() => testAiVoice(aiVoice)}
                  disabled={isDjLoading}
                  className={\`mt-2 w-full py-3 \${isDjLoading ? 'bg-white/10 text-white/40' : 'bg-[#1e3280] hover:bg-[#2d49b3] text-white'} font-bold rounded-xl transition-colors flex items-center justify-center gap-2\`}
                >
                  {isDjLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {isDjLoading ? "Generando..." : "Probar Voz Actual"}
                </button>`;
code = code.replace(oldTestBtn, newTestBtn);

const oldJokeBtn = `<button 
                  onClick={playAiJoke}
                  className="w-full py-3 bg-[#17d1a5] hover:bg-[#12b38c] text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  Contar Chiste Ahora
                </button>`;
const newJokeBtn = `<button 
                  onClick={playAiJoke}
                  disabled={isDjLoading}
                  className={\`w-full py-3 \${isDjLoading ? 'bg-white/10 text-white/40' : 'bg-[#17d1a5] hover:bg-[#12b38c] text-black'} font-bold rounded-xl transition-colors flex items-center justify-center gap-2\`}
                >
                  {isDjLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  {isDjLoading ? "Generando..." : "Contar Chiste Ahora"}
                </button>`;
code = code.replace(oldJokeBtn, newJokeBtn);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
