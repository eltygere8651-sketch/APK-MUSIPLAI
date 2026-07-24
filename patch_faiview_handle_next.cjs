const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf-8');

const oldHandleNext = `  const handleNextTrack = useCallback(async () => {
    let next: MusicTrack | null = null;

    if (genreExploration) {
      if (genreBuffer.length > 0) {
        next = genreBuffer[0];
        setGenreBuffer(prev => prev.slice(1));
      } else {
        // Fetch new buffer from YouTube Search for the genre to ensure real variety
        try {
          const suffixes = ["mix", "hits", "2024", "2023", "top", "best", "playlist", "songs", "music", "official audio", "live", "remix", "bangers", "essentials", "classics", "vibes"];
          const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
          const resp = await fetch(\`/api/youtube/search?q=\${encodeURIComponent(selectedGenre + " " + randomSuffix)}\`);
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.length > 0) {
              const validData = data.filter((d: any) => !d.isPlaylist && d.id);
              if (validData.length > 0) {
                const tracks = validData.map((d: any) => ({
                  id: d.id,
                  title: d.title,
                  artist: d.artist || selectedGenre,
                  url: d.url || \`https://www.youtube.com/watch?v=\${d.id}\`,
                  thumbnail_url: d.thumbnail || d.thumbnail_url || \`https://i.ytimg.com/vi/\${d.id}/hqdefault.jpg\`,
                  duration: d.duration || "N/A"
                }));
                
                const shuffled = tracks.sort(() => Math.random() - 0.5);
                next = shuffled[0];
                setGenreBuffer(shuffled.slice(1));
              }
            }
          }
        } catch(e) {
          console.error("FAI Genre search failed", e);
        }
      }
    }

    if (!next) {
      next = selectNextDJTrack(topTracks, favorites, allTracks, { 
        discoveryLevel,
        genreMode: false // Managed externally now if active
      });
    }`;

const newHandleNext = `  const handleNextTrack = useCallback(async () => {
    let next: MusicTrack | null = null;

    if (genreExploration) {
      if (genreBuffer.length > 0) {
        next = genreBuffer[0];
        setGenreBuffer(prev => prev.slice(1));
      } else {
        // Fetch new buffer from YouTube Search for the genre to ensure real variety
        try {
          const resp = await fetch(\`/api/youtube/search?q=\${encodeURIComponent(selectedGenre + " playlist")}\`);
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.length > 0) {
              const playlists = data.filter((d: any) => d.isPlaylist);
              let foundTracks: MusicTrack[] = [];
              
              if (playlists.length > 0) {
                // Try up to 2 playlists to find tracks
                for (let i = 0; i < Math.min(2, playlists.length); i++) {
                  const pl = playlists[i];
                  const plResp = await fetch(\`/api/youtube/playlist?id=\${pl.id}\`);
                  if (plResp.ok) {
                    const plData = await plResp.json();
                    if (plData.tracks && plData.tracks.length > 0) {
                      foundTracks = plData.tracks.map((d: any) => ({
                        id: d.id,
                        title: d.title,
                        artist: d.artist || selectedGenre,
                        url: d.url || \`https://www.youtube.com/watch?v=\${d.id}\`,
                        thumbnail_url: d.thumbnail || d.thumbnail_url || \`https://i.ytimg.com/vi/\${d.id}/hqdefault.jpg\`,
                        duration: d.duration || "N/A"
                      })).filter((t: any) => {
                        // filter out long mixes (e.g. over 15 mins)
                        if (t.duration === "N/A") return true;
                        const parts = String(t.duration).split(":");
                        if (parts.length > 2) return false; // has hours
                        if (parts.length === 2 && parseInt(parts[0]) > 15) return false; // > 15 mins
                        return true;
                      });
                      if (foundTracks.length > 0) break;
                    }
                  }
                }
              }

              if (foundTracks.length === 0) {
                // fallback to videos
                const validData = data.filter((d: any) => !d.isPlaylist && d.id);
                if (validData.length > 0) {
                   foundTracks = validData.map((d: any) => ({
                    id: d.id,
                    title: d.title,
                    artist: d.artist || selectedGenre,
                    url: d.url || \`https://www.youtube.com/watch?v=\${d.id}\`,
                    thumbnail_url: d.thumbnail || d.thumbnail_url || \`https://i.ytimg.com/vi/\${d.id}/hqdefault.jpg\`,
                    duration: d.duration || "N/A"
                  }));
                }
              }

              if (foundTracks.length > 0) {
                const shuffled = foundTracks.sort(() => Math.random() - 0.5);
                next = shuffled[0];
                setGenreBuffer(shuffled.slice(1));
              }
            }
          }
        } catch(e) {
          console.error("FAI Genre search failed", e);
        }
      }
    }

    if (!next) {
      next = selectNextDJTrack(topTracks, favorites, allTracks, { 
        discoveryLevel,
        genreMode: false // Managed externally now if active
      });
    }`;

code = code.replace(oldHandleNext, newHandleNext);
fs.writeFileSync('src/components/FAIView.tsx', code);
