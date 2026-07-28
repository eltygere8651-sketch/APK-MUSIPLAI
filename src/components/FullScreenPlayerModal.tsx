import React from 'react';
import { 
  X, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, 
  Volume2, VolumeX, Heart, Music, ListMusic, Download 
} from 'lucide-react';
import { PlaybackState, Track } from '../domain/types';
import { downloadTrackAsMp3 } from '../utils/downloadHelper';
import { audioEngine } from '../domain/audio/AudioEngine';

const VideoView = ({ track, isOpen, activeTab }: { track: Track; isOpen: boolean; activeTab: string }) => {
  const videoContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen || activeTab !== 'video' || !videoContainerRef.current) {
      audioEngine.hideYoutubeVideo();
      return;
    }

    const updatePosition = () => {
      if (videoContainerRef.current && isOpen && activeTab === 'video') {
        const rect = videoContainerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          audioEngine.showYoutubeVideoInRect({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            zIndex: 60,
          });
        }
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    const timer = setInterval(updatePosition, 200);

    return () => {
      window.removeEventListener('resize', updatePosition);
      clearInterval(timer);
      audioEngine.hideYoutubeVideo();
    };
  }, [isOpen, activeTab, track.id]);

  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full h-full px-2 md:px-4 py-2">
      <div className="w-full text-center mb-3 shrink-0">
        <h3 className="text-lg font-bold text-white truncate">{track.title}</h3>
        <p className="text-xs text-neutral-400">{track.artist}</p>
      </div>
      <div 
        ref={videoContainerRef} 
        className="w-full flex-1 max-h-[65vh] min-h-[220px] aspect-video rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-4 text-center"
      >
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs text-neutral-400 font-medium">Sincronizando vídeo oficial...</span>
      </div>
    </div>
  );
};

export const getCoverArt = (t: Track | undefined | null) => t ? (t.artworkUrl || (t.youtubeId ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` : null)) : null;

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  playbackState: PlaybackState;
  queue: Track[];
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onSetVolume: (volume: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite: (trackId: string) => void;
  onPlayTrackFromQueue: (track: Track) => void;
}

export const FullScreenPlayerModal: React.FC<FullScreenPlayerProps> = ({
  isOpen,
  onClose,
  playbackState,
  queue,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onSetVolume,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
  onPlayTrackFromQueue,
}) => {
  const [activeTab, setActiveTab] = React.useState<'player' | 'queue' | 'video'>('player');

  const { currentTrack, isPlaying, currentTime, duration, volume, isMuted, isShuffle, repeatMode } = playbackState;

  const youtubeId = currentTrack ? (currentTrack.youtubeId || (currentTrack.id.startsWith('yt_') ? currentTrack.id.split('_')[1] : null)) : null;
  const hasVideo = Boolean(youtubeId || currentTrack?.sourceType === 'youtube');

  React.useEffect(() => {
    if (!hasVideo && activeTab === 'video') {
      setActiveTab('player');
    }
  }, [hasVideo, activeTab]);

  if (!isOpen || !playbackState.currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black text-white flex flex-col p-4 md:p-6 overflow-hidden animate-fade-in select-none">
      {/* Background Blur Artwork Accent */}
      {getCoverArt(currentTrack) ? (
        <div 
          className="absolute inset-0 opacity-40 blur-[100px] scale-150 bg-cover bg-center pointer-events-none transition-all duration-1000"
          style={{ backgroundImage: `url(${getCoverArt(currentTrack)})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-black pointer-events-none" />
      )}
      
      {/* Dark overlay to ensure text is always readable */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all hover:scale-105"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-full">
          <button
            onClick={() => setActiveTab('player')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
              activeTab === 'player' ? 'bg-white text-black shadow-md' : 'text-neutral-300 hover:text-white'
            }`}
          >
            Reproductor
          </button>
          {hasVideo && (
            <button
              onClick={() => setActiveTab('video')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                activeTab === 'video' ? 'bg-white text-black shadow-md' : 'text-neutral-300 hover:text-white'
              }`}
            >
              Vídeo
            </button>
          )}
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
              activeTab === 'queue' ? 'bg-white text-black shadow-md' : 'text-neutral-300 hover:text-white'
            }`}
          >
            Cola
          </button>
        </div>

        <button
          onClick={() => onToggleFavorite(currentTrack.id)}
          className={`p-3 rounded-full bg-black/40 backdrop-blur-md transition-all hover:scale-110 active:scale-90 ${
            currentTrack.isFavorite ? 'text-rose-500' : 'text-white/80 hover:text-white'
          }`}
          title={currentTrack.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart className={`w-5 h-5 ${currentTrack.isFavorite ? 'fill-current text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'player' ? (
        <div className="relative z-10 flex-1 flex flex-col lg:flex-row lg:max-w-5xl lg:gap-24 items-center justify-between max-w-[420px] mx-auto w-full pb-2 md:pb-8 lg:px-12">
          {/* Large Album Artwork */}
          <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center mb-4 mt-1 lg:mb-0 lg:w-1/2 lg:flex-none">
            <div className="h-full w-full max-w-[360px] lg:max-w-[480px] lg:max-h-[480px] max-h-[50vh] min-h-[200px] aspect-square rounded-2xl md:rounded-[32px] bg-neutral-900 overflow-hidden shadow-2xl relative group">
              {getCoverArt(currentTrack) ? (
                <img src={getCoverArt(currentTrack)} alt={currentTrack.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-neutral-600 p-6 text-center">
                  <Music className="w-24 h-24 mb-4 text-neutral-700" />
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full shrink-0 lg:w-1/2 lg:flex-none lg:flex lg:flex-col lg:justify-center lg:px-4">

          {/* Track Info & Quick Actions */}
          <div className="flex items-center justify-between w-full mb-4 px-2">
            <div className="min-w-0 flex-1 pr-4">
              <h2 className="text-2xl font-bold text-white truncate mb-1">
                {currentTrack.title}
              </h2>
              <p className="text-base font-medium text-neutral-400 truncate">
                {currentTrack.artist}
              </p>
            </div>
            <button
              onClick={() => onToggleFavorite(currentTrack.id)}
              className={`p-3 rounded-full transition-all hover:scale-110 active:scale-95 ${
                currentTrack.isFavorite ? 'text-rose-500 bg-rose-500/10' : 'text-neutral-400 hover:text-white bg-white/5'
              }`}
              title={currentTrack.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              <Heart className={`w-6 h-6 ${currentTrack.isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Progress Slider */}
          <div className="w-full mb-6 px-2">
            <div 
              className="w-full h-2 bg-white/20 rounded-full cursor-pointer group relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickPos = (e.clientX - rect.left) / rect.width;
                onSeek(clickPos * duration);
              }}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-white rounded-full transition-all"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-opacity" />
              </div>
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-neutral-400 mt-3 tracking-wide">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Player Buttons */}
          <div className="flex items-center justify-between w-full px-4 mb-4">
            <button
              onClick={onToggleShuffle}
              className={`p-2 transition-colors ${
                isShuffle ? 'text-emerald-400 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-6 h-6" />
            </button>

            <button onClick={onPrevious} className="p-2 text-white hover:scale-110 transition-transform">
              <SkipBack className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
            </button>

            <button
              onClick={onPlayPause}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-current" /> : <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1 sm:ml-2" />}
            </button>

            <button onClick={onNext} className="p-2 text-white hover:scale-110 transition-transform">
              <SkipForward className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
            </button>

            <button
              onClick={onToggleRepeat}
              className={`p-2 transition-colors relative ${
                repeatMode !== 'off' ? 'text-emerald-400 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Repeat className="w-6 h-6" />
              {repeatMode === 'one' && <span className="text-[10px] absolute -top-1 -right-1 font-bold">1</span>}
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-4 w-full px-4 mt-auto">
            <button onClick={onToggleMute} className="text-neutral-400 hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-neutral-400" /> : <Volume2 className="w-5 h-5 text-neutral-400" />}
            </button>
            <div className="flex-1 h-2 bg-white/20 rounded-full cursor-pointer relative group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickPos = (e.clientX - rect.left) / rect.width;
                onSetVolume(clickPos);
              }}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-white rounded-full transition-all"
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              />
            </div>
          </div>
        </div>
        </div>
      ) : activeTab === 'video' ? (
        <VideoView track={currentTrack} isOpen={isOpen} activeTab={activeTab} />
      ) : (
        /* Queue View */
        <div className="relative z-10 flex-1 overflow-y-auto max-w-2xl mx-auto w-full pr-2 space-y-2">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
            A continuación en la cola ({queue.length} pistas)
          </h3>
          {queue.map((track, idx) => {
            const isCurrent = track.id === currentTrack.id;
            return (
              <div
                key={`${track.id}_${idx}`}
                onClick={() => onPlayTrackFromQueue(track)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                  isCurrent
                    ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300 font-medium'
                    : 'bg-neutral-900/40 border-neutral-800/40 text-neutral-300 hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-semibold text-neutral-500 w-6 text-center">{idx + 1}</span>
                  {getCoverArt(track) ? (
                    <img src={getCoverArt(track)!} alt={track.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Music className="w-4 h-4 text-neutral-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{track.title}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{track.artist}</p>
                  </div>
                </div>
                {isCurrent && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    REPRODUCIENDO
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
