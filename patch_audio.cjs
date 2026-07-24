const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldTestVoice = `  const testAiVoice = async (voiceName: string) => {
    if (isDucking || isDjLoading) return;
    setIsDjLoading(true);
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
    } finally {
      setIsDjLoading(false);
    }
  };`;

const newTestVoice = `  const testAiVoice = async (voiceName: string) => {
    if (isDucking || isDjLoading) return;
    setIsDjLoading(true);
    const audio = new Audio(); // Create immediately on click
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
          audio.src = "data:audio/wav;base64," + data.audio;
          audio.volume = 1;
          audio.onended = () => setIsDucking(false);
          audio.play().catch((e) => {
            console.error("Test Voice Play Error", e);
            setIsDucking(false);
          });
        }
      }
    } catch (e) {
      console.error("Test Voice Error", e);
      setIsDucking(false);
    } finally {
      setIsDjLoading(false);
    }
  };`;

code = code.replace(oldTestVoice, newTestVoice);

const oldPlayJoke = `  const playAiJoke = async () => {
    if (isDucking || isDjLoading) return; // already playing
    setIsDjLoading(true);
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
    } finally {
      setIsDjLoading(false);
    }
  };`;

const newPlayJoke = `  const playAiJoke = async () => {
    if (isDucking || isDjLoading) return; // already playing
    setIsDjLoading(true);
    const audio = new Audio(); // Create immediately on click
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
          audio.src = "data:audio/wav;base64," + data.audio;
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
    } finally {
      setIsDjLoading(false);
    }
  };`;

code = code.replace(oldPlayJoke, newPlayJoke);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
