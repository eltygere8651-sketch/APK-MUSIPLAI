import express from 'express';
import { Innertube, UniversalCache } from 'youtubei.js';
let ytClient: Innertube | null = null;

import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import cors from "cors";
import { spawn } from "child_process";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Health check endpoint

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Flux Music V2", version: "2.0.0" });
});

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    if (!ytClient) ytClient = await Innertube.create({ cache: new UniversalCache(false) });
    const search = await ytClient.search(query as string, { type: 'video' });
    const results = search.videos.slice(0, 10).map((v: any) => ({
      id: v.id,
      title: v.title?.text || v.title,
      duration: v.duration?.seconds || 0,
      author: v.author?.name || 'Unknown'
    }));
    res.json({ results });
  } catch (error) {
    console.error("Youtubei search error:", error);
    res.status(500).json({ error: "Search failed", details: String(error) });
  }
});

let proxyList: string[] = [];
let lastProxyFetch = 0;

async function getWorkingProxy(): Promise<string | null> {
  if (Date.now() - lastProxyFetch > 10 * 60 * 1000 || proxyList.length === 0) {
    try {
      console.log("Fetching new proxy list...");
      const res = await fetch("https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=5000&country=all&ssl=yes&anonymity=elite");
      const text = await res.text();
      proxyList = text.split(/\r?\n/).map(p => p.trim()).filter(p => p);
      lastProxyFetch = Date.now();
    } catch (e) {
      console.error("Failed to fetch proxies:", e);
    }
  }
  if (proxyList.length > 0) {
    return proxyList[Math.floor(Math.random() * proxyList.length)];
  }
  return null;
}

// Full Link Importer (Spotify & YouTube)
const activeDownloads = new Map<string, Promise<string>>();


app.get("/api/audio-stream", async (req, res) => {
  const trackId = (req.query.id as string) || "";
  let youtubeId = (req.query.youtubeId as string) || "";
  const query = (req.query.q as string) || "";
  
  try {
    if (youtubeId && (youtubeId.includes("http") || youtubeId.includes("youtube.com") || youtubeId.includes("youtu.be"))) {
      const match = youtubeId.match(/(?:v=|\/vi\/|youtu\.be\/|\/v\/|\/embed\/|\/shorts\/|\/watch\?v=|[?&]v=)([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        youtubeId = match[1];
      }
    }
    
    if (!youtubeId && query) {
      try {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
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
        const args = ['--quiet', '--no-warnings', '--dump-json', `scsearch1:${query}`];
        const searchProcess = spawn('./yt-dlp', args);
        let searchData = '';
        for await (const chunk of searchProcess.stdout) searchData += chunk;
        if (searchData) {
          try {
            const info = JSON.parse(searchData.trim().split('\n')[0]);
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
      `https://www.youtube.com/watch?v=${youtubeId}`
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

app.get("/api/import-link", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl || !targetUrl.trim()) {
    res.status(400).json({ error: "URL parameter required" });
    return;
  }

  const trimmed = targetUrl.trim();
  const timestamp = Date.now();

  try {
    // --- 1. SPOTIFY IMPORTER ---
    if (trimmed.includes("spotify.com")) {
      const playlistMatch = trimmed.match(/playlist\/([a-zA-Z0-9]+)/);
      const trackMatch = trimmed.match(/track\/([a-zA-Z0-9]+)/);

      if (playlistMatch) {
        const playlistId = playlistMatch[1];
        const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
        const embedRes = await fetch(embedUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });

        let playlistName = "Lista Spotify";
        let playlistCover = "";
        const tracks: any[] = [];

        if (embedRes.ok) {
          const html = await embedRes.text();
          const scriptMatch = html.match(/<script id="(?:__NEXT_DATA__|resource)"[^>]*>([^<]+)<\/script>/);

          if (scriptMatch && scriptMatch[1]) {
            try {
              const data = JSON.parse(scriptMatch[1]);
              const entity = data.props?.pageProps?.state?.data?.entity || data.props?.pageProps?.entity || data;
              playlistName = entity.name || data.name || playlistName;
              playlistCover = entity.images?.[0]?.url || "";

              const rawItems = entity.tracks?.items || entity.tracks || [];
              rawItems.forEach((item: any, idx: number) => {
                const trk = item.track || item;
                if (trk && trk.name) {
                  const artistName = trk.artists ? trk.artists.map((a: any) => a.name).join(", ") : "Artista Desconocido";
                  const artwork = trk.album?.images?.[0]?.url || playlistCover;
                  const audioUrl = trk.preview_url || "";
                  const durationSec = trk.duration_ms ? Math.round(trk.duration_ms / 1000) : 180;

                  const trackId = `sp_${playlistId}_${idx}_${timestamp}`;
                  tracks.push({
                    id: trackId,
                    title: trk.name,
                    artist: artistName,
                    album: trk.album?.name || playlistName,
                    duration: durationSec,
                    url: `/api/audio-stream?id=${trackId}&q=${encodeURIComponent(trk.name + " " + artistName)}`,
                    artworkUrl: artwork,
                    addedAt: timestamp - idx * 10,
                    sourceType: "imported_playlist",
                    spotifyId: trk.id || undefined,
                  });
                }
              });
            } catch (parseErr) {
              console.warn("Spotify JSON parse warning:", parseErr);
            }
          }
        }

        // Fallback via oEmbed if embed page didn't yield tracks
        if (tracks.length === 0) {
          const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(trimmed)}`);
          if (oembedRes.ok) {
            const oembed = await oembedRes.json();
            playlistName = oembed.title || playlistName;
            playlistCover = oembed.thumbnail_url || playlistCover;

            // Generate representative tracks with names for the playlist
            const defaultSongs = [
              { title: "Canción 1 - " + playlistName, artist: oembed.author_name || "Spotify" },
              { title: "Canción 2 - " + playlistName, artist: oembed.author_name || "Spotify" },
              { title: "Canción 3 - " + playlistName, artist: oembed.author_name || "Spotify" },
              { title: "Canción 4 - " + playlistName, artist: oembed.author_name || "Spotify" }
            ];

            defaultSongs.forEach((s, idx) => {
              const trackId = `sp_${playlistId}_${idx}_${timestamp}`;
              tracks.push({
                id: trackId,
                title: s.title,
                artist: s.artist,
                album: playlistName,
                duration: 210,
                url: `/api/audio-stream?id=${trackId}&q=${encodeURIComponent(s.title + " " + s.artist)}`,
                artworkUrl: playlistCover,
                addedAt: timestamp - idx * 10,
                sourceType: "imported_playlist",
                spotifyId: playlistId,
              });
            });
          }
        }

        const newPlaylist = {
          id: `playlist_sp_${playlistId}_${timestamp}`,
          name: playlistName,
          description: `Lista importada desde Spotify (${tracks.length} canciones)`,
          coverUrl: playlistCover || undefined,
          trackIds: tracks.map((t) => t.id),
          createdAt: timestamp,
          updatedAt: timestamp,
          sourceFormat: "spotify_structure"
        };

        res.json({
          playlist: newPlaylist,
          tracks,
          summary: `Se ha importado la lista de Spotify "${playlistName}" con ${tracks.length} canciones reproducibles.`
        });
        return;

      } else if (trackMatch) {
        const trackId = trackMatch[1];
        const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(trimmed)}`);
        let title = "Canción de Spotify";
        let artist = "Artista de Spotify";
        let artwork = "";

        if (oembedRes.ok) {
          const oembed = await oembedRes.json();
          title = oembed.title || title;
          artist = oembed.author_name || artist;
          artwork = oembed.thumbnail_url || "";
        }

        const singleTrackId = `sp_track_${trackId}_${timestamp}`;
        const singleTrack = {
          id: singleTrackId,
          title,
          artist,
          album: "Sencillo Spotify",
          duration: 200,
          url: `/api/audio-stream?id=${singleTrackId}&q=${encodeURIComponent(title + " " + artist)}`,
          artworkUrl: artwork,
          addedAt: timestamp,
          sourceType: "imported_playlist",
          spotifyId: trackId,
        };

        const newPlaylist = {
          id: `playlist_sp_tr_${trackId}_${timestamp}`,
          name: title,
          description: `Canción de Spotify por ${artist}`,
          coverUrl: artwork || undefined,
          trackIds: [singleTrack.id],
          createdAt: timestamp,
          updatedAt: timestamp,
          sourceFormat: "spotify_structure"
        };

        res.json({
          playlist: newPlaylist,
          tracks: [singleTrack],
          summary: `Se ha importado el tema de Spotify "${title}" de ${artist}.`
        });
        return;
      }
    }

    // --- 2. YOUTUBE IMPORTER ---
    if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
      const playlistMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);

      if (playlistMatch) {
        const playlistId = playlistMatch[1];
        const ytPlaylistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
        const ytRes = await fetch(ytPlaylistUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });

        let playlistName = "Lista de YouTube";
        let playlistCover = "";
        const tracks: any[] = [];

        if (ytRes.ok) {
          const html = await ytRes.text();
          // Extract playlist title
          const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/);
          if (titleMatch) playlistName = titleMatch[1];

          // Extract video items using regex
          const videoRegex = /"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"([^"]+)"\}/g;
          let match;
          let idx = 0;
          const seenIds = new Set<string>();

          while ((match = videoRegex.exec(html)) !== null && idx < 30) {
            const vId = match[1];
            const vTitle = match[2];

            if (!seenIds.has(vId) && vTitle) {
              seenIds.add(vId);
              let trackTitle = vTitle;
              let trackArtist = "YouTube";

              if (vTitle.includes(" - ")) {
                const parts = vTitle.split(" - ");
                trackArtist = parts[0].trim();
                trackTitle = parts.slice(1).join(" - ").trim();
              } else if (vTitle.includes(" – ")) {
                const parts = vTitle.split(" – ");
                trackArtist = parts[0].trim();
                trackTitle = parts.slice(1).join(" – ").trim();
              }

              const artwork = `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;
              if (!playlistCover) playlistCover = artwork;

              const trackId = `yt_${vId}_${timestamp}`;
              tracks.push({
                id: trackId,
                title: trackTitle,
                artist: trackArtist,
                album: playlistName,
                duration: 210,
                url: `/api/audio-stream?id=${trackId}&youtubeId=${vId}`,
                artworkUrl: artwork,
                addedAt: timestamp - idx * 10,
                sourceType: "imported_playlist",
                youtubeId: vId,
              });

              idx++;
            }
          }
        }

        // Fallback if regex did not yield videos
        if (tracks.length === 0) {
          const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(trimmed)}&format=json`);
          if (oembedRes.ok) {
            const oembed = await oembedRes.json();
            playlistName = oembed.title || playlistName;
            playlistCover = oembed.thumbnail_url || "";

            let vid = "";
            const vMatch = trimmed.match(/(?:v=|youtu\.be\/)([^&?]+)/);
            if (vMatch && vMatch[1]) vid = vMatch[1];
            
            const tid = `yt_pl_${playlistId}_0_${timestamp}`;
            tracks.push({
              id: tid,
              title: playlistName,
              artist: oembed.author_name || "YouTube",
              album: playlistName,
              duration: 240,
              url: vid ? `/api/audio-stream?id=${tid}&youtubeId=${vid}` : "",
              artworkUrl: playlistCover,
              addedAt: timestamp,
              sourceType: "imported_playlist",
              youtubeId: vid
            });
          }
        }

        const newPlaylist = {
          id: `playlist_yt_${playlistId}_${timestamp}`,
          name: playlistName,
          description: `Lista importada desde YouTube (${tracks.length} canciones)`,
          coverUrl: playlistCover || undefined,
          trackIds: tracks.map((t) => t.id),
          createdAt: timestamp,
          updatedAt: timestamp,
          sourceFormat: "yt_structure"
        };

        res.json({
          playlist: newPlaylist,
          tracks,
          summary: `Se ha importado la lista de YouTube "${playlistName}" con ${tracks.length} canciones.`
        });
        return;

      } else {
        // Single YouTube Video
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(trimmed)}&format=json`);
        if (!oembedRes.ok) {
          res.status(400).json({ error: "No se pudo obtener la información del video de YouTube" });
          return;
        }

        const oembed = await oembedRes.json();
        const rawTitle = oembed.title || "Video de YouTube";
        const author = oembed.author_name || "YouTube";
        const artwork = oembed.thumbnail_url || "";

        let trackTitle = rawTitle;
        let trackArtist = author;

        if (rawTitle.includes(" - ")) {
          const parts = rawTitle.split(" - ");
          trackArtist = parts[0].trim();
          trackTitle = parts.slice(1).join(" - ").trim();
        } else if (rawTitle.includes(" – ")) {
          const parts = rawTitle.split(" – ");
          trackArtist = parts[0].trim();
          trackTitle = parts.slice(1).join(" – ").trim();
        }

        // Extract YouTube video ID if possible
        const vMatch = trimmed.match(/(?:v=|\/vi\/|youtu\.be\/|\/v\/|\/embed\/|\/shorts\/|\/watch\?v=|[?&]v=)([a-zA-Z0-9_-]{11})/);
        const singleVId = vMatch ? vMatch[1] : "";
        const singleTrackId = `yt_track_${singleVId || timestamp}`;
        const streamUrl = singleVId 
          ? `/api/audio-stream?id=${singleTrackId}&youtubeId=${singleVId}`
          : `/api/audio-stream?id=${singleTrackId}&q=${encodeURIComponent(trackTitle + ' ' + trackArtist)}`;

        const singleTrack = {
          id: singleTrackId,
          title: trackTitle,
          artist: trackArtist,
          album: "Sencillo YouTube",
          duration: 210,
          url: streamUrl,
          artworkUrl: artwork,
          addedAt: timestamp,
          sourceType: "imported_playlist",
          youtubeId: singleVId || undefined,
        };

        const newPlaylist = {
          id: `playlist_yt_tr_${timestamp}`,
          name: trackTitle,
          description: `Tema de YouTube por ${trackArtist}`,
          coverUrl: artwork || undefined,
          trackIds: [singleTrack.id],
          createdAt: timestamp,
          updatedAt: timestamp,
          sourceFormat: "yt_structure"
        };

        res.json({
          playlist: newPlaylist,
          tracks: [singleTrack],
          summary: `Se ha importado el tema de YouTube "${trackTitle}" de ${trackArtist}.`
        });
        return;
      }
    }

    res.status(400).json({ error: "Formato no soportado. Proporciona un enlace público de Spotify o YouTube." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al procesar el enlace" });
  }
});

// Official oEmbed Metadata Endpoint for Spotify/YouTube Public Playlists (Structure Only)
app.get("/api/oembed", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).json({ error: "URL parameter required" });
    return;
  }

  try {
    let oembedUrl = "";
    if (targetUrl.includes("spotify.com")) {
      oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(targetUrl)}`;
    } else if (targetUrl.includes("youtube.com") || targetUrl.includes("youtu.be")) {
      oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
    } else {
      res.status(400).json({ error: "Unsupported platform for structure import. Only Spotify & YouTube public links supported." });
      return;
    }

    const response = await fetch(oembedUrl);
    if (!response.ok) {
      res.status(response.status).json({ error: "Failed to fetch metadata from source platform" });
      return;
    }

    const data = await response.json();
    res.json({
      title: data.title || "Imported Playlist",
      author_name: data.author_name || "Unknown Author",
      thumbnail_url: data.thumbnail_url || "",
      provider_name: data.provider_name || "",
      type: data.type || "playlist"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to parse playlist structure" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Flux Music V2] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
