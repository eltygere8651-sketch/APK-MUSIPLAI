import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Track, Playlist, FolderItem, UserSettings } from '../types';
import { LocalFolderImporter } from '../importers/LocalFolderImporter';

interface FluxMusicDBSchema extends DBSchema {
  tracks: {
    key: string;
    value: Track;
    indexes: { 'by-artist': string; 'by-album': string; 'by-folder': string; 'by-favorite': number };
  };
  audioBlobs: {
    key: string;
    value: { id: string; blob: Blob; mimeType: string };
  };
  playlists: {
    key: string;
    value: Playlist;
  };
  folders: {
    key: string;
    value: FolderItem;
  };
  history: {
    key: string;
    value: { id: string; trackId: string; playedAt: number };
  };
  settings: {
    key: string;
    value: UserSettings;
  };
}

class LocalStorageService {
  private dbPromise: Promise<IDBPDatabase<FluxMusicDBSchema>>;

  constructor() {
    this.dbPromise = openDB<FluxMusicDBSchema>('flux_music_v2_db', 1, {
      upgrade(db) {
        // Tracks Store
        const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
        trackStore.createIndex('by-artist', 'artist');
        trackStore.createIndex('by-album', 'album');
        trackStore.createIndex('by-folder', 'folderPath');
        trackStore.createIndex('by-favorite', 'isFavorite');

        // Audio Blobs Store
        db.createObjectStore('audioBlobs', { keyPath: 'id' });

        // Playlists Store
        db.createObjectStore('playlists', { keyPath: 'id' });

        // Folders Store
        db.createObjectStore('folders', { keyPath: 'id' });

        // History Store
        db.createObjectStore('history', { keyPath: 'id' });

        // Settings Store
        db.createObjectStore('settings');
      },
    });
  }

  // --- Tracks ---
  public async saveTrack(track: Track, audioBlob?: Blob): Promise<void> {
    const db = await this.dbPromise;
    await db.put('tracks', track);
    if (audioBlob) {
      await db.put('audioBlobs', { id: track.id, blob: audioBlob, mimeType: audioBlob.type });
    }
  }

  public async saveTracksBulk(tracks: Track[]): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction('tracks', 'readwrite');
    for (const t of tracks) {
      await tx.store.put(t);
    }
    await tx.done;
  }

  public async saveTracksWithBlobsBulk(tracksWithBlobs: { track: Track; blob?: Blob }[]): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(['tracks', 'audioBlobs'], 'readwrite');
    const trackStore = tx.objectStore('tracks');
    const blobStore = tx.objectStore('audioBlobs');

    for (const item of tracksWithBlobs) {
      await trackStore.put(item.track);
      if (item.blob) {
        await blobStore.put({ id: item.track.id, blob: item.blob, mimeType: item.blob.type });
      }
    }
    await tx.done;
  }

  public async getAllTracks(): Promise<Track[]> {
    const db = await this.dbPromise;
    // We do NOT fetch all blobs into memory here. It crashes on large libraries.
    // We just return the track metadata. The AudioEngine will fetch the blob when playing.
    const tracks = await db.getAll('tracks');
    return tracks;
  }

  public async getTrack(id: string): Promise<Track | undefined> {
    const db = await this.dbPromise;
    return await db.get('tracks', id);
  }

  public async getAudioBlob(id: string): Promise<Blob | undefined> {
    const db = await this.dbPromise;
    const record = await db.get('audioBlobs', id);
    return record?.blob;
  }

  public async deleteTrack(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('tracks', id);
    await db.delete('audioBlobs', id);
  }

  public async toggleFavoriteTrack(id: string): Promise<boolean> {
    const db = await this.dbPromise;
    const track = await db.get('tracks', id);
    if (!track) return false;

    track.isFavorite = !track.isFavorite;
    await db.put('tracks', track);
    return track.isFavorite;
  }

  // --- Playlists ---
  public async savePlaylist(playlist: Playlist): Promise<void> {
    const db = await this.dbPromise;
    await db.put('playlists', playlist);
  }

  public async getAllPlaylists(): Promise<Playlist[]> {
    const db = await this.dbPromise;
    return await db.getAll('playlists');
  }

  public async deletePlaylist(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('playlists', id);
  }

  // --- Settings ---
  public async getSettings(): Promise<UserSettings> {
    const db = await this.dbPromise;
    const settings = await db.get('settings', 'default');
    return settings || {
      theme: 'dark',
      crossfadeDuration: 0,
      gaplessPlayback: true,
      replayGain: false,
      autoResume: true,
      offlineOnly: false,
      highQualityAudio: true,
    };
  }

  public async saveSettings(settings: UserSettings): Promise<void> {
    const db = await this.dbPromise;
    await db.put('settings', settings, 'default');
  }
}

export const localStorageService = new LocalStorageService();
