const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

code = code.replace(
  '? Number(localStorage.getItem("gym_music_saved_position"))',
  '? Number(localStorage.getItem("gym_music_saved_position")) / 1000'
);

code = code.replace(
  'const currentPosSec = state.playedSeconds;',
  'const currentPosMs = state.playedSeconds * 1000;'
);

code = code.replace(
  'setPosition(currentPosSec);',
  'setPosition(currentPosMs);'
);

code = code.replace(
  'currentPosSec > 0 &&',
  'currentPosMs > 0 &&'
);

code = code.replace(
  'Math.abs(currentPosSec - (positionRef.current || 0)) > 5',
  'Math.abs(currentPosMs - (positionRef.current || 0)) > 5000'
);

code = code.replace(
  'positionRef.current = currentPosSec;',
  'positionRef.current = currentPosMs;'
);

code = code.replace(
  'currentPosSec.toString(),',
  'currentPosMs.toString(),'
);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
