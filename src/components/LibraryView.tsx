import React, { useState, useMemo } from 'react';
import { Music, Disc, User, Heart, Folder, Play } from 'lucide-react';
import { Track } from '../domain/types';
import { TrackList } from './TrackList';
import { FolderBrowserView } from './FolderBrowserView';

interface LibraryViewProps {
  tracks: Track[];
  currentTrackId?: string;
  isPlaying?: boolean;
  searchQuery: string;
  onPlayTrack: (track: Track, tracks: Track[]) => void;
  onToggleFavorite: (trackId: string) => void;
  onDeleteTrack: (trackId: string) => void;
}


const getCoverArt = (t: Track | undefined | null) => t ? (t.artworkUrl || (t.youtubeId ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` : null)) : null;

export const LibraryView: React.FC<LibraryViewProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  searchQuery,
  onPlayTrack,
  onToggleFavorite,
  onDeleteTrack,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'favorites' | 'folders' | 'artists' | 'albums'>('all');

  // Filtered tracks based on search query
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    const q = searchQuery.toLowerCase();
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.album && t.album.toLowerCase().includes(q))
    );
  }, [tracks, searchQuery]);

  const favorites = useMemo(() => filteredTracks.filter((t) => t.isFavorite), [filteredTracks]);

  // Group by Artists
  const artistsGrouped = useMemo(() => {
    const map = new Map<string, Track[]>();
    filteredTracks.forEach((track) => {
      const artist = track.artist || 'Artista Desconocido';
      if (!map.has(artist)) map.set(artist, []);
      map.get(artist)!.push(track);
    });
    return Array.from(map.entries());
  }, [filteredTracks]);

  // Group by Albums
  const albumsGrouped = useMemo(() => {
    const map = new Map<string, Track[]>();
    filteredTracks.forEach((track) => {
      const album = track.album || 'Sin Álbum';
      if (!map.has(album)) map.set(album, []);
      map.get(album)!.push(track);
    });
    return Array.from(map.entries());
  }, [filteredTracks]);

  return (
    <div className="flex flex-col md:flex-row gap-6 select-none h-full">
      {/* Stacked Vertical Tabs Navigation */}
      <div className="w-full md:w-60 shrink-0 flex flex-col gap-1.5 self-start">
        <button
          onClick={() => setActiveSubTab('all')}
          className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
            activeSubTab === 'all'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-500 hover:text-white hover:bg-neutral-900/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Music className="w-[18px] h-[18px]" strokeWidth={activeSubTab === 'all' ? 2.5 : 2} />
            <span>Todas las Canciones</span>
          </div>
          <span className="text-[11px] opacity-70">{filteredTracks.length}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('favorites')}
          className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
            activeSubTab === 'favorites'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-500 hover:text-white hover:bg-neutral-900/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Heart className={`w-[18px] h-[18px] ${activeSubTab === 'favorites' ? 'fill-current' : ''}`} strokeWidth={activeSubTab === 'favorites' ? 2.5 : 2} />
            <span>Favoritos</span>
          </div>
          <span className="text-[11px] opacity-70">{favorites.length}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('folders')}
          className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
            activeSubTab === 'folders'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-500 hover:text-white hover:bg-neutral-900/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Folder className="w-[18px] h-[18px]" strokeWidth={activeSubTab === 'folders' ? 2.5 : 2} />
            <span>Carpetas</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('artists')}
          className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
            activeSubTab === 'artists'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-500 hover:text-white hover:bg-neutral-900/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <User className="w-[18px] h-[18px]" strokeWidth={activeSubTab === 'artists' ? 2.5 : 2} />
            <span>Artistas</span>
          </div>
          <span className="text-[11px] opacity-70">{artistsGrouped.length}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('albums')}
          className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
            activeSubTab === 'albums'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-500 hover:text-white hover:bg-neutral-900/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Disc className="w-[18px] h-[18px]" strokeWidth={activeSubTab === 'albums' ? 2.5 : 2} />
            <span>Álbumes</span>
          </div>
          <span className="text-[11px] opacity-70">{albumsGrouped.length}</span>
        </button>
      </div>

      {/* Active Tab Content Display */}
      <div className="flex-1 min-w-0 h-full flex flex-col">
        {activeSubTab === 'all' && (
          <TrackList
            tracks={filteredTracks}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            onPlayTrack={onPlayTrack}
            onToggleFavorite={onToggleFavorite}
            onDeleteTrack={onDeleteTrack}
            emptyMessage="Tu biblioteca está vacía. Usa la opción 'Importar' para añadir tus canciones."
          />
        )}

        {activeSubTab === 'favorites' && (
          <TrackList
            tracks={favorites}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            onPlayTrack={onPlayTrack}
            onToggleFavorite={onToggleFavorite}
            onDeleteTrack={onDeleteTrack}
            emptyMessage="Aún no has marcado canciones como favoritas. Toca el corazón en cualquier pista."
          />
        )}

        {activeSubTab === 'folders' && (
          <FolderBrowserView
            tracks={filteredTracks}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            onPlayTrack={onPlayTrack}
            onToggleFavorite={onToggleFavorite}
          />
        )}

        {activeSubTab === 'artists' && (
          <div>
            {artistsGrouped.length === 0 ? (
              <p className="text-sm text-neutral-500 py-10 text-center font-medium">No hay artistas en la biblioteca.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {artistsGrouped.map(([artist, artistTracks]) => {
                  const firstWithArt = artistTracks.find((t) => getCoverArt(t));
                  return (
                    <div key={artist} className="bg-transparent hover:bg-neutral-900/40 rounded-2xl p-4 transition-all group flex flex-col items-center text-center">
                      <div className="relative mb-4 w-32 h-32 rounded-full overflow-hidden shadow-2xl">
                        {getCoverArt(firstWithArt!) ? (
                          <img src={getCoverArt(firstWithArt!)!} alt={artist} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-neutral-900 flex items-center justify-center font-bold text-neutral-600 text-4xl group-hover:bg-neutral-800 transition-colors">
                            {artist.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayTrack(artistTracks[0], artistTracks);
                          }}
                          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-emerald-500 hover:scale-105 text-black flex items-center justify-center shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                          title={`Reproducir canciones de ${artist}`}
                        >
                          <Play className="w-5 h-5 fill-current ml-1" />
                        </button>
                      </div>
                      <h3 className="text-base font-bold text-white truncate w-full">{artist}</h3>
                      <p className="text-xs text-neutral-400 mt-1">{artistTracks.length} canciones</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'albums' && (
          <div>
            {albumsGrouped.length === 0 ? (
              <p className="text-sm text-neutral-500 py-10 text-center font-medium">No hay álbumes en la biblioteca.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {albumsGrouped.map(([album, albumTracks]) => {
                  const firstWithArt = albumTracks.find((t) => getCoverArt(t));
                  return (
                    <div key={album} className="bg-transparent hover:bg-neutral-900/40 rounded-2xl p-4 transition-all group flex flex-col items-start">
                      <div className="relative mb-4 w-full aspect-square rounded-xl overflow-hidden shadow-2xl">
                        {getCoverArt(firstWithArt!) ? (
                          <img src={getCoverArt(firstWithArt!)!} alt={album} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-800 transition-colors">
                            <Disc className="w-12 h-12" />
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayTrack(albumTracks[0], albumTracks);
                          }}
                          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-emerald-500 hover:scale-105 text-black flex items-center justify-center shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                          title={`Reproducir álbum ${album}`}
                        >
                          <Play className="w-5 h-5 fill-current ml-1" />
                        </button>
                      </div>
                      <h3 className="text-sm font-bold text-white truncate w-full">{album}</h3>
                      <p className="text-xs text-neutral-400 mt-1 truncate w-full">{albumTracks.length > 0 ? albumTracks[0].artist : 'Varios'}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
