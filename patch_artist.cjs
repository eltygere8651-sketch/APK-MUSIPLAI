const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const routeCode = `
app.get("/api/youtube/artist", async (req, res) => {
  const browseId = req.query.id as string;
  if (!browseId) return res.status(400).json({ error: "Missing browseId" });

  res.setHeader("Cache-Control", "public, max-age=86400");
  const cacheKey = \`artist_\${browseId}\`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  if (!yt) {
    try {
      yt = await Innertube.create({ generate_session_locally: true });
    } catch (e) {
      return res.status(503).json({ error: "YouTube service unavailable" });
    }
  }

  try {
    const artist = await yt.music.getArtist(browseId);
    const sections = artist.sections?.map(s => {
      return {
        title: s.header?.title?.text || s.title?.text || "",
        items: s.contents?.map(c => {
          const typeLower = c.type.toLowerCase();
          const isPlaylistType = c.endpoint?.payload?.playlistId || c.endpoint?.payload?.browseId?.startsWith('VL');
          
          let thumbnail = "";
          if (c.thumbnails && c.thumbnails.length > 0) {
             thumbnail = c.thumbnails[c.thumbnails.length - 1].url;
          }

          let videoCountStr = "";
          let author = "";
          if (c.subtitle && c.subtitle.runs) {
             author = c.subtitle.runs.map((r: any) => r.text).join("");
          }

          return {
            id: c.id || c.endpoint?.payload?.browseId || c.endpoint?.payload?.playlistId,
            title: c.title?.text || c.name?.text || "",
            type: c.type,
            isPlaylist: !!isPlaylistType,
            thumbnail: thumbnail,
            artist: author,
            duration: "",
            subType: isPlaylistType ? "playlist" : "cancion",
            url: \`https://www.youtube.com/watch?v=\${c.id}\`
          }
        }).slice(0, 15) // take up to 15 items per section
      }
    }).filter(s => s.title && s.items && s.items.length > 0);
    
    const result = {
      header: artist.header?.title?.text,
      sections: sections
    };

    searchCache.set(cacheKey, { timestamp: Date.now(), data: result });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch artist details" });
  }
});
`;

code = code.replace('app.get("/api/youtube/video-info"', routeCode + '\napp.get("/api/youtube/video-info"');
fs.writeFileSync('server.ts', code);
