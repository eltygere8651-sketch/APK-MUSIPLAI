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

  const [currentTab, setCurrentTab] = useState<string>('library');
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          isAnonymous: currentUser.isAnonymous,
        });

        // Try syncing Cloud preferences
        const remoteSettings = await FirebaseSyncService.fetchSyncedSettings();
        if (remoteSettings) {
          setSettings(remoteSettings);
          await localStorageService.saveSettings(remoteSettings);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
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
    const newFavState = await localStorageService.toggleFavoriteTrack(trackId);
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isFavorite: newFavState } : t))
    );

    // Sync to Cloud
    const updatedTracks = tracks.map((t) => (t.id === trackId ? { ...t, isFavorite: newFavState } : t));
    const favoriteIds = updatedTracks.filter((t) => t.isFavorite).map((t) => t.id);
    FirebaseSyncService.syncFavorites(favoriteIds);
  };

  const handleDeleteTrack = async (trackId: string) => {
    await localStorageService.deleteTrack(trackId);
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
  };

  // --- Import Handlers ---
  const handleImportTracks = async (items: { track: Track; blob?: Blob }[]) => {
    await localStorageService.saveTracksWithBlobsBulk(items);
    await reloadLocalData();
  };

  const handleImportPlaylist = async (newPlaylist: Playlist, playlistTracks?: Track[]) => {
    if (playlistTracks && playlistTracks.length > 0) {
      await localStorageService.saveTracksBulk(playlistTracks);
    }
    await localStorageService.savePlaylist(newPlaylist);
    await reloadLocalData();

    // Sync Playlists
    FirebaseSyncService.syncPlaylists([...playlists, newPlaylist]);
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
    FirebaseSyncService.syncPlaylists([...playlists, newPlaylist]);
  };

  const handleDeletePlaylist = async (id: string) => {
    await localStorageService.deletePlaylist(id);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
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
