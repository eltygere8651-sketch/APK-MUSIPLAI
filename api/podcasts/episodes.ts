import Parser from "rss-parser";

const rssParser = new Parser();
const podcastEpisodesCache = new Map<string, { data: any, timestamp: number }>();
const PODCAST_CACHE_TTL = 1000 * 60 * 15;

export default async function handler(req: any, res: any) {
  // Add CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Add Cache-Control for Vercel Edge caching to keep costs zero
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const feedUrl = req.query.feedUrl as string;
  if (!feedUrl) return res.status(400).json({ error: "feedUrl is required" });

  const cached = podcastEpisodesCache.get(feedUrl);
  if (cached && (Date.now() - cached.timestamp < PODCAST_CACHE_TTL)) {
    return res.json(cached.data);
  }

  try {
    const feed = await rssParser.parseURL(feedUrl);
    const episodes = (feed.items || []).slice(0, 100).map((item) => ({
      id: item.guid || item.id || item.link,
      title: item.title,
      description: item.contentSnippet || item.itunes?.subtitle || "",
      audioUrl: item.enclosure?.url,
      duration: item.itunes?.duration,
      pubDate: item.pubDate,
      imageUrl: item.itunes?.image || feed.image?.url
    })).filter((ep: any) => ep.audioUrl); // Only include episodes with playable audio
    
    podcastEpisodesCache.set(feedUrl, { data: episodes, timestamp: Date.now() });
    res.json(episodes);
  } catch (error) {
    console.error("Error parsing podcast feed:", error);
    res.status(500).json({ error: "No se pudieron obtener los episodios." });
  }
}
