import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { UserSettings, Playlist, Track } from '../types';

export class FirebaseSyncService {
  private static getUserId(): string | null {
    return auth.currentUser?.uid || null;
  }

  // --- Settings ---
  public static async syncSettings(settings: UserSettings): Promise<void> {
    const uid = this.getUserId();
    if (!uid) return;

    try {
      const userDocRef = doc(db, 'users', uid, 'data', 'settings');
      await setDoc(userDocRef, settings, { merge: true });
    } catch (err) {
      console.warn('Firebase settings sync skipped/failed:', err);
    }
  }

  public static async fetchSyncedSettings(): Promise<UserSettings | null> {
    const uid = this.getUserId();
    if (!uid) return null;

    try {
      const userDocRef = doc(db, 'users', uid, 'data', 'settings');
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        return snap.data() as UserSettings;
      }
    } catch (err) {
      console.warn('Firebase settings fetch error:', err);
    }
    return null;
  }

  // --- Favorites (Full Track objects with audio URLs) ---
  public static async syncFavorites(favoriteTracks: Track[]): Promise<void> {
    const uid = this.getUserId();
    if (!uid) return;

    try {
      const cleanedTracks = favoriteTracks.map((t) => ({
        id: t.id,
        title: t.title || 'Canción sin título',
        artist: t.artist || 'Artista Desconocido',
        album: t.album || '',
        duration: typeof t.duration === 'number' ? t.duration : 180,
        url: t.url || (t.youtubeId ? `/api/audio-stream?id=${t.id}&youtubeId=${t.youtubeId}` : ''),
        artworkUrl: t.artworkUrl || '',
        sourceType: t.sourceType || 'web_stream',
        youtubeId: t.youtubeId || null,
        spotifyId: t.spotifyId || null,
        addedAt: t.addedAt || Date.now(),
        isFavorite: true,
      }));

      const docRef = doc(db, 'users', uid, 'data', 'favorites');
      await setDoc(
        docRef,
        {
          tracks: cleanedTracks,
          favoriteIds: cleanedTracks.map((t) => t.id),
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firebase favorites sync error:', err);
    }
  }

  public static async fetchSyncedFavorites(): Promise<Track[]> {
    const uid = this.getUserId();
    if (!uid) return [];

    try {
      const docRef = doc(db, 'users', uid, 'data', 'favorites');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.tracks)) {
          return data.tracks as Track[];
        }
      }
    } catch (err) {
      console.warn('Firebase favorites fetch error:', err);
    }
    return [];
  }

  // --- Playlists (Full Playlists with tracks & URLs) ---
  public static async syncPlaylists(playlists: Playlist[], allTracks: Track[] = []): Promise<void> {
    const uid = this.getUserId();
    if (!uid) return;

    try {
      const trackMap = new Map<string, Track>();
      allTracks.forEach((t) => trackMap.set(t.id, t));

      const cleanedPlaylists = playlists.map((pl) => {
        let tracks: Track[] = pl.tracks || [];
        if (pl.trackIds && pl.trackIds.length > 0) {
          const resolved = pl.trackIds.map((id) => trackMap.get(id)).filter(Boolean) as Track[];
          if (resolved.length > 0) {
            tracks = resolved;
          }
        }

        const cleanedTracks = tracks.map((t) => ({
          id: t.id,
          title: t.title || 'Pista',
          artist: t.artist || 'Desconocido',
          album: t.album || pl.name,
          duration: typeof t.duration === 'number' ? t.duration : 180,
          url: t.url || (t.youtubeId ? `/api/audio-stream?id=${t.id}&youtubeId=${t.youtubeId}` : ''),
          artworkUrl: t.artworkUrl || pl.coverUrl || '',
          sourceType: t.sourceType || 'imported_playlist',
          youtubeId: t.youtubeId || null,
          spotifyId: t.spotifyId || null,
          addedAt: t.addedAt || Date.now(),
          isFavorite: !!t.isFavorite,
        }));

        return {
          id: pl.id,
          name: pl.name,
          description: pl.description || '',
          coverUrl: pl.coverUrl || '',
          trackIds: pl.trackIds || cleanedTracks.map((t) => t.id),
          tracks: cleanedTracks,
          createdAt: pl.createdAt || Date.now(),
          updatedAt: Date.now(),
          sourceFormat: pl.sourceFormat || 'custom',
        };
      });

      const docRef = doc(db, 'users', uid, 'data', 'playlists');
      await setDoc(
        docRef,
        {
          playlists: cleanedPlaylists,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      // Publish imported or custom playlists to Explore for community discovery
      for (const pl of cleanedPlaylists) {
        if (pl.tracks && pl.tracks.length > 0) {
          this.publishToExplore(pl, pl.tracks).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Firebase playlists sync error:', err);
    }
  }

  // --- Public Explore Playlists Sync ---
  public static async publishToExplore(playlist: Playlist, tracks: Track[]): Promise<void> {
    try {
      const uid = this.getUserId() || 'community';
      const authorName = auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Comunidad Flux';
      const docRef = doc(db, 'explore_custom_playlists', playlist.id);

      const cleanedTracks = tracks.map((t) => ({
        id: t.id,
        title: t.title || 'Pista',
        artist: t.artist || 'Desconocido',
        album: t.album || playlist.name,
        duration: typeof t.duration === 'number' ? t.duration : 180,
        url: t.url || (t.youtubeId ? `/api/audio-stream?id=${t.id}&youtubeId=${t.youtubeId}` : ''),
        artworkUrl: t.artworkUrl || playlist.coverUrl || '',
        sourceType: t.sourceType || 'imported_playlist',
        youtubeId: t.youtubeId || null,
        spotifyId: t.spotifyId || null,
        addedAt: t.addedAt || Date.now(),
      }));

      await setDoc(
        docRef,
        {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description || 'Playlist de la comunidad Flux',
          coverUrl: playlist.coverUrl || (cleanedTracks[0]?.artworkUrl || ''),
          trackIds: cleanedTracks.map((t) => t.id),
          tracks: cleanedTracks,
          createdAt: playlist.createdAt || Date.now(),
          updatedAt: Date.now(),
          ownerId: uid,
          ownerName: authorName,
          sourceFormat: playlist.sourceFormat || 'custom',
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Publish to Explore warning:', err);
    }
  }

  public static async fetchExplorePlaylists(forceRefresh = false): Promise<Playlist[]> {
    const CACHE_KEY = 'flux_explore_playlists_cache';
    const CACHE_TIME_KEY = 'flux_explore_playlists_time';
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

    const now = Date.now();
    if (!forceRefresh && cached && cachedTime && now - parseInt(cachedTime, 10) < 10 * 60 * 1000) {
      try {
        return JSON.parse(cached) as Playlist[];
      } catch {}
    }

    try {
      const { collection, getDocs, limit, query } = await import('firebase/firestore');
      const exploreRef = collection(db, 'explore_custom_playlists');
      const q = query(exploreRef, limit(30));
      const snap = await getDocs(q);

      const results: Playlist[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.name) {
          results.push(data as Playlist);
        }
      });

      if (results.length > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(results));
        localStorage.setItem(CACHE_TIME_KEY, now.toString());
      }
      return results;
    } catch (err) {
      console.warn('Fetch Explore Playlists error:', err);
      if (cached) {
        try {
          return JSON.parse(cached) as Playlist[];
        } catch {}
      }
      return [];
    }
  }

  public static async fetchSyncedPlaylists(): Promise<Playlist[]> {
    const uid = this.getUserId();
    if (!uid) return [];

    try {
      const docRef = doc(db, 'users', uid, 'data', 'playlists');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.playlists)) {
          return data.playlists as Playlist[];
        }
      }
    } catch (err) {
      console.warn('Firebase playlists fetch error:', err);
    }
    return [];
  }

  // --- Real-Time Sync Listener ---
  public static subscribeToCloudData(
    callback: (data: { favorites?: Track[]; playlists?: Playlist[]; settings?: UserSettings }) => void
  ): () => void {
    const uid = this.getUserId();
    if (!uid) return () => {};

    const favRef = doc(db, 'users', uid, 'data', 'favorites');
    const plRef = doc(db, 'users', uid, 'data', 'playlists');
    const setRef = doc(db, 'users', uid, 'data', 'settings');

    const unsubFav = onSnapshot(
      favRef,
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data().tracks)) {
          callback({ favorites: snap.data().tracks });
        }
      },
      (err) => console.warn('Fav snapshot error:', err)
    );

    const unsubPl = onSnapshot(
      plRef,
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data().playlists)) {
          callback({ playlists: snap.data().playlists });
        }
      },
      (err) => console.warn('Playlist snapshot error:', err)
    );

    const unsubSet = onSnapshot(
      setRef,
      (snap) => {
        if (snap.exists()) {
          callback({ settings: snap.data() as UserSettings });
        }
      },
      (err) => console.warn('Settings snapshot error:', err)
    );

    return () => {
      unsubFav();
      unsubPl();
      unsubSet();
    };
  }
}
