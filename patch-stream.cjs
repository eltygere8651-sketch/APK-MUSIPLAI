const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// We will modify the api/audio-stream handler.
// Since it's large, let's just replace the whole app.get("/api/audio-stream", ...) block.

const newHandler = `
app.get("/api/audio-stream", async (req, res) => {
  const trackId = (req.query.id as string) || "";
  let youtubeId = (req.query.youtubeId as string) || "";
  const query = (req.query.q as string) || "";
  
  try {
    if (youtubeId && (youtubeId.includes("http") || youtubeId.includes("youtube.com") || youtubeId.includes("youtu.be"))) {
      const match = youtubeId.match(/(?:v=|\\/vi\\/|youtu\\.be\\/|\\/v\\/|\\/embed\\/|\\/shorts\\/|\\/watch\\?v=|[?&]v=)([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        youtubeId = match[1];
      }
    }
    
    if (!youtubeId && query) {
      try {
        const searchUrl = \`https://www.youtube.com/results?search_query=\${encodeURIComponent(query)}\`;
        const ytRes = await fetch(searchUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        if (ytRes.ok) {
          const html = await ytRes.text();
          const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
          if (match && match[1]) youtubeId = match[1];
        }
      } catch (e) {
        console.warn("Fast YT search failed:", e);
      }
      
      if (!youtubeId) {
        const args = ['--quiet', '--no-warnings', '--dump-json', \`scsearch1:\${query}\`];
        const searchProcess = spawn('./yt-dlp', args);
        let searchData = '';
        for await (const chunk of searchProcess.stdout) searchData += chunk;
        if (searchData) {
          try {
            const info = JSON.parse(searchData.trim().split('\\n')[0]);
            youtubeId = info.id;
          } catch (e) { console.error("Search parse error", e); }
        }
      }
    }
    
    if (!youtubeId) youtubeId = "dQw4w9WgXcQ";

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "audio/webm");
    res.setHeader("Transfer-Encoding", "chunked");

    console.log("Streaming direct yt-dlp to client for:", youtubeId);

    const args = [
      '--no-warnings',
      '--no-playlist',
      '-f', 'ba/b',
      '-o', '-',
      \`https://www.youtube.com/watch?v=\${youtubeId}\`
    ];

    const ytProcess = spawn('./yt-dlp', args);
    ytProcess.stdout.pipe(res);
    
    ytProcess.stderr.on('data', (d) => {
       const msg = d.toString();
       if (msg.includes('ERROR')) console.error('[yt-dlp error]', msg.trim());
    });
    
    req.on('close', () => {
      ytProcess.kill('SIGKILL');
    });
    
  } catch (error) {
    console.error("Audio stream error:", error);
    if (!res.headersSent) res.status(500).send("Stream failed");
  }
});
`;

code = code.replace(/app\.get\("\/api\/audio-stream", async \(req, res\) => \{[\s\S]*?\n\}\);\n/g, newHandler);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts stream handler");
