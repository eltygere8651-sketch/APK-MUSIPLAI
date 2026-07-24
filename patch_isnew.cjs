const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldCode = `                                    if (pl.createdAt) {
                                      const ms = pl.createdAt.toMillis ? pl.createdAt.toMillis() : new Date(pl.createdAt).getTime();
                                      isNew = (Date.now() - ms) < 48 * 60 * 60 * 1000;
                                    }`;

const newCode = `                                    if (pl.createdAt) {
                                      const ms = pl.createdAt.toMillis?.() || (pl.createdAt.seconds ? pl.createdAt.seconds * 1000 : 0) || new Date(pl.createdAt).getTime() || 0;
                                      isNew = (Date.now() - ms) < 48 * 60 * 60 * 1000;
                                    }`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
