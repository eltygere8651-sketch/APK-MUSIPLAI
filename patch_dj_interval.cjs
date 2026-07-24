const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldInterval = `  // Trigger DJ joke every 5-10 minutes randomly if playing
  useEffect(() => {
    if (!aiDjEnabled || !isPlaying) return;

    let timeout;
    const scheduleNext = () => {
      const nextTime = Math.floor(Math.random() * (10 - 5 + 1) + 5) * 60 * 1000;
      timeout = setTimeout(() => {
        playAiJoke().then(scheduleNext);
      }, nextTime);
    };`;

const newInterval = `  // Trigger DJ occasionally (15-25 min) to avoid spam
  useEffect(() => {
    if (!aiDjEnabled || !isPlaying) return;

    let timeout;
    const scheduleNext = () => {
      const nextTime = Math.floor(Math.random() * (25 - 15 + 1) + 15) * 60 * 1000;
      timeout = setTimeout(() => {
        playAiJoke().then(scheduleNext);
      }, nextTime);
    };`;

code = code.replace(oldInterval, newInterval);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
