// Helper function to extract tracks from SoundCloud HTML
function parseSoundCloudTracks(html: string): Array<{ id: string; title: string; artist: string; url: string }> {
  try {
    const ldJsonRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = ldJsonRegex.exec(html)) !== null) {
      try {
        const json = JSON.parse(match[1].trim());
        const processPlaylist = (obj: any) => {
          if (obj && (obj["@type"] === "MusicPlaylist" || obj["@type"] === "ItemList") && Array.isArray(obj.track || obj.itemListElement)) {
            const list = obj.track || obj.itemListElement;
            const items: any[] = [];
            for (let i = 0; i < list.length; i++) {
              const item = list[i];
              const t = item.item || item;
              if (t && (t["@type"] === "MusicRecording" || t["@type"] === "MusicVideoObject" || t.name)) {
                items.push({
                  id: `sc_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
                  title: t.name || `Pista ${i + 1}`,
                  artist: t.byArtist?.name || t.author?.name || t.creator?.name || "SoundCloud Artist",
                  url: t.url || "",
                });
              }
            }
            if (items.length > 0) return items;
          }
          return null;
        };

        if (Array.isArray(json)) {
          for (const obj of json) {
            const res = processPlaylist(obj);
            if (res) return res;
          }
        } else {
          const res = processPlaylist(json);
          if (res) return res;
        }
      } catch (e) {
        console.warn("JSON-LD parse error in scraper:", e);
      }
    }
  } catch (err) {
    console.error("LD-JSON main processing error:", err);
  }

  const tracks: Array<{ id: string; title: string; artist: string; url: string }> = [];
  try {
    const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
    const articles = html.match(articleRegex);
    if (articles && articles.length > 0) {
      articles.forEach((art, index) => {
        const hrefRegex = /href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        let lm;
        const links: Array<{ href: string; text: string }> = [];
        while ((lm = hrefRegex.exec(art)) !== null) {
          links.push({
            href: lm[1],
            text: lm[2].replace(/<[^>]*>/g, "").trim(),
          });
        }
        
        if (links.length >= 2) {
          const artist = links[0].text || "SoundCloud Artist";
          const title = links[1].text || "SoundCloud Track";
          const url = links[1].href.startsWith("http") ? links[1].href : `https://soundcloud.com${links[1].href}`;
          tracks.push({
            id: `sc_reg_${Date.now()}_${index}`,
            title,
            artist,
            url,
          });
        } else if (links.length === 1) {
          const title = links[0].text || "SoundCloud Track";
          const url = links[0].href.startsWith("http") ? links[0].href : `https://soundcloud.com${links[0].href}`;
          tracks.push({
            id: `sc_reg_${Date.now()}_${index}`,
            title,
            artist: "SoundCloud Artist",
            url,
          });
        }
      });
    }
  } catch (err) {
    console.error("HTML article scraper fallback error:", err);
  }

  return tracks.filter(t => t.title && t.title !== "SoundCloud" && t.title !== "SoundCloud Go");
}

export default async function handler(req: any, res: any) {
  // Add CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.query.url as string;
  if (!url) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  try {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const ytRes = await fetch(
        `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
      );
      if (!ytRes.ok) {
         return res.status(ytRes.status).send(await ytRes.text());
      }
      const data = await ytRes.json() as any;
      return res.json({
        title: data.title,
        author_name: data.author_name,
        thumbnail_url: data.thumbnail_url,
        provider_name: "YouTube",
        tracks: []
      });
    }

    const scRes = await fetch(
      `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`
    );
    if (!scRes.ok) {
       return res.status(scRes.status).send(await scRes.text());
    }
    const data = await scRes.json() as any;

    if (url.includes("/sets/")) {
      try {
        const htmlRes = await fetch(url, {
          headers: {
             "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
          }
        });
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          const tracks = parseSoundCloudTracks(html);
          if (tracks && tracks.length > 0) {
            data.tracks = tracks;
          }
        }
      } catch (scrapeErr) {
        console.error("Failed to scrape set tracks in oEmbed proxy:", scrapeErr);
      }
    }

    return res.json(data);
  } catch (error) {
    console.error("oEmbed error:", error);
    res.status(500).json({ error: "Failed to fetch metadata" });
  }
}
