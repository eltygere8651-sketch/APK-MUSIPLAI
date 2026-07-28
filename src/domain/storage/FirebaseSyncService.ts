import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { UserSettings, Playlist } from '../types';

export class FirebaseSyncService {
  private static getUserId(): string | null {
    return auth.currentUser?.uid || null;
  }

  // Sync user settings
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

  // Fetch synced settings
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

  // Sync favorites track IDs
  public static async syncFavorites(favoriteIds: string[]): Promise<void> {
    const uid = this.getUserId();
    if (!uid) return;

    try {
      const docRef = doc(db, 'users', uid, 'data', 'favorites');
      await setDoc(docRef, { favoriteIds, updatedAt: Date.now() }, { merge: true });
    } catch (err) {
      console.warn('Firebase favorites sync error:', err);
    }
  }

  // Sync playlists
  public static async syncPlaylists(playlists: Playlist[]): Promise<void> {
    const uid = this.getUserId();
    if (!uid) return;

    try {
      const docRef = doc(db, 'users', uid, 'data', 'playlists');
      await setDoc(docRef, { playlists, updatedAt: Date.now() }, { merge: true });
    } catch (err) {
      console.warn('Firebase playlists sync error:', err);
    }
  }
}
