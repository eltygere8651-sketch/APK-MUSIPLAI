import React, { useEffect, useRef } from 'react';
import { PlaybackEngine, PlaybackState, EngineEvent } from './types';
import { NativeAudio } from '../plugins/NativeAudio';
import { diagnostics } from './NativeAudioDiagnostics';

export class NativeAudioEngine implements PlaybackEngine {
  private listeners: Record<string, Function[]> = {};
  private state: PlaybackState = {
    status: 'IDLE',
    position: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1
  };
  private nativeListeners: any[] = [];
  public context: any = null;

  constructor() {
    this.setupListeners();
    diagnostics.logEvent('NativeAudioEngine initialized');
  }

  private async setupListeners() {
    this.nativeListeners.push(
      await NativeAudio.addListener('onStateChanged', (info: any) => {
        this.state.status = info.status;
        diagnostics.updateState(info.status);
        this.emit('STATE_CHANGED', this.state);
        
        if (info.status === 'PLAYING') this.emit('PLAYING', this.state);
        if (info.status === 'PAUSED') this.emit('PAUSED', this.state);
        if (info.status === 'STOPPED') this.emit('STOPPED', this.state);
      })
    );
    this.nativeListeners.push(
      await NativeAudio.addListener('onProgress', (info: any) => {
        this.state.position = info.position;
        this.state.duration = info.duration;
        this.emit('PROGRESS', this.state);
      })
    );
    this.nativeListeners.push(
      await NativeAudio.addListener('onBuffering', (info: any) => {
        if (info.isBuffering) {
          this.state.status = 'BUFFERING';
          diagnostics.updateState('BUFFERING');
          this.emit('BUFFERING', this.state);
        }
      })
    );
    this.nativeListeners.push(
      await NativeAudio.addListener('onError', (info: any) => {
        const status = info.fatal ? 'ERROR_FATAL' : 'RECOVERING';
        this.state.status = status;
        diagnostics.updateState(status);
        diagnostics.logEvent(`Error: ${info.error || 'Unknown'}`);
        this.emit('ERROR', info);
      })
    );
  }

  async load(options: { url: string; title?: string; artist?: string; coverUrl?: string; position?: number }) {
    this.state.status = 'LOADING';
    diagnostics.logEvent(`Loading url: ${options.url}`);
    diagnostics.updateState('LOADING');
    this.emit('STATE_CHANGED', this.state);
    await NativeAudio.load(options);
  }
  
  async play() { 
    diagnostics.logEvent('Called play()');
    await NativeAudio.play(); 
  }
  
  async pause() { 
    diagnostics.logEvent('Called pause()');
    await NativeAudio.pause(); 
  }
  
  async resume() { 
    diagnostics.logEvent('Called resume()');
    await NativeAudio.resume(); 
  }
  
  async stop() { 
    diagnostics.logEvent('Called stop()');
    await NativeAudio.stop(); 
  }
  
  async seek(options: { position: number }) { 
    diagnostics.logSeek();
    await NativeAudio.seek(options); 
  }
  
  async next() { 
    diagnostics.logEvent('Called next()');
    await NativeAudio.next(); 
  }
  
  async previous() { 
    diagnostics.logEvent('Called previous()');
    await NativeAudio.previous(); 
  }
  
  async setQueue(options: { items: any[] }) { 
    diagnostics.logEvent(`Called setQueue() with ${options.items.length} items`);
    await NativeAudio.setQueue(options); 
  }
  
  async setVolume(volume: number) { 
    this.state.volume = volume;
  }
  
  async setPlaybackRate(rate: number) {
    this.state.playbackRate = rate;
  }
  
  async destroy() {
    diagnostics.logEvent('Called destroy()');
    this.nativeListeners.forEach(l => l.remove().catch(() => {}));
    await NativeAudio.destroy();
  }
  
  getState(): PlaybackState {
    return this.state;
  }
  
  on(event: EngineEvent, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  
  off(event: EngineEvent, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  private emit(event: EngineEvent, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(...args));
    }
  }

  render(context?: any): React.ReactNode {
    if (!context) return null;
    this.context = context;
    return <NativeAudioBridge context={context} engine={this} />;
  }
}

const NativeAudioBridge = ({ context, engine }: { context: any, engine: NativeAudioEngine }) => {
  const currentUrlRef = useRef(context.currentUrl);
  const isPlayingRef = useRef(context.isPlaying);
  const loadingUrlRef = useRef("");

  // Sync URL changes to Native Engine
  useEffect(() => {
    if (context.currentUrl && context.currentUrl !== currentUrlRef.current) {
      currentUrlRef.current = context.currentUrl;
      const displayTrack = context.displayTracks?.[context.currentTrackIndex];
      loadingUrlRef.current = context.currentUrl;
      
      const loadParams = {
        url: context.currentUrl,
        title: displayTrack?.title || "Audio Track",
        artist: displayTrack?.artist || "Unknown Artist",
        coverUrl: displayTrack?.imageUrl || displayTrack?.thumbnail || "",
        position: context.pendingSeekPosRef?.current ? context.pendingSeekPosRef.current * 1000 : 0
      };
      
      engine.load(loadParams).then(() => {
        if (context.isPlaying) {
          engine.play().catch(e => console.warn("NativeAudioBridge play error", e));
        }
      }).catch(e => {
        console.warn("NativeAudioBridge load error", e);
      });
    } else if (!context.currentUrl) {
      engine.stop().catch(() => {});
    }
  }, [context.currentUrl]); // Notice we don't depend on context.isPlaying here to avoid reload loops

  // Initial load if url is present on mount
  useEffect(() => {
    if (context.currentUrl && currentUrlRef.current === context.currentUrl && loadingUrlRef.current !== context.currentUrl) {
      loadingUrlRef.current = context.currentUrl;
      const displayTrack = context.displayTracks?.[context.currentTrackIndex];
      const loadParams = {
        url: context.currentUrl,
        title: displayTrack?.title || "Audio Track",
        artist: displayTrack?.artist || "Unknown Artist",
        coverUrl: displayTrack?.imageUrl || displayTrack?.thumbnail || "",
        position: context.pendingSeekPosRef?.current ? context.pendingSeekPosRef.current * 1000 : 0
      };
      engine.load(loadParams).then(() => {
        if (context.isPlaying) {
          engine.play().catch(e => console.warn("NativeAudioBridge play error", e));
        }
      }).catch(e => {
        console.warn("NativeAudioBridge initial load error", e);
      });
    }
  }, []);

  // Sync Play/Pause
  useEffect(() => {
    if (context.isPlaying !== isPlayingRef.current) {
      isPlayingRef.current = context.isPlaying;
      if (context.isPlaying) {
        if (engine.getState().status === "PAUSED") {
          engine.resume().catch(() => engine.play().catch(e => console.warn("NativeAudioBridge play error", e)));
        } else {
          engine.play().catch(e => console.warn("NativeAudioBridge play error", e));
        }
      } else {
        engine.pause().catch(e => console.warn("NativeAudioBridge pause error", e));
      }
    }
  }, [context.isPlaying]);

  // Sync Seeks
  useEffect(() => {
    if (context.pendingSeekPosRef?.current !== null && context.pendingSeekPosRef?.current > 0) {
       engine.seek({ position: context.pendingSeekPosRef.current * 1000 }).catch(e => console.warn("NativeAudioBridge seek error", e));
       context.pendingSeekPosRef.current = null;
    }
  });

  // Listen to Native Engine events and update React context
  useEffect(() => {
    const handleStateChange = (state: PlaybackState) => {
      if (state.status === 'PLAYING') {
        context.isBufferingRef.current = false;
        context.wasUnexpectedlyPausedRef.current = false;
        context.consecutiveErrorsRef.current = 0;
        if (!context.isPlaying) {
           context.setIsPlaying?.(true);
        }
      } else if (state.status === 'PAUSED') {
         if (context.expectedPlayingRef?.current) {
            context.wasUnexpectedlyPausedRef.current = true;
         }
         if (context.isPlaying) {
            context.setIsPlaying?.(false);
         }
      } else if (state.status === 'BUFFERING') {
         context.isBufferingRef.current = true;
      }
    };

    const handleProgress = (state: PlaybackState) => {
      // Update position
      const currentPosMs = state.position;
      if (document.visibilityState === "visible") {
        context.setPosition(currentPosMs);
      }
      if (currentPosMs > 0 && Math.abs(currentPosMs - (context.positionRef?.current || 0)) > 5000) {
         if (context.positionRef) context.positionRef.current = currentPosMs;
      }

      // Update duration
      if (state.duration > 0 && (context.duration === 0 || document.visibilityState === "visible")) {
        context.setDuration(state.duration);
      }

      // Handle Early Skips and Track Ended (since NativeAudio might not trigger ENDED perfectly)
      if (state.duration > 0 && (state.duration - currentPosMs) < 2000) {
        if (!context.hasEarlySkippedRef?.current) {
          if (context.hasEarlySkippedRef) context.hasEarlySkippedRef.current = true;
          if (context.lastSkipTimeRef) context.lastSkipTimeRef.current = Date.now();
          const msUntilSkip = Math.max(0, state.duration - currentPosMs);
          setTimeout(() => {
            if (context.expectedPlayingRef?.current && context.handleNextRef?.current) {
              context.handleNextRef.current(true);
            }
          }, msUntilSkip);
        }
      }
    };

    const handleEnded = () => {
      if (!context.hasEarlySkippedRef?.current && context.handleNextRef?.current) {
         context.handleNextRef.current(true);
      }
    };

    const handleError = (info: any) => {
       console.warn("NativeAudioBridge Error:", info);
       if (context.consecutiveErrorsRef) {
         context.consecutiveErrorsRef.current += 1;
         if (context.consecutiveErrorsRef.current > 4) {
           context.setIsPlaying?.(false);
           context.consecutiveErrorsRef.current = 0;
           return;
         }
       }
       if (info.fatal) {
         setTimeout(() => {
           if (context.handleNextRef?.current) {
             context.handleNextRef.current(true);
           }
         }, 1500);
       }
    };

    engine.on('STATE_CHANGED', handleStateChange);
    engine.on('PROGRESS', handleProgress);
    engine.on('STOPPED', handleEnded);
    engine.on('ERROR', handleError);

    return () => {
      engine.off('STATE_CHANGED', handleStateChange);
      engine.off('PROGRESS', handleProgress);
      engine.off('STOPPED', handleEnded);
      engine.off('ERROR', handleError);
    };
  }, [engine, context]);

  return null;
};

