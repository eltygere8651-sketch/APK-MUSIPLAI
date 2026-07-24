const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldVol = `    const [volume, setVolume] = useState(() => {`;

const newVol = `  const [isDucking, setIsDucking] = useState(false);
  const [isDjLoading, setIsDjLoading] = useState(false);

  const playAiDj = async (context: string) => {
    if (isDucking || isDjLoading) return;
    setIsDjLoading(true);
    const audio = new Audio();
    try {
      const res = await fetch("/api/dj/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          setIsDucking(true);
          audio.src = "data:audio/wav;base64," + data.audio;
          audio.volume = 1;
          audio.onended = () => setIsDucking(false);
          audio.play().catch((e) => {
            console.error("AI DJ Play Error", e);
            setIsDucking(false);
          });
        }
      } else {
         const errorData = await res.json();
         console.warn("AI DJ Error:", errorData.error);
      }
    } catch (e) {
      console.error("AI DJ Fetch Error", e);
      setIsDucking(false);
    } finally {
      setIsDjLoading(false);
    }
  };

  const [volume, setVolume] = useState(() => {`;

code = code.replace(oldVol, newVol);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
