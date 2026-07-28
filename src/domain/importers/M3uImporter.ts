import { Track, Playlist } from '../types';

export interface ParsedPlaylistResult {
  playlistName: string;
  tracks: Partial<Track>[];
}

export class M3uImporter {
  public static parseM3u(content: string, fileName: string): ParsedPlaylistResult {
    const lines = content.split(/\r?\n/);
    const tracks: Partial<Track>[] = [];
    let currentTitle = '';
    let currentArtist = 'Desconocido';
    let currentDuration = 0;

    const playlistName = fileName.replace(/\.(m3u|m3u8|pls)$/i, '');

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.startsWith('#EXTINF:')) {
        // Line format: #EXTINF:123,Artist - Title
        const match = line.match(/#EXTINF:(-?\d+),(.*)/);
        if (match) {
          currentDuration = Math.max(0, parseInt(match[1], 10));
          const fullInfo = match[2];
          if (fullInfo.includes(' - ')) {
            const parts = fullInfo.split(' - ');
            currentArtist = parts[0].trim();
            currentTitle = parts.slice(1).join(' - ').trim();
          } else {
            currentTitle = fullInfo.trim();
          }
        }
      } else if (!line.startsWith('#')) {
        // Line is a URL or file path
        const trackTitle = currentTitle || line.split('/').pop()?.split('\\').pop() || 'Pista M3U';
        tracks.push({
          id: `m3u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: trackTitle,
          artist: currentArtist,
          duration: currentDuration,
          url: line,
          addedAt: Date.now(),
          sourceType: 'imported_playlist'
        });

        // Reset state for next track
        currentTitle = '';
        currentArtist = 'Desconocido';
        currentDuration = 0;
      }
    }

    return { playlistName, tracks };
  }

  public static parsePls(content: string, fileName: string): ParsedPlaylistResult {
    const lines = content.split(/\r?\n/);
    const playlistName = fileName.replace(/\.pls$/i, '');
    const entries: { [key: number]: { title?: string; file?: string; length?: number } } = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('[')) continue;

      const [key, val] = trimmed.split('=');
      if (!key || !val) continue;

      const lowerKey = key.toLowerCase();
      const numMatch = lowerKey.match(/(file|title|length)(\d+)/);
      if (numMatch) {
        const type = numMatch[1];
        const idx = parseInt(numMatch[2], 10);
        if (!entries[idx]) entries[idx] = {};

        if (type === 'file') entries[idx].file = val.trim();
        if (type === 'title') entries[idx].title = val.trim();
        if (type === 'length') entries[idx].length = Math.max(0, parseInt(val.trim(), 10));
      }
    }

    const tracks: Partial<Track>[] = Object.values(entries)
      .filter(entry => entry.file)
      .map(entry => ({
        id: `pls_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: entry.title || entry.file?.split('/').pop() || 'Pista PLS',
        artist: 'Desconocido',
        duration: entry.length || 0,
        url: entry.file!,
        addedAt: Date.now(),
        sourceType: 'imported_playlist'
      }));

    return { playlistName, tracks };
  }
}
