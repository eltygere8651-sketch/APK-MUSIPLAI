import React, { useState } from 'react';
import { ListMusic, Plus, Trash2, Play, Music, Sparkles, Download } from 'lucide-react';
import { Playlist, Track } from '../domain/types';
import { TrackList } from './TrackList';
import { downloadPlaylistAsMp3 } from '../utils/downloadHelper';

interface PlaylistViewProps {
  playlists: Playlist[];
  allTracks: Track[];
  currentTrackId?: string;
  isPlaying?: boolean;
  onCreatePlaylist: (name: string, description?: string) => void;
  onDeletePlaylist: (id: string) => void;
  onPlayTrack: (track: Track, tracks: Track[]) => void;
  onToggleFavorite: (trackId: string) => void;
  onClose?: () => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlists,
  allTracks,
  currentTrackId,
  isPlaying,
  onCreatePlaylist,
  onDeletePlaylist,
  onPlayTrack,
  onToggleFavorite,
  onClose,
}) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  const playlistTracks = selectedPlaylist
    ? allTracks.filter((t) => selectedPlaylist.trackIds.includes(t.id))
    : [];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    onCreatePlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreating(false);
  };

  return (
    <div className="space-y-6 select-none h-full flex flex-col">
      {/* Mobile Sticky Header (Grid View) */}
      {!selectedPlaylistId && (
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
          <span className="text-sm font-bold text-white">Listas ({playlists.length})</span>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center w-8 h-8 bg-white text-black rounded-full transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between hidden sm:flex">
        <div className="flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Listas de Reproducción ({playlists.length})</h2>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs px-3.5 py-1.5 rounded-full transition-all shadow-md shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Playlist</span>
        </button>
      </div>

      {/* New Playlist Form Modal / Banner */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-white">Crear Nueva Playlist</h3>
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="Nombre de la playlist..."
            className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-500 text-neutral-950 rounded-lg text-xs font-bold hover:bg-emerald-400"
            >
              Guardar Playlist
            </button>
          </div>
        </form>
      )}

      {/* Playlists Grid */}
      {playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-neutral-900/10 rounded-3xl border border-dashed border-neutral-800">
          <ListMusic className="w-12 h-12 text-neutral-600 mb-3 stroke-1" />
          <h3 className="text-sm font-semibold text-neutral-300 mb-1">Sin Playlists Creadas</h3>
          <p className="text-xs text-neutral-500 max-w-sm">
            Crea una playlist personalizada o importa listas en formatos M3U/PLS desde la pestaña de importación.
          </p>
        </div>
      ) : !selectedPlaylistId ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => setSelectedPlaylistId(playlist.id)}
              className="bg-transparent hover:bg-neutral-900/40 rounded-2xl p-4 cursor-pointer transition-all group relative flex flex-col items-start"
            >
              <div className="relative mb-4 w-full aspect-square rounded-xl bg-neutral-900 overflow-hidden shadow-2xl flex items-center justify-center text-neutral-700 group-hover:bg-neutral-800 transition-colors">
                <ListMusic className="w-12 h-12" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePlaylist(playlist.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-neutral-400 hover:text-rose-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="min-w-0 w-full">
                <h3 className="text-sm font-bold text-white truncate">{playlist.name}</h3>
                <p className="text-xs text-neutral-400 mt-1">{playlist.trackIds.length} canciones</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Selected Playlist Details */
        <div className="space-y-4">
          <div className="sticky top-[env(safe-area-inset-top)] z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 sm:py-0 bg-black/90 sm:bg-transparent backdrop-blur-md border-b border-neutral-800/50 sm:border-none flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedPlaylistId(null)}
              className="flex items-center gap-2 text-sm font-bold text-white hover:text-emerald-400 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </div>
              <span className="hidden sm:inline">Volver</span>
            </button>
            <span className="sm:hidden text-sm font-bold truncate max-w-[200px]">{selectedPlaylist.name}</span>
            <div className="w-8 sm:hidden"></div>
          </div>

          <div className="p-5 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-emerald-950/40 border border-neutral-800/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 text-neutral-950 flex items-center justify-center font-bold">
                <ListMusic className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{selectedPlaylist.name}</h2>
                <p className="text-xs text-neutral-400">{playlistTracks.length} canciones en la lista</p>
              </div>
            </div>

            {playlistTracks.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPlayTrack(playlistTracks[0], playlistTracks)}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs px-5 py-2.5 rounded-full shadow-lg shadow-emerald-500/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Reproducir Todo</span>
                </button>
              </div>
            )}
          </div>

          <TrackList
            tracks={playlistTracks}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            onPlayTrack={onPlayTrack}
            onToggleFavorite={onToggleFavorite}
            emptyMessage="Esta playlist no contiene pistas. Añade canciones desde tu biblioteca o importa un archivo M3U."
          />
        </div>
      )}
    </div>
  );
};
