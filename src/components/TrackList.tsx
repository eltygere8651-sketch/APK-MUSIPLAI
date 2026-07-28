import React, { memo } from 'react';
import { Play, Heart, Trash2, Music } from 'lucide-react';
import { Track } from '../domain/types';
import { List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';

interface TrackListProps {
  tracks: Track[];
  currentTrackId?: string;
  isPlaying?: boolean;
  onPlayTrack: (track: Track, tracks: Track[]) => void;
  onToggleFavorite: (trackId: string) => void;
  onDeleteTrack?: (trackId: string) => void;
  emptyMessage?: string;
}

const getCoverArt = (t: Track | undefined | null) => t ? (t.artworkUrl || (t.youtubeId ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` : null)) : null;

const formatDuration = (secs: number) => {
  if (!secs || isNaN(secs) || !isFinite(secs)) return '--:--';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// Memoize the row component to prevent unnecessary re-renders
const TrackRow = memo(({ index, style, ...data }: { index: number; style: React.CSSProperties; [key: string]: any }) => {
  const { tracks, currentTrackId, isPlaying, onPlayTrack, onToggleFavorite, onDeleteTrack, ariaAttributes } = data;
  const track = tracks[index];
  const isCurrent = track.id === currentTrackId;

  return (
    <div style={style} {...ariaAttributes}>
      <div
        onClick={() => onPlayTrack(track, tracks)}
        className={`group flex items-center justify-between px-4 h-full rounded-xl cursor-pointer transition-colors ${
          isCurrent
            ? 'bg-neutral-900'
            : 'bg-transparent hover:bg-neutral-900/60'
        }`}
      >
        {/* Left: Track Index & Title/Artist */}
        <div className="flex items-center gap-4 min-w-0 flex-1 h-full">
          <div className="w-6 flex justify-center text-xs font-semibold text-neutral-500 group-hover:hidden">
            {isCurrent && isPlaying ? (
              <div className="flex items-center justify-center gap-[3px] h-3">
                <span className="w-[3px] h-full bg-emerald-400 animate-pulse rounded-full" />
                <span className="w-[3px] h-2/3 bg-emerald-400 animate-pulse delay-75 rounded-full" />
                <span className="w-[3px] h-full bg-emerald-400 animate-pulse delay-150 rounded-full" />
              </div>
            ) : (
              index + 1
            )}
          </div>
          <div className="w-6 text-center text-xs text-neutral-300 hidden group-hover:block">
            <Play className="w-4 h-4 fill-current text-white mx-auto" />
          </div>
          {/* Artwork or placeholder */}
          <div className="w-10 h-10 rounded-md bg-neutral-900 overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
            {getCoverArt(track) ? (
              <img src={getCoverArt(track)!} alt={track.title} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                <Music className="w-4 h-4 text-neutral-500" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className={`text-sm font-semibold truncate ${isCurrent ? 'text-emerald-400' : 'text-white'}`}>
              {track.title}
            </h4>
            <p className="text-xs text-neutral-400 truncate mt-0.5">
              {track.artist} {track.album ? `• ${track.album}` : ''}
            </p>
          </div>
        </div>
        {/* Right: Duration, Download, Favorite & Delete Actions */}
        <div className="flex items-center gap-3 h-full">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(track.id);
            }}
            className={`p-1.5 transition-colors ${
              track.isFavorite ? 'text-emerald-400' : 'text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100'
            }`}
            title="Favorito"
          >
            <Heart className={`w-[18px] h-[18px] ${track.isFavorite ? 'fill-current' : ''}`} />
          </button>
          {onDeleteTrack && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTrack(track.id);
              }}
              className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Eliminar de la biblioteca"
            >
              <Trash2 className="w-[18px] h-[18px]" />
            </button>
          )}
          <span className="text-xs text-neutral-500 font-medium ml-2 w-10 text-right">
            {formatDuration(track.duration)}
          </span>
        </div>
      </div>
    </div>
  );
});

export const TrackList: React.FC<TrackListProps> = memo(({
  tracks,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  onToggleFavorite,
  onDeleteTrack,
  emptyMessage = 'No hay pistas disponibles en esta sección.',
}) => {
  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-neutral-900/30 rounded-2xl border border-neutral-800/40">
        <Music className="w-12 h-12 text-neutral-600 mb-3 stroke-1" />
        <p className="text-sm font-medium text-neutral-400">{emptyMessage}</p>
      </div>
    );
  }

  const itemData = {
    tracks,
    currentTrackId,
    isPlaying,
    onPlayTrack,
    onToggleFavorite,
    onDeleteTrack
  };

  return (
    <div className="w-full h-full min-h-[400px] flex-1 select-none pb-8">
      <AutoSizer
        renderProp={({ height, width }) => (
          <List
            style={{ height: height || 400, width: width || '100%' }}
            rowCount={tracks.length}
            rowHeight={60}
            rowProps={itemData}
            rowComponent={TrackRow}
            overscanCount={5}
          />
        )}
      />
    </div>
  );
});
