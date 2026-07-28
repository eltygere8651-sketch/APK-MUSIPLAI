import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, logout } from './lib/firebase';
import { audioEngine } from './domain/audio/AudioEngine';
import { localStorageService } from './domain/storage/LocalStorage';
import { FirebaseSyncService } from './domain/storage/FirebaseSyncService';

import { Track, Playlist, PlaybackState, UserSettings, UserProfile } from './domain/types';

import { Header } from './components/Header';
import { SidebarNavigation } from './components/SidebarNavigation';
import { MobileBottomNav } from './components/MobileBottomNav';
import { NowPlayingBar } from './components/NowPlayingBar';
import { FullScreenPlayerModal } from './components/FullScreenPlayerModal';

const LibraryView = React.lazy(() => import('./components/LibraryView').then(m => ({ default: m.LibraryView })));
const FolderBrowserView = React.lazy(() => import('./components/FolderBrowserView').then(m => ({ default: m.FolderBrowserView })));
const PlaylistView = React.lazy(() => import('./components/PlaylistView').then(m => ({ default: m.PlaylistView })));
const ImporterView = React.lazy(() => import('./components/ImporterView').then(m => ({ default: m.ImporterView })));
const SettingsView = React.lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
const SearchView = React.lazy(() => import('./components/SearchView').then(m => ({ default: m.SearchView })));
const ExploreView = React.lazy(() => import('./components/ExploreView').then(m => ({ default: m.ExploreView })));


import { AuthModal } from './components/AuthModal';

export function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'dark',
    crossfadeDuration: 0,
    gaplessPlayback: true,
    replayGain: false,
    autoResume: true,
    offlineOnly: false,
    highQualityAudio: true,
  });

  const [playbackState, setPlaybackState] = useState<PlaybackState>(audioEngine.getState());
  const [queue, setQueue] = useState<Track[]>(audioEngine.getQueue());

  const [currentTab, setCurrentTab] = useState<string>('explore');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isFullScreenPlayer, setIsFullScreenPlayer] = useState<boolean>(false);

  // --- Initial Data Loading ---
  const reloadLocalData = useCallback(async () => {
    let loadedTracks = await localStorageService.getAllTracks();
    const loadedPlaylists = await localStorageService.getAllPlaylists();
    const loadedSettings = await localStorageService.getSettings();

    if (loadedTracks.length === 0) {
      const demoTracks: Track[] = [
        {
          id: 'demo_1',
          title: 'Synth Funk Express',
          artist: 'Google Audio CDN',
          album: 'Colección Demo',
          duration: 210,
          url: 'https://actions.google.com/sounds/v1/music/synth_funk.ogg',
          format: 'ogg',
          folderPath: 'Música Demo',
          addedAt: Date.now(),
          sourceType: 'imported_playlist',
          isFavorite: true,
        },
        {
          id: 'demo_2',
          title: 'Retro Forest Ambient',
          artist: 'Google Audio CDN',
          album: 'Colección Demo',
          duration: 185,
          url: 'https://actions.google.com/sounds/v1/music/retro_forest.ogg',
          format: 'ogg',
          folderPath: 'Música Demo',
          addedAt: Date.now() - 1000,
          sourceType: 'imported_playlist',
          isFavorite: false,
        },
        {
          id: 'demo_3',
          title: 'Upbeat Funk Grooves',
          artist: 'Google Audio CDN',
          album: 'Colección Demo',
          duration: 195,
          url: 'https://actions.google.com/sounds/v1/music/upbeat_funk.ogg',
          format: 'ogg',
          folderPath: 'Música Demo',
          addedAt: Date.now() - 2000,
          sourceType: 'imported_playlist',
          isFavorite: true,
        },
      ];
      await localStorageService.saveTracksBulk(demoTracks);
      loadedTracks = demoTracks;
    }

    setTracks(loadedTracks);
    setPlaylists(loadedPlaylists);
    setSettings(loadedSettings);
  }, []);

  useEffect(() => {
    reloadLocalData();
  }, [reloadLocalData]);

  // --- Firebase Auth & Sync Subscriptions ---
  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          isAnonymous: currentUser.isAnonymous,
        });

        // 1. Fetch & Apply Cloud Settings
        const remoteSettings = await FirebaseSyncService.fetchSyncedSettings();
        if (remoteSettings) {
          setSettings(remoteSettings);
          await localStorageService.saveSettings(remoteSettings);
        }

        // 2. Fetch & Restore Cloud Favorites (Track objects with URLs)
        const remoteFavorites = await FirebaseSyncService.fetchSyncedFavorites();
        if (remoteFavorites && remoteFavorites.length > 0) {
          await localStorageService.saveTracksBulk(remoteFavorites);
          setTracks((prev) => {
            const map = new Map<string, Track>();
            prev.forEach((t) => map.set(t.id, t));
            remoteFavorites.forEach((t) => map.set(t.id, { ...t, isFavorite: true }));
            return Array.from(map.values());
          });
        }

        // 3. Fetch & Restore Cloud Playlists (Playlists with tracks & URLs)
        const remotePlaylists = await FirebaseSyncService.fetchSyncedPlaylists();
        if (remotePlaylists && remotePlaylists.length > 0) {
          for (const pl of remotePlaylists) {
            if (pl.tracks && pl.tracks.length > 0) {
              await localStorageService.saveTracksBulk(pl.tracks);
              setTracks((prev) => {
                const map = new Map<string, Track>();
                prev.forEach((t) => map.set(t.id, t));
                pl.tracks!.forEach((t) => map.set(t.id, t));
                return Array.from(map.values());
              });
            }
            await localStorageService.savePlaylist(pl);
          }
          setPlaylists((prev) => {
            const map = new Map<string, Playlist>();
            prev.forEach((p) => map.set(p.id, p));
            remotePlaylists.forEach((p) => map.set(p.id, p));
            return Array.from(map.values());
          });
        }

        // 4. Subscribe to Real-time Cloud Changes
        if (unsubSnapshot) unsubSnapshot();
        unsubSnapshot = FirebaseSyncService.subscribeToCloudData(async (cloudData) => {
          if (cloudData.settings) {
            setSettings(cloudData.settings);
            await localStorageService.saveSettings(cloudData.settings);
          }
          if (cloudData.favorites && cloudData.favorites.length > 0) {
            await localStorageService.saveTracksBulk(cloudData.favorites);
            setTracks((prev) => {
              const map = new Map<string, Track>();
              prev.forEach((t) => map.set(t.id, t));
              cloudData.favorites!.forEach((t) => map.set(t.id, { ...t, isFavorite: true }));
              return Array.from(map.values());
            });
          }
          if (cloudData.playlists && cloudData.playlists.length > 0) {
            for (const pl of cloudData.playlists) {
              if (pl.tracks && pl.tracks.length > 0) {
                await localStorageService.saveTracksBulk(pl.tracks);
              }
              await localStorageService.savePlaylist(pl);
            }
            setPlaylists((prev) => {
              const map = new Map<string, Playlist>();
              prev.forEach((p) => map.set(p.id, p));
              cloudData.playlists!.forEach((p) => map.set(p.id, p));
              return Array.from(map.values());
            });
          }
        });

      } else {
        setUser(null);
        if (unsubSnapshot) {
          unsubSnapshot();
          unsubSnapshot = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  // --- AudioEngine Event Listeners ---
  useEffect(() => {
    const unsubState = audioEngine.on('stateChange', (state) => setPlaybackState(state));
    const unsubTime = audioEngine.on('timeUpdate', () => setPlaybackState(audioEngine.getState()));
    const unsubQueue = audioEngine.on('queueChange', (q) => setQueue(q));

    return () => {
      unsubState();
      unsubTime();
      unsubQueue();
    };
  }, []);

  // --- Playback Handlers ---
  const handlePlayTrack = (track: Track, trackList: Track[] = []) => {
    const queue = trackList && trackList.length > 0 ? trackList : [track];
    const index = queue.findIndex((t) => t.id === track.id);
    audioEngine.setQueue(queue, index !== -1 ? index : 0, true);
  };

  const handleToggleFavorite = async (trackId: string) => {
    // Locate target track from state, active player or current queue
    let targetTrack = tracks.find((t) => t.id === trackId);
    if (!targetTrack && audioEngine.getState().currentTrack?.id === trackId) {
      targetTrack = audioEngine.getState().currentTrack || undefined;
    }
    if (!targetTrack) {
      const queue = audioEngine.getQueue();
      targetTrack = queue.find((t) => t.id === trackId);
    }

    if (!targetTrack) return;

    const newFavState = !targetTrack.isFavorite;
    const updatedTrack: Track = { ...targetTrack, isFavorite: newFavState };

    // Persist to local IndexedDB
    await localStorageService.saveTrack(updatedTrack);

    // Update React state
    setTracks((prev) => {
      const exists = prev.some((t) => t.id === trackId);
      if (exists) {
        return prev.map((t) => (t.id === trackId ? updatedTrack : t));
      } else {
        return [updatedTrack, ...prev];
      }
    });

    // Update AudioEngine internal state & notify listeners
    audioEngine.updateTrackFavorite(trackId, newFavState);

    // Sync to Firebase Cloud
    const currentTracks = tracks.some((t) => t.id === trackId)
      ? tracks.map((t) => (t.id === trackId ? updatedTrack : t))
      : [updatedTrack, ...tracks];
    const favoriteTracks = currentTracks.filter((t) => t.isFavorite);
    FirebaseSyncService.syncFavorites(favoriteTracks);
  };

  const handleDeleteTrack = async (trackId: string) => {
    await localStorageService.deleteTrack(trackId);
    setTracks((prev) => {
      const updated = prev.filter((t) => t.id !== trackId);
      FirebaseSyncService.syncFavorites(updated.filter((t) => t.isFavorite));
      return updated;
    });
  };

  // --- Import Handlers ---
  const handleImportTracks = async (items: { track: Track; blob?: Blob }[]) => {
    await localStorageService.saveTracksWithBlobsBulk(items);
    await reloadLocalData();
    const importedFavs = items.map((i) => i.track).filter((t) => t.isFavorite);
    if (importedFavs.length > 0) {
      const allFavs = [...tracks, ...importedFavs].filter((t) => t.isFavorite);
      FirebaseSyncService.syncFavorites(allFavs);
    }
  };

  const handleImportPlaylist = async (newPlaylist: Playlist, playlistTracks?: Track[]) => {
    if (playlistTracks && playlistTracks.length > 0) {
      await localStorageService.saveTracksBulk(playlistTracks);
    }
    await localStorageService.savePlaylist(newPlaylist);
    await reloadLocalData();

    // Sync Playlists with track URLs
    const allKnownTracks = playlistTracks ? [...tracks, ...playlistTracks] : tracks;
    FirebaseSyncService.syncPlaylists([...playlists, newPlaylist], allKnownTracks);
  };

  const handleCreatePlaylist = async (name: string, description?: string) => {
    const newPlaylist: Playlist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      description,
      trackIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sourceFormat: 'custom',
    };
    await localStorageService.savePlaylist(newPlaylist);
    setPlaylists((prev) => [...prev, newPlaylist]);
    FirebaseSyncService.syncPlaylists([...playlists, newPlaylist], tracks);
  };

  const handleDeletePlaylist = async (id: string) => {
    await localStorageService.deletePlaylist(id);
    const updated = playlists.filter((p) => p.id !== id);
    setPlaylists(updated);
    FirebaseSyncService.syncPlaylists(updated, tracks);
  };

  const handleUpdatePlaylist = async (id: string, name: string, description?: string) => {
    const existing = playlists.find((p) => p.id === id);
    if (!existing) return;

    const updatedPlaylist: Playlist = {
      ...existing,
      name,
      description,
      updatedAt: Date.now(),
    };

    await localStorageService.savePlaylist(updatedPlaylist);
    setPlaylists((prev) => prev.map((p) => (p.id === id ? updatedPlaylist : p)));

    const matchingTracks = tracks.filter((t) => updatedPlaylist.trackIds.includes(t.id));
    FirebaseSyncService.syncPlaylists(
      playlists.map((p) => (p.id === id ? updatedPlaylist : p)),
      tracks
    );
    FirebaseSyncService.publishToExplore(updatedPlaylist, matchingTracks);
  };

  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await localStorageService.saveSettings(updated);
    FirebaseSyncService.syncSettings(updated);
  };

  const favoritesCount = tracks.filter((t) => t.isFavorite).length;

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-black">
      {/* Top Header */}
      <div className="pt-[env(safe-area-inset-top)] bg-black/90 backdrop-blur-md sticky top-0 z-30">
        <Header
          user={user}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={logout}
          onNavigate={setCurrentTab}
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <SidebarNavigation
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          playlistsCount={playlists.length}
        />

        {/* Main View Area */}
        <main className="flex-1 overflow-hidden p-4 sm:p-6 pb-36 sm:pb-32 bg-black flex flex-col">
        <React.Suspense fallback={<div className="flex items-center justify-center h-full w-full pt-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}>

          {currentTab === 'explore' && (
            <ExploreView
              userPlaylists={playlists}
              userTracks={tracks}
              currentTrackId={playbackState.currentTrack?.id}
              isPlaying={playbackState.isPlaying}
              onImportPlaylist={handleImportPlaylist}
              onPlayTrack={handlePlayTrack}
              onToggleFavorite={handleToggleFavorite}
              onClose={() => setCurrentTab('library')}
            />
          )}

          {currentTab === 'search' && (
            <SearchView 
              onPlayTrack={handlePlayTrack} 
              onAddTrack={(t) => {
                 handleImportTracks([{ track: t }]);
                 setCurrentTab('library');
              }} 
            />
          )}
          {currentTab === 'library' && (
            <LibraryView
              tracks={tracks}
              currentTrackId={playbackState.currentTrack?.id}
              isPlaying={playbackState.isPlaying}
              searchQuery={searchQuery}
              onPlayTrack={handlePlayTrack}
              onToggleFavorite={handleToggleFavorite}
              onDeleteTrack={handleDeleteTrack}
            />
          )}

          {currentTab === 'playlists' && (
            <PlaylistView
              playlists={playlists}
              allTracks={tracks}
              currentTrackId={playbackState.currentTrack?.id}
              isPlaying={playbackState.isPlaying}
              onCreatePlaylist={handleCreatePlaylist}
              onUpdatePlaylist={handleUpdatePlaylist}
              onDeletePlaylist={handleDeletePlaylist}
              onPlayTrack={handlePlayTrack}
              onToggleFavorite={handleToggleFavorite}
              onClose={() => setCurrentTab('library')}
            />
          )}

          {currentTab === 'import' && (
            <ImporterView
              onImportTracks={handleImportTracks}
              onImportPlaylist={handleImportPlaylist}
              onClose={() => setCurrentTab('library')}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              user={user}
              trackCount={tracks.length}
              onUpdateSettings={handleUpdateSettings}
              onLogout={logout}
              onOpenAuth={() => setIsAuthOpen(true)}
              onClose={() => setCurrentTab('library')}
            />
          )}
        
        </React.Suspense>
</main>
      </div>

      {/* Persistent Bottom Audio Player Bar */}
      <NowPlayingBar
        playbackState={playbackState}
        onPlayPause={() => audioEngine.togglePlay()}
        onNext={() => audioEngine.next()}
        onPrevious={() => audioEngine.previous()}
        onSeek={(sec) => audioEngine.seek(sec)}
        onSetVolume={(vol) => audioEngine.setVolume(vol)}
        onToggleMute={() => audioEngine.toggleMute()}
        onToggleShuffle={() => audioEngine.toggleShuffle()}
        onToggleRepeat={() => audioEngine.toggleRepeat()}
        onToggleFavorite={handleToggleFavorite}
        onOpenFullScreen={() => setIsFullScreenPlayer(true)}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        playlistsCount={playlists.length}
      />

      {/* Fullscreen Player Modal */}
      <FullScreenPlayerModal
        isOpen={isFullScreenPlayer}
        onClose={() => setIsFullScreenPlayer(false)}
        playbackState={playbackState}
        queue={queue}
        onPlayPause={() => audioEngine.togglePlay()}
        onNext={() => audioEngine.next()}
        onPrevious={() => audioEngine.previous()}
        onSeek={(sec) => audioEngine.seek(sec)}
        onSetVolume={(vol) => audioEngine.setVolume(vol)}
        onToggleMute={() => audioEngine.toggleMute()}
        onToggleShuffle={() => audioEngine.toggleShuffle()}
        onToggleRepeat={() => audioEngine.toggleRepeat()}
        onToggleFavorite={handleToggleFavorite}
        onPlayTrackFromQueue={(t) => audioEngine.playTrack(t)}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
export default App;
