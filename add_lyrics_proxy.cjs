const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const lyricsProxyRoute = `
app.get("/api/lyrics/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }
    const response = await fetch(\`https://lrclib.net/api/search?q=\${encodeURIComponent(query)}\`, {
      headers: {
        'User-Agent': 'KaraokeApp/1.0.0 (https://github.com/lrclib/lrclib)' // They require a User-Agent
      }
    });
    if (!response.ok) {
      throw new Error("Lrclib API error");
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Lyrics proxy error:", error);
    res.status(500).json({ error: "Failed to fetch lyrics" });
  }
});
`;

if (!code.includes('/api/lyrics/search')) {
  code = code.replace('app.get("/api/youtube/search"', lyricsProxyRoute + '\napp.get("/api/youtube/search"');
  fs.writeFileSync('server.ts', code);
  console.log("Lyrics proxy route added to server.ts");
} else {
  console.log("Lyrics proxy already exists");
}
