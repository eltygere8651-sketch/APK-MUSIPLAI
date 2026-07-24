export const maxDuration = 60;
import { Innertube, UniversalCache } from 'youtubei.js';

let yt: Innertube | null = null;
const searchCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export default async function handler(req: any, res: any) {
  // Add CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Desactivar caché de Vercel y Navegador (Solución definitiva para producción)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: "Missing query" });

  const normalizedQuery = query.toLowerCase().trim();
  
  // Check eco-friendly cache
  const cached = searchCache.get(normalizedQuery);
  if (false) {
    return res.json(cached.data);
  }

  try {
    if (!yt) {
      yt = await Innertube.create({ cache: new UniversalCache(false) }); 
    }
  } catch (err) {
    return res.status(503).json({ error: "Service unavailable" });
  }

  try {
    const isPlaylistSearch = /playlist|lista|mix|top|album|canciones/i.test(normalizedQuery);
    let resultsObj: any;
    let extraItems: any[] = [];
    
    console.log("query:", query);
    let musicSongs: any[] = [];
    if (isPlaylistSearch) {
       const [resAll, resPl] = await Promise.all([
           yt.search(query),
           yt.search(query, { type: 'playlist' })
       ]);
       resultsObj = resAll;
       if (resPl.playlists) extraItems = resPl.playlists;
       else if (resPl.results) extraItems = resPl.results;
    } else {
       const [resAll, resMusic] = await Promise.all([
           yt.search(query),
           yt.music.search(query, { type: 'song' }).catch(() => null)
       ]);
       resultsObj = resAll;
       if (resMusic && resMusic.contents) {
           const shelf = resMusic.contents.find((c: any) => c.type === 'MusicShelf');
           if (shelf && shelf.contents) {
               musicSongs = shelf.contents;
           }
       }
    }

    console.log("musicSongs length:", musicSongs.length);
    const combinedItems = [...musicSongs, ...(resultsObj.results || []), ...extraItems];
    const parsedResults: any[] = [];
    const seenIds = new Set<string>();
    
    if (combinedItems.length > 0) {
      for (const item of combinedItems) {
        if (item.type === 'MusicResponsiveListItem') {
           try {
             const title = item.title;
             const author = item.artists?.map((a: any) => a.name).join(', ') || "Unknown Artist";
             const duration = item.duration?.text || "";
             const id = item.id;
             const thumbnail = item.thumbnails?.[0]?.url || "";
             
             if (id && title && !seenIds.has(id)) {
               seenIds.add(id);
               parsedResults.push({
                 id,
                 title: title,
                 artist: author,
                 duration,
                 url: `https://www.youtube.com/watch?v=${id}`,
                 thumbnail,
                 isPlaylist: false
               });
             }
           } catch(e) {}
        } else if (item.type === 'Video') {
           try {
             const title = item.title?.text || item.title?.toString() || "Untitled";
             const author = item.author?.name || item.author?.toString() || "Unknown Artist";
             const duration = item.duration?.text || item.duration?.toString() || "";
             const id = item.id || item.video_id;
             const thumbnail = item.thumbnails?.[0]?.url || "";
    
             if (id && title && !seenIds.has(id)) {
               seenIds.add(id);
               parsedResults.push({
                 id,
                 title: title,
                 artist: author,
                 duration,
                 url: `https://www.youtube.com/watch?v=${id}`,
                 thumbnail,
                 isPlaylist: false
               });
             }
           } catch(e) {}
        } else if (item.type === 'LockupView' && item.content_type === 'PLAYLIST') {
           try {
             const title = item.metadata?.title?.text || "Playlist";
             const author = item.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text?.text || "YouTube";
             const id = item.content_id;
             const thumbnail = item.content_image?.primary_thumbnail?.image?.[0]?.url || "";
             
             if (id && title && !seenIds.has(id)) {
               seenIds.add(id);
               parsedResults.push({
                 id,
                 title: title,
                 artist: author,
                 duration: "PLAYLIST",
                 url: `https://www.youtube.com/playlist?list=${id}`,
                 thumbnail,
                 isPlaylist: true
               });
             }
           } catch(e) {}
        } else if (item.type === 'Playlist' || item.type === 'CompactPlaylist') {
            try {
             const title = item.title?.text || "Playlist";
             const author = item.author?.name || item.author?.toString() || "YouTube";
             const id = item.id || item.playlist_id;
             const thumbnail = item.thumbnails?.[0]?.url || "";
             
             if (id && title && !seenIds.has(id)) {
               seenIds.add(id);
               parsedResults.push({
                 id,
                 title: title,
                 artist: author,
                 duration: "PLAYLIST",
                 url: `https://www.youtube.com/playlist?list=${id}`,
                 thumbnail,
                 isPlaylist: true
               });
             }
           } catch(e) {}
        }
      }
    }
    
    if (parsedResults.length > 0) {
      searchCache.set(normalizedQuery, { data: parsedResults, timestamp: Date.now() });
    }
    
    res.json(parsedResults);
  } catch (error) {
    console.error("YouTube search error:", error);
    res.status(500).json({ error: "Internal YouTube search error" });
  }
}
