import React from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, 
  Volume2, VolumeX, Maximize2, Heart, Music, Download
} from 'lucide-react';


import { PlaybackState, Track } from '../domain/types';
export const getCoverArt = (t: Track | undefined | null) => t ? (t.artworkUrl || (t.youtubeId ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` : null)) : null;
import { downloadTrackAsMp3 } from '../utils/downloadHelper';

interface NowPlayingBarProps {
  playbackState: PlaybackState;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onSetVolume: (volume: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite: (trackId: string) => void;
  onOpenFullScreen: () => void;
}

export const NowPlayingBar: React.FC<NowPlayingBarProps> = ({
  playbackState,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onSetVolume,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
  onOpenFullScreen,
}) => {
  const { currentTrack, isPlaying, currentTime, duration, volume, isMuted, isShuffle, repeatMode } = playbackState;

  if (!currentTrack) {
    return null;
  }

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <>
      {/* MOBILE MINI PLAYER (Floating card above mobile navigation) */}
      <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-2 right-2 z-40 sm:hidden bg-[#1C1C1E]/95 border border-white/5 rounded-[16px] p-2 shadow-2xl backdrop-blur-xl select-none">
        {/* Top Progress Line */}
        <div 
          className="absolute top-0 left-2 right-2 h-[2px] bg-neutral-800 rounded-full overflow-hidden cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            onSeek(clickPos * duration);
          }}
        >
          <div 
            className="h-full bg-white transition-all rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1.5 pb-0.5 px-1">
          {/* Left: Artwork + Title + Artist */}
          <div 
            onClick={onOpenFullScreen}
            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer active:opacity-70"
          >
            <div className="w-10 h-10 rounded-md bg-neutral-900 overflow-hidden shrink-0 shadow-sm relative">
              {getCoverArt(currentTrack) ? (
                <img src={getCoverArt(currentTrack)} alt={currentTrack.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                  <Music className="w-4 h-4 text-neutral-500" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-white truncate leading-tight">
                {currentTrack.title}
              </h4>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Right: Controls (Play/Pause, Next) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleFavorite(currentTrack.id)}
              className={`p-2 rounded-full transition-colors ${
                currentTrack.isFavorite ? 'text-rose-500' : 'text-neutral-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${currentTrack.isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={onPlayPause}
              className="p-2 text-white active:scale-95 transition-transform"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP NOW PLAYING BAR */}
      <div className="hidden sm:flex fixed bottom-0 left-0 right-0 z-40 bg-black/85 backdrop-blur-3xl border-t border-white/5 px-6 py-4 text-white shadow-[0_-20px_40px_rgba(0,0,0,0.8)] select-none">
        {/* Top progress bar */}
        <div 
          className="absolute -top-[1px] left-0 right-0 h-1 bg-transparent cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            onSeek(clickPos * duration);
          }}
        >
          <div 
            className="h-full bg-white group-hover:bg-emerald-400 transition-colors"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-4 w-full">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 w-1/4">
            <div 
              onClick={onOpenFullScreen}
              className="w-14 h-14 rounded-md bg-neutral-900 border border-neutral-800 overflow-hidden shrink-0 cursor-pointer group relative shadow-md"
            >
              {getCoverArt(currentTrack) ? (
                <img src={getCoverArt(currentTrack)} alt={currentTrack.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                  <Music className="w-5 h-5 text-neutral-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h4 
                onClick={onOpenFullScreen}
                className="text-sm font-semibold text-white truncate cursor-pointer hover:underline"
              >
                {currentTrack.title}
              </h4>
              <p className="text-xs text-neutral-400 truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>

            <button
              onClick={() => onToggleFavorite(currentTrack.id)}
              className={`p-1.5 rounded-full hover:bg-neutral-800/60 transition-colors ${
                currentTrack.isFavorite ? 'text-rose-500' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center gap-1.5 flex-1 max-w-md">
            <div className="flex items-center gap-5">
              <button
                onClick={onToggleShuffle}
                className={`p-1.5 rounded-full transition-colors ${
                  isShuffle ? 'text-emerald-400 font-bold' : 'text-neutral-500 hover:text-white'
                }`}
                title="Modo Aleatorio"
              >
                <Shuffle className="w-[18px] h-[18px]" />
              </button>

              <button
                onClick={onPrevious}
                className="p-1.5 text-neutral-300 hover:text-white transition-colors"
                title="Anterior"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={onPlayPause}
                className="w-10 h-10 rounded-full bg-white hover:scale-105 text-black flex items-center justify-center transition-transform active:scale-95"
                title={isPlaying ? 'Pausa' : 'Reproducir'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
              </button>

              <button
                onClick={onNext}
                className="p-1.5 text-neutral-300 hover:text-white transition-colors"
                title="Siguiente"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`p-1.5 rounded-full transition-colors relative ${
                  repeatMode !== 'off' ? 'text-emerald-400 font-bold' : 'text-neutral-500 hover:text-white'
                }`}
                title={`Repetir: ${repeatMode}`}
              >
                <Repeat className="w-[18px] h-[18px]" />
                {repeatMode === 'one' && <span className="text-[9px] absolute -top-1 -right-0.5 font-bold">1</span>}
              </button>
            </div>

            <div className="w-full flex items-center gap-2 text-[11px] text-neutral-400 font-medium">
              <span className="w-10 text-right">{formatTime(currentTime)}</span>
              <div 
                className="flex-1 h-1 bg-neutral-800 rounded-full cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickPos = (e.clientX - rect.left) / rect.width;
                  onSeek(clickPos * duration);
                }}
              >
                <div 
                  className="h-full bg-white group-hover:bg-emerald-400 rounded-full relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-sm transition-opacity" />
                </div>
              </div>
              <span className="w-10 text-left">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume & Fullscreen Toggle */}
          <div className="flex items-center justify-end gap-3 w-1/4">
            <div className="flex items-center gap-2">
              <button onClick={onToggleMute} className="text-neutral-400 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            <button
              onClick={onOpenFullScreen}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800/60 rounded-full transition-colors"
              title="Pantalla Completa"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
