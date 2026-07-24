const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldCode = `    return Array.from(map.values()).sort((a: any, b: any) => {
      const getTimestamp = (pl: any) => {
        if (!pl.createdAt) return 0;
        if (pl.createdAt.toMillis) return pl.createdAt.toMillis();
        return new Date(pl.createdAt).getTime() || 0;
      };
      return getTimestamp(b) - getTimestamp(a);
    });`;

const newCode = `    return Array.from(map.values()).sort((a: any, b: any) => {
      const getTimestamp = (pl: any) => {
        if (!pl.createdAt) return 0;
        return pl.createdAt.toMillis?.() || (pl.createdAt.seconds ? pl.createdAt.seconds * 1000 : 0) || new Date(pl.createdAt).getTime() || 0;
      };
      return getTimestamp(b) - getTimestamp(a);
    });`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
