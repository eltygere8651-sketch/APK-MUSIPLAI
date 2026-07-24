const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const helper = `
const fetchWithCache = async (cacheKey, ttl, fetcher, forceRefresh = false) => {
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < ttl) {
           return parsed.data;
        }
      }
    } catch (e) {}
  }
  const data = await fetcher();
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
  } catch(e) {}
  return data;
};
`;

code = code.replace('import { DEFAULT_MUSIC_COVER } from "../lib/constants";', 'import { DEFAULT_MUSIC_COVER } from "../lib/constants";\n' + helper);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
