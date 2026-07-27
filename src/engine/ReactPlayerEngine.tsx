import React from 'react';
import ReactPlayer from 'react-player';
import { PlaybackEngine, PlaybackState, EngineEvent } from './types';

export class ReactPlayerEngine implements PlaybackEngine {
  private listeners: Record<string, Function[]> = {};
  private state: PlaybackState = {
    status: 'IDLE', position: 0, duration: 0, volume: 1, playbackRate: 1
  };
  private context: any = null;

  async load(options: { url: string; title?: string; artist?: string; coverUrl?: string; position?: number }) {
    // ReactPlayer loads automatically when url changes in context
  }
  async play() { 
    // Handled by parent component state for now
  }
  async pause() { 
    // Handled by parent component state for now
  }
  async resume() { }
  async stop() { }
  async seek(options: { position: number }) { 
    if (this.context && this.context.youtubePlayerRef && this.context.youtubePlayerRef.current) {
      this.context.youtubePlayerRef.current.seekTo(options.position / 1000, "seconds");
    }
  }
  async next() { }
  async previous() { }
  async setQueue(options: { items: any[] }) { }
  async setVolume(volume: number) { }
  async setPlaybackRate(rate: number) { }
  async destroy() { }
  
  getState(): PlaybackState { return this.state; }
  
  on(event: EngineEvent, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  
  off(event: EngineEvent, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  render(context?: any): React.ReactNode {
    this.context = context;
    if (!context) return null;
    return <ReactPlayerWrapper context={context} />;
  }
}

const ReactPlayerWrapper = ({ context }: { context: any }) => {
  return (
    <ReactPlayer
      ref={context.youtubePlayerRef}
      url={context.currentUrl}
      playing={context.isPlaying}
      volume={context.isDucking ? (context.volume / 100) * 0.15 : (context.volume / 100)}
      progressInterval={1000}
      onError={async (e: any) => {
        console.warn("ReactPlayer Error:", e);
        context.consecutiveErrorsRef.current += 1;
        if (context.consecutiveErrorsRef.current > 4) {
          console.warn("Too many consecutive playback errors. Pausing playback to prevent infinite loop.");
          context.setIsPlaying?.(false);
          context.consecutiveErrorsRef.current = 0;
          return;
        }
        console.warn("Unplayable track detected (copyright, regional block, or deleted). Auto-skipping...");
        setTimeout(() => {
          if (context.handleNextRef.current) {
            context.handleNextRef.current(true);
          }
        }, 1500);
      }}
      onReady={(player: any) => {
        context.registerMediaSession();
        context.enforceActionHandlers();
        if (
          context.pendingSeekPosRef.current !== null &&
          context.pendingSeekPosRef.current > 0
        ) {
          context.youtubePlayerRef.current?.seekTo(
            context.pendingSeekPosRef.current,
            "seconds",
          );
        }
        if (context.initialLoadRef.current) {
          context.initialLoadRef.current = false;
        }
      }}
      onBuffer={() => {
        context.isBufferingRef.current = true;
      }}
      onBufferEnd={() => {
        context.isBufferingRef.current = false;
        if (context.expectedPlayingRef.current && context.youtubePlayerRef.current) {
          try {
            const intPlayer = context.youtubePlayerRef.current.getInternalPlayer();
            if (intPlayer) {
              if (typeof intPlayer.playVideo === "function") {
                intPlayer.playVideo();
              } else if (typeof intPlayer.play === "function") {
                intPlayer.play();
              }
            }
          } catch (e) {}
        }
      }}
      onPlay={() => {
        context.isBufferingRef.current = false;
        context.wasUnexpectedlyPausedRef.current = false;
        context.consecutiveErrorsRef.current = 0;
        context.setIsPlaying?.(true);
        context.enforceActionHandlers();
        context.registerMediaSession();
        try {
          if (context.youtubePlayerRef.current) {
            const intPlayer = context.youtubePlayerRef.current.getInternalPlayer();
            try {
              intPlayer.unMute();
            } catch (e) {}
            setTimeout(() => {
              if (context.fallbackSilentAudioRef.current && context.fallbackSilentAudioRef.current.paused) {
                context.fallbackSilentAudioRef.current.play().catch(() => {});
              }
              context.enforceActionHandlers();
              context.registerMediaSession(true);
            }, 500);
          }
        } catch (e) {}
      }}
      onPause={() => {
        if (context.expectedPlayingRef.current) {
          context.wasUnexpectedlyPausedRef.current = true;
          if (context.fallbackSilentAudioRef.current && context.fallbackSilentAudioRef.current.paused) {
            context.fallbackSilentAudioRef.current.play().catch(() => {});
          }
          if (
            context.expectedPlayingRef.current &&
            context.youtubePlayerRef.current &&
            !context.isBufferingRef.current
          ) {
            try {
              const intPlayer = context.youtubePlayerRef.current.getInternalPlayer();
              if (intPlayer) {
                if (typeof intPlayer.playVideo === "function") {
                  intPlayer.playVideo();
                } else if (typeof intPlayer.play === "function") {
                  intPlayer.play();
                }
              }
            } catch (e) {}
            setTimeout(() => {
                context.enforceActionHandlers();
                context.registerMediaSession();
            }, 500);
          }
          return;
        }
        context.setIsPlaying?.(false);
      }}
      onEnded={() => {
        if (!context.hasEarlySkippedRef.current) {
          context.handleNextRef.current(true);
        }
      }}
      onProgress={(state: any) => {
        try {
          const intPlayer = context.youtubePlayerRef.current?.getInternalPlayer();
          if (intPlayer && typeof intPlayer.getVideoData === "function") {
            const currentVideoData = intPlayer.getVideoData();
            let expectedVideoId = null;
            try {
               expectedVideoId = new URL(context.currentUrl.replace("music.youtube.com", "www.youtube.com")).searchParams.get("v");
            } catch(e) {}
            
            if (currentVideoData?.video_id && expectedVideoId && currentVideoData.video_id !== expectedVideoId) {
              if (context.hasEarlySkippedRef.current) return;
              if (Date.now() - context.lastSkipTimeRef.current < 3000) return;
              
              const actualVideoId = currentVideoData.video_id;
              const getVidId = (u: string) => { try { return new URL((u || "").replace("music.youtube.com", "www.youtube.com")).searchParams.get("v"); } catch { return null; } };
              
              if (context.trackQueueRef.current.length > 0 && getVidId(context.trackQueueRef.current[0].url) === actualVideoId) {
                 context.handleNextRef.current();
                 return;
              }
              
              const nextIndex = context.displayTracks.findIndex((t: any) => getVidId(t.url) === actualVideoId);
              
              if (nextIndex !== -1 && nextIndex !== context.currentTrackIndex) {
                 context.setCurrentTrackIndex(nextIndex);
                 return;
              }
            }
          }
        } catch (e) {}
        
        if (
          context.pendingSeekPosRef.current !== null &&
          context.pendingSeekPosRef.current > 0
        ) {
          if (Math.abs(state.playedSeconds - context.pendingSeekPosRef.current) > 2 && state.playedSeconds < context.pendingSeekPosRef.current) {
            context.youtubePlayerRef.current?.seekTo(
              context.pendingSeekPosRef.current,
              "seconds",
            );
            return;
          } else {
            context.pendingSeekPosRef.current = null;
          }
        }
        
        const currentPosMs = state.playedSeconds * 1000;
        if (document.visibilityState === "visible") {
          context.setPosition(currentPosMs);
        }
        
        if (
          currentPosMs > 0 &&
          Math.abs(currentPosMs - (context.positionRef.current || 0)) > 5000
        ) {
          context.positionRef.current = currentPosMs;
          localStorage.setItem(
            `mix-player-position`,
            JSON.stringify({
              url: context.currentUrl,
              position: currentPosMs,
              timestamp: Date.now(),
            }),
          );
        }
        
        if (context.duration && context.duration > 0 && (context.duration - currentPosMs) < 2000) {
          const expectedTitle = context.displayTracks[context.currentTrackIndex]?.title || "";
          if (expectedTitle && (expectedTitle.toLowerCase().includes("mix") || expectedTitle.toLowerCase().includes("session"))) {
            if (!context.hasEarlySkippedRef.current) {
              context.hasEarlySkippedRef.current = true;
              context.lastSkipTimeRef.current = Date.now();
              const timeUntilSkip = Math.max(0, context.duration - currentPosMs);
              setTimeout(() => {
                if (context.expectedPlayingRef.current) {
                  context.handleNextRef.current(true);
                }
              }, timeUntilSkip);
            }
          } else {
            if (!context.hasEarlySkippedRef.current) {
              context.hasEarlySkippedRef.current = true;
              context.lastSkipTimeRef.current = Date.now();
              const msUntilSkip = Math.max(0, context.duration - currentPosMs);
              setTimeout(() => {
                if (context.expectedPlayingRef.current) {
                  context.handleNextRef.current(true);
                }
              }, msUntilSkip);
            }
          }
        }
      }}
      onDuration={(dur: any) => {
        if (document.visibilityState === "visible" || context.duration === 0) {
          context.setDuration(dur * 1000);
        }
      }}
      config={context.reactPlayerConfig}
      width="300px"
      height="300px"
    />
  );
};
