import React, { useState, useEffect } from 'react';
import { Compass, Play, Plus, Check, RefreshCw, Music, Search, Heart, ListMusic, Sparkles } from 'lucide-react';
import { Playlist, Track } from '../domain/types';
import { FirebaseSyncService } from '../domain/storage/FirebaseSyncService';
import { TrackList } from './TrackList';

interface ExploreViewProps {
  userPlaylists: Playlist[];
  userTracks: Track[];
  currentTrackId?: string;
  isPlaying?: boolean;
  onImportPlaylist: (playlist: Playlist, tracks?: Track[]) => void;
  onPlayTrack: (track: Track, tracks: Track[]) => void;
  onToggleFavorite: (trackId: string) => void;
  onClose?: () => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  userPlaylists,
  userTracks,
  currentTrackId,
  isPlaying,
  onImportPlaylist,
  onPlayTrack,
  onToggleFavorite,
  onClose,
}) => {
  const [explorePlaylists, setExplorePlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [addedPlaylistIds, setAddedPlaylistIds] = useState<Set<string>>(new Set());

  // Load explore playlists from Firestore / LocalCache
  const loadExploreData = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const results = await FirebaseSyncService.fetchExplorePlaylists(force);
      setExplorePlaylists(results);
    } catch (err) {
      console.warn('Error loading explore data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadExploreData(false);
  }, []);

  // Track which playlists user already added
  useEffect(() => {
    const existingIds = new Set(userPlaylists.map((p) => p.id));
    setAddedPlaylistIds(existingIds);
  }, [userPlaylists]);

  // Filter logic
  const filteredPlaylists = explorePlaylists.filter((pl) => {
    const matchesSearch =
      !searchQuery.trim() ||
      pl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pl.description && pl.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'spotify') return pl.sourceFormat === 'spotify_structure';
    if (selectedCategory === 'youtube') return pl.sourceFormat === 'yt_structure';
    if (selectedCategory === 'm3u') return pl.sourceFormat === 'm3u' || pl.sourceFormat === 'pls';
    return true;
  });

  const handleAddPlaylistToLibrary = (pl: Playlist) => {
    const tracksToSave: Track[] = pl.tracks && pl.tracks.length > 0 ? pl.tracks : [];
    
    // Create local clone
    const clonedPlaylist: Playlist = {
      ...pl,
      id: pl.id.startsWith('user_') ? pl.id : `added_${Date.now()}_${pl.id}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onImportPlaylist(clonedPlaylist, tracksToSave);
    setAddedPlaylistIds((prev) => new Set([...Array.from(prev), pl.id, clonedPlaylist.id]));
  };

  const getPlaylistCover = (pl: Playlist) => {
    if (pl.coverUrl) return pl.coverUrl;
    if (pl.tracks && pl.tracks.length > 0 && pl.tracks[0].artworkUrl) {
      return pl.tracks[0].artworkUrl;
    }
    return null;
  };

  return (
    <div className="space-y-6 select-none h-full flex flex-col pb-12">
      {/* Mobile Sticky Header */}
      <div className="sticky top-[env(safe-area-inset-top)] z-20 -mx-4 sm:mx-0 px-4 py-3 bg-black/90 backdrop-blur-md border-b border-neutral-800/50 sm:hidden flex items-center justify-between mb-2">
        {onClose ? (
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-bold text-white hover:text-emerald-400 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </div>
          </button>
        ) : (
          <div className="w-8"></div>
        )}
        <span className="text-sm font-bold text-white flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-emerald-400" />
          Explorar
        </span>
        <button
          onClick={() => loadExploreData(true)}
          disabled={refreshing}
          className="p-2 text-neutral-400 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/80 via-neutral-900 to-black p-6 md:p-8 border border-neutral-800/80 shadow-2xl">
        <div className="absolute -top-10 -right-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Comunidad & Playlists Públicas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Explorar Playlists
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Descubre y añade listas compartidas por la comunidad o importadas de Spotify y YouTube directamente a tu biblioteca.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => loadExploreData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/60 font-semibold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{refreshing ? 'Sincronizando...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 pt-6 border-t border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar playlists públicas..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'spotify', label: 'Spotify' },
              { id: 'youtube', label: 'YouTube' },
              { id: 'm3u', label: 'Archivos M3U' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/10'
                    : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      {selectedPlaylist ? (
        /* Detailed View of Selected Community Playlist */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedPlaylist(null)}
              className="flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-white transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </div>
              <span>Volver a Explorar</span>
            </button>
          </div>

          <div className="p-6 bg-neutral-900/80 border border-neutral-800/80 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5 min-w-0">
              <div className="w-24 h-24 rounded-2xl bg-neutral-950 overflow-hidden shrink-0 border border-neutral-800 shadow-2xl flex items-center justify-center">
                {getPlaylistCover(selectedPlaylist) ? (
                  <img
                    src={getPlaylistCover(selectedPlaylist)!}
                    alt={selectedPlaylist.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ListMusic className="w-12 h-12 text-emerald-400" />
                )}
              </div>
              <div className="min-w-0 space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{selectedPlaylist.name}</h2>
                <p className="text-xs text-neutral-300 leading-relaxed max-w-xl">
                  {selectedPlaylist.description || 'Playlist de la comunidad Flux'}
                </p>
                <div className="flex items-center gap-3 pt-1 text-xs text-neutral-500">
                  <span>{selectedPlaylist.tracks?.length || selectedPlaylist.trackIds?.length || 0} canciones</span>
                  {selectedPlaylist.ownerName && (
                    <>
                      <span>•</span>
                      <span>Por {selectedPlaylist.ownerName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => handleAddPlaylistToLibrary(selectedPlaylist)}
                disabled={addedPlaylistIds.has(selectedPlaylist.id)}
                className={`flex items-center gap-2 font-bold text-xs px-4 py-2.5 rounded-full transition-all border ${
                  addedPlaylistIds.has(selectedPlaylist.id)
                    ? 'bg-neutral-800 text-emerald-400 border-neutral-700'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700 shadow-md'
                }`}
              >
                {addedPlaylistIds.has(selectedPlaylist.id) ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Añadida a tu Biblioteca</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Añadir a mi Biblioteca</span>
                  </>
                )}
              </button>

              {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 && (
                <button
                  onClick={() => onPlayTrack(selectedPlaylist.tracks![0], selectedPlaylist.tracks!)}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs px-5 py-2.5 rounded-full shadow-lg shadow-emerald-500/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Reproducir</span>
                </button>
              )}
            </div>
          </div>

          <TrackList
            tracks={selectedPlaylist.tracks || []}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            onPlayTrack={onPlayTrack}
            onToggleFavorite={onToggleFavorite}
            emptyMessage="Esta playlist no contiene pistas públicas actualmente."
          />
        </div>
      ) : loading ? (
        /* Loading skeleton */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-neutral-900/40 rounded-2xl p-4 animate-pulse space-y-3">
              <div className="w-full aspect-square bg-neutral-800/80 rounded-xl"></div>
              <div className="h-4 bg-neutral-800/80 rounded w-3/4"></div>
              <div className="h-3 bg-neutral-800/80 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredPlaylists.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900/20 rounded-3xl border border-dashed border-neutral-800 space-y-3">
          <Compass className="w-12 h-12 text-neutral-600 mx-auto stroke-1" />
          <h3 className="text-sm font-bold text-neutral-300">No se encontraron playlists públicas</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Sé el primero en importar o crear una playlist para compartirla con la comunidad Flux.
          </p>
        </div>
      ) : (
        /* Public Playlists Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredPlaylists.map((playlist) => {
            const cover = getPlaylistCover(playlist);
            const isAdded = addedPlaylistIds.has(playlist.id);

            return (
              <div
                key={playlist.id}
                onClick={() => setSelectedPlaylist(playlist)}
                className="bg-neutral-900/40 hover:bg-neutral-800/70 border border-neutral-800/50 hover:border-neutral-700 rounded-2xl p-3.5 cursor-pointer transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="relative mb-3 w-full aspect-square rounded-xl bg-neutral-950 overflow-hidden shadow-xl flex items-center justify-center text-neutral-600 group-hover:scale-[1.02] transition-transform">
                    {cover ? (
                      <img
                        src={cover}
                        alt={playlist.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ListMusic className="w-12 h-12 text-neutral-700" />
                    )}

                    {/* Quick Play & Add overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {playlist.tracks && playlist.tracks.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayTrack(playlist.tracks![0], playlist.tracks!);
                          }}
                          className="p-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-full shadow-lg transition-transform hover:scale-110"
                          title="Reproducir playlist"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddPlaylistToLibrary(playlist);
                        }}
                        className={`p-3 rounded-full shadow-lg transition-transform hover:scale-110 ${
                          isAdded ? 'bg-neutral-800 text-emerald-400' : 'bg-neutral-900/90 text-white hover:text-emerald-400'
                        }`}
                        title={isAdded ? 'Añadida' : 'Añadir a mi biblioteca'}
                      >
                        {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                      {playlist.name}
                    </h3>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {playlist.description || 'Playlist pública'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-neutral-800/40 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>{playlist.tracks?.length || playlist.trackIds?.length || 0} canciones</span>
                  {playlist.sourceFormat && (
                    <span className="uppercase text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 tracking-wider">
                      {playlist.sourceFormat.includes('sp')
                        ? 'Spotify'
                        : playlist.sourceFormat.includes('yt')
                        ? 'YouTube'
                        : 'Custom'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
