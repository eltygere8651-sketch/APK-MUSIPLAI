import { Track } from '../domain/types';
import { localStorageService } from '../domain/storage/LocalStorage';

/**
 * Caches an individual track in IndexedDB (Offline Storage).
 */
export async function downloadTrackAsMp3(track: Track): Promise<void> {
  // Case 1: Already locally cached (Data URL or Blob URL)
  if (track.url.startsWith('data:') || track.url.startsWith('blob:')) {
    return;
  }

  // Case 2: Server audio stream or web URL
  let downloadUrl = track.url;
  if (!downloadUrl.startsWith('http') && !downloadUrl.startsWith('/')) {
    downloadUrl = `/api/audio-stream?id=${encodeURIComponent(track.id)}`;
  }

  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const mp3Blob = new Blob([blob], { type: 'audio/mpeg' });
    
    // Save to IndexedDB
    const updatedTrack: Track = { ...track, url: '', sourceType: 'local_file' }; 
    await localStorageService.saveTrack(updatedTrack, mp3Blob);

  } catch (err) {
    console.warn('Failed to cache track offline:', err);
    throw err;
  }
}

/**
 * Caches all tracks in a playlist sequentially.
 */
export async function downloadPlaylistAsMp3(
  playlistName: string,
  tracks: Track[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < tracks.length; i++) {
    if (onProgress) onProgress(i + 1, tracks.length);
    try {
      await downloadTrackAsMp3(tracks[i]);
    } catch (e) {
      console.warn(`Failed to cache track ${tracks[i].title}`, e);
    }
    // Brief delay to not overwhelm the server
    await new Promise((res) => setTimeout(res, 600));
  }
}
