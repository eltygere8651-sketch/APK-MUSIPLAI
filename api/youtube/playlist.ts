export const maxDuration = 60;
import { Innertube, UniversalCache } from 'youtubei.js';

let yt: Innertube | null = null;
const playlistCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  // Desactivar caché de Vercel y Navegador (Solución definitiva para producción)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: "Missing playlist id" });

  const cached = playlistCache.get(id);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
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
    let playlist: any;
    let rawVideos: any[] = [];
    
    if (id.startsWith("MPRE")) {
      playlist = await yt.music.getAlbum(id);
      if (playlist.contents) {
        rawVideos = Array.isArray(playlist.contents) ? playlist.contents : [];
      }
    } else {
      try {
        console.log(`[API PL] Fetching via standard getPlaylist for: ${id}`);
        playlist = await yt.getPlaylist(id);
        
        // Extract any videos/items
        if (playlist.items && Array.isArray(playlist.items)) {
          rawVideos.push(...playlist.items);
        }
        if (playlist.videos) {
          if (Array.isArray(playlist.videos)) {
            rawVideos.push(...playlist.videos);
          } else {
            const innerContents = playlist.videos.contents || playlist.videos.entries || [];
            if (Array.isArray(innerContents)) {
              rawVideos.push(...innerContents);
            }
          }
        }
        if (playlist.contents && Array.isArray(playlist.contents)) {
          playlist.contents.forEach((item: any) => {
            if (item && !rawVideos.includes(item)) rawVideos.push(item);
          });
        }
      } catch (err: any) {
        console.log(`[API PL] Standard getPlaylist not available (or private) for ${id}. Checking other endpoints...`);
      }

      // Fallback 1: Try YouTube Music Playlist
      if (rawVideos.length === 0) {
        try {
          console.log(`[API PL] Trying music.getPlaylist fallback for: ${id}`);
          const musicPlaylist = await yt.music.getPlaylist(id);
          if (musicPlaylist) {
            playlist = musicPlaylist;
            if (musicPlaylist.items && Array.isArray(musicPlaylist.items)) {
              rawVideos.push(...musicPlaylist.items);
            }
            if (musicPlaylist.contents && Array.isArray(musicPlaylist.contents)) {
              musicPlaylist.contents.forEach((item: any) => {
                if (item && !rawVideos.includes(item)) rawVideos.push(item);
              });
            }
            if ((musicPlaylist as any).content) {
              const pitems = (musicPlaylist as any).content.items || (musicPlaylist as any).content.contents || [];
              if (Array.isArray(pitems)) {
                pitems.forEach((item: any) => {
                  if (item && !rawVideos.includes(item)) rawVideos.push(item);
                });
              }
            }
          }
        } catch (err: any) {
          console.log(`[API PL] music.getPlaylist not available for ${id}`);
        }
      }

      // Fallback 2: Try YouTube Music Album in case it was labeled as a playlist
      if (rawVideos.length === 0) {
        try {
          console.log(`[API PL] Trying music.getAlbum fallback for: ${id}`);
          const album = await yt.music.getAlbum(id);
          if (album && album.contents && Array.isArray(album.contents)) {
            playlist = album;
            rawVideos.push(...album.contents);
          }
        } catch (err: any) {
          console.log(`[API PL] music.getAlbum not available for ${id}`);
        }
      }

      // Fallback 3: Search fallback by title
      const titleFallback = req.query.title as string;
      if (rawVideos.length === 0 && titleFallback) {
         console.log("[API PL] All fetch approaches empty. Falling back to search for:", titleFallback);
         const searchRes = await yt.music.search(titleFallback, { type: 'song' });
         if (searchRes && searchRes.contents && searchRes.contents.length > 0) {
           const firstSection = searchRes.contents[0];
           if (firstSection && firstSection.contents) {
             rawVideos = firstSection.contents;
           } else if ((searchRes as any).results) {
             rawVideos = (searchRes as any).results;
           }
         }
      }
    }
    
    console.log(`[API PL] rawVideos length: ${rawVideos.length}`);

    const tracks = rawVideos.map((v: any) => {
      try {
        const title = v.title?.text || v.title?.toString() || v.name || "Untitled Track";
        
        let artist = "YouTube Music";
        if (Array.isArray(v.artists) && v.artists.length > 0) {
          artist = v.artists.map((a: any) => a.name).join(", ");
        } else if (Array.isArray(v.authors) && v.authors.length > 0) {
          artist = v.authors.map((a: any) => a.name).join(", ");
        } else if (v.author?.name || typeof v.author === 'string') {
          artist = v.author?.name || v.author?.toString();
        } else if (playlist?.author?.name) {
          artist = playlist.author.name;
        }

        const duration = v.duration?.text || v.duration?.toString() || v.length?.text || v.length_text?.text || "N/A";
        const id = v.id || v.video_id || v.videoId || v.content_id || (v.endpoint?.payload?.videoId) || "";
        
        let thumbnail = "";
        if (v.thumbnails && Array.isArray(v.thumbnails) && v.thumbnails.length > 0) {
          thumbnail = v.thumbnails[0].url || "";
        } else if (v.thumbnail && v.thumbnail.thumbnails && Array.isArray(v.thumbnail.thumbnails) && v.thumbnail.thumbnails.length > 0) {
          thumbnail = v.thumbnail.thumbnails[0].url || "";
        } else if (v.thumbnail_url) {
          thumbnail = v.thumbnail_url;
        }
        
        if (id && title) {
          return {
            id,
            title,
            artist,
            duration,
            url: `https://www.youtube.com/watch?v=${id}`,
            thumbnail: thumbnail || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
          };
        }
      } catch (err) {
        return null;
      }
      return null;
    }).filter(Boolean);
    
    if (tracks.length > 0) {
      playlistCache.set(id, { data: tracks, timestamp: Date.now() });
    }
    
    res.json(tracks);
  } catch (error) {
    console.error("YouTube playlist error:", error);
    res.status(500).json({ error: "Internal YouTube playlist error" });
  }
}
