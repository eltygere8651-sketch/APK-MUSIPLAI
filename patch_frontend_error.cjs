const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldJoke = `      if (res.ok) {
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
      }`;

const newJoke = `      const data = await res.json();
      if (res.ok) {
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
      } else {
        alert("AI DJ Error: " + (data.error || "Límite de peticiones alcanzado o error del servidor."));
      }`;

code = code.replace(oldJoke, newJoke);

const oldTest = `      if (res.ok) {
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
      }`;

const newTest = `      const data = await res.json();
      if (res.ok) {
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
      } else {
        alert("AI DJ Error: " + (data.error || "Límite de peticiones alcanzado o error del servidor."));
      }`;

code = code.replace(oldTest, newTest);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
