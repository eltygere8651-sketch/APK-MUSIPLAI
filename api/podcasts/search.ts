const podcastCache = new Map<string, { data: any, timestamp: number }>();
const PODCAST_CACHE_TTL = 1000 * 60 * 15; // 15 minutes

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

  const term = (req.query.term as string) || "fitness, self improvement, gym";
  
  const cacheKey = term.toLowerCase().trim();
  const cached = podcastCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < PODCAST_CACHE_TTL)) {
    return res.json(cached.data);
  }

  try {
    const searchTerm = term.toLowerCase().includes('español') ? term : `${term} español`;
    const query = new URLSearchParams({
      media: 'podcast',
      term: searchTerm,
      country: 'MX', // To ensure Spanish language podcasts are prioritized
      limit: '50'
    });
    const response = await fetch(`https://itunes.apple.com/search?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`iTunes API Error: ${response.status}`);
    }
    const data = await response.json();
    const podcasts = (data.results || []).map((p: any) => ({
      id: p.collectionId,
      name: p.collectionName,
      artist: p.artistName,
      imageUrl: p.artworkUrl600 || p.artworkUrl100,
      feedUrl: p.feedUrl,
      genres: p.genres || []
    }));

    podcastCache.set(cacheKey, { data: podcasts, timestamp: Date.now() });
    res.json(podcasts);
  } catch (error) {
    console.error("Podcast Fetch Error:", error);
    res.status(500).json({ error: "No se pudieron obtener los podcasts." });
  }
}
