import { NativeAudio } from '../../plugins/NativeAudio';
import { Capacitor } from '@capacitor/core';
import { MediaSession } from '@jofr/capacitor-media-session';
import { YoutubePlayerWrapper } from "./YoutubePlayerWrapper";
import { Track, PlaybackState, RepeatMode } from '../types';
import { localStorageService } from '../storage/LocalStorage';
import { LocalFolderImporter } from '../importers/LocalFolderImporter';

export type AudioEngineEvent = 
  | 'stateChange'
  | 'timeUpdate'
  | 'trackChange'
  | 'queueChange'
  | 'error';

export type EventListener = (data: any) => void;

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private audioElement: HTMLAudioElement;
  private ytPlayer: YoutubePlayerWrapper;
  private currentSource: "html5" | "youtube" | "synth" = "html5";
  private ytTimer: any = null;
  private queue: Track[] = [];
  private shuffledQueue: Track[] = [];
  private currentIndex: number = -1;
  private listeners: Map<AudioEngineEvent, Set<EventListener>> = new Map();

  private state: PlaybackState = {
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
    isMuted: false,
    isShuffle: false,
    repeatMode: 'off',
    playbackRate: 1.0,
    bufferedPosition: 0,
    error: null,
  };

  private pendingPlayPromise: Promise<void> | null = null;
  private currentObjectUrl: string | null = null;
  private lastVolume: number = 1.0;

  private constructor() {
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';
    (this.audioElement as any).playsInline = true;
    this.audioElement.setAttribute('playsinline', 'true');
    this.audioElement.setAttribute('webkit-playsinline', 'true');
    this.audioElement.setAttribute('x-webkit-airplay', 'allow');
    this.setupAudioListeners();
    this.setupMediaSession();
    this.ytPlayer = new YoutubePlayerWrapper();
    this.setupYoutubeListeners();
    this.setupNativeAudioListeners();
    this.loadPersistedState();
    window.addEventListener('beforeunload', () => this.saveState());
    setInterval(() => this.saveState(), 10000);
  }

  private loadPersistedState() {
    try {
      const savedState = window.localStorage.getItem('flux_playback_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.queue) this.queue = parsed.queue;
        if (parsed.currentIndex !== undefined) this.currentIndex = parsed.currentIndex;
        if (parsed.state) {
           this.state.volume = parsed.state.volume !== undefined ? parsed.state.volume : 1;
           this.state.isMuted = !!parsed.state.isMuted;
           this.state.isShuffle = !!parsed.state.isShuffle;
           this.state.repeatMode = parsed.state.repeatMode || 'off';
           this.state.currentTrack = parsed.state.currentTrack || null;
           
           this.setVolume(this.state.volume);
           if (this.state.isMuted) this.audioElement.muted = true;
        }
        
        if (this.state.isShuffle) {
          this.generateShuffledQueue();
        }
        
        if (this.state.currentTrack) {
          this.loadTrack(this.state.currentTrack, false);
          if (parsed.state.currentTime) {
             this.audioElement.currentTime = parsed.state.currentTime;
             this.state.currentTime = parsed.state.currentTime;
          }
        }
        
        this.emit('queueChange', this.getQueue());
    this.saveState();
        this.emit('stateChange');
    // this.saveState() is called periodically and on exit
      }
    } catch(e) {
      console.warn("Failed to load persisted state", e);
    }
  }

  private saveState() {
    try {
      const stateToSave = {
        queue: this.queue,
        currentIndex: this.currentIndex,
        state: {
          volume: this.state.volume,
          isMuted: this.state.isMuted,
          isShuffle: this.state.isShuffle,
          repeatMode: this.state.repeatMode,
          currentTrack: this.state.currentTrack,
          currentTime: this.state.currentTime,
        }
      };
      window.localStorage.setItem('flux_playback_state', JSON.stringify(stateToSave));
    } catch(e) {
      console.warn("Failed to save state", e);
    }
  }


  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  // --- Event Emitter ---
  public on(event: AudioEngineEvent, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Initial state emit for immediate state subscription
    if (event === 'stateChange') {
      listener(this.getState());
    }

    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  private emit(event: AudioEngineEvent, data?: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data || this.getState()));
    }
  }

  // --- State Getter ---
  public getState(): PlaybackState {
    return { ...this.state };
  }

  public getYoutubeContainer() { return this.ytPlayer.getContainer(); }

  public showYoutubeVideoInRect(rect: { left: number; top: number; width: number; height: number; zIndex?: number }) {
    const container = this.ytPlayer.getContainer();
    if (!container) return;
    container.style.position = 'fixed';
    container.style.left = `${rect.left}px`;
    container.style.top = `${rect.top}px`;
    container.style.width = `${rect.width}px`;
    container.style.height = `${rect.height}px`;
    container.style.zIndex = `${rect.zIndex || 60}`;
    container.style.pointerEvents = 'none';
    container.style.borderRadius = '16px';
    container.style.overflow = 'hidden';

    const iframe = container.querySelector('iframe');
    if (iframe) {
      iframe.style.width = '108%';
      iframe.style.height = '108%';
      iframe.style.marginLeft = '-4%';
      iframe.style.marginTop = '-4%';
      iframe.style.borderRadius = '16px';
      iframe.style.border = 'none';
      iframe.style.pointerEvents = 'none';
    }
  }

  public hideYoutubeVideo() {
    const container = this.ytPlayer.getContainer();
    if (!container) return;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '200px';
    container.style.height = '200px';
    container.style.zIndex = '-1';
    container.style.pointerEvents = 'none';
  }
  public getQueue(): Track[] {
    return [...(this.state.isShuffle ? this.shuffledQueue : this.queue)];
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  // --- HTML5 Audio Listener Wiring ---
  
  private setupNativeAudioListeners() {
    if (!Capacitor.isNativePlatform()) return;
    
    NativeAudio.addListener('onStateChanged', (state) => {
      if (state.status === 'playing') {
        this.state.isPlaying = true;
        this.emit('stateChange');
      } else if (state.status === 'paused') {
        this.state.isPlaying = false;
        this.emit('stateChange');
      } else if (state.status === 'ended') {
        this.handleTrackEnded();
      }
    });

    NativeAudio.addListener('onProgress', (info) => {
      this.state.currentTime = info.position;
      if (info.duration > 0 && this.state.duration === 0) {
        this.state.duration = info.duration;
      }
      this.emit('timeUpdate', { currentTime: info.position, duration: this.state.duration });
    });
    
    NativeAudio.addListener('onDuration', (info) => {
      this.state.duration = info.duration;
      this.emit('stateChange');
    });
    
    NativeAudio.addListener('onError', (info) => {
      this.state.error = info.message;
      this.state.isPlaying = false;
      this.emit('error', info.message);
      this.emit('stateChange');
    });
  }

  private setupAudioListeners() {
    this.audioElement.addEventListener('play', () => {
      this.state.isPlaying = true;
      this.state.error = null;
      this.updateMediaSessionState('playing');
      this.emit('stateChange');
    // this.saveState() is called periodically and on exit
    });

    this.audioElement.addEventListener('pause', () => {
      this.state.isPlaying = false;
      this.updateMediaSessionState('paused');
      this.emit('stateChange');
    // this.saveState() is called periodically and on exit
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      this.state.duration = this.audioElement.duration || 0;
      this.emit('stateChange');
    // this.saveState() is called periodically and on exit
    });

    this.audioElement.addEventListener('durationchange', () => {
      this.state.duration = this.audioElement.duration || 0;
      this.emit('stateChange');
    // this.saveState() is called periodically and on exit
    });

    this.audioElement.addEventListener('timeupdate', () => {
      this.state.currentTime = this.audioElement.currentTime;
      this.state.duration = this.audioElement.duration || 0;
      this.updateMediaSessionPosition();
      this.emit('timeUpdate', { currentTime: this.state.currentTime, duration: this.state.duration });
      this.emit('stateChange');
    // this.saveState() is called periodically and on exit
    });

    this.audioElement.addEventListener('progress', () => {
      if (this.audioElement.buffered.length > 0) {
        this.state.bufferedPosition = this.audioElement.buffered.end(this.audioElement.buffered.length - 1);
        this.emit('stateChange');
    // this.saveState() is called periodically and on exit
      }
    });

    this.audioElement.addEventListener('ended', () => {
      this.handleTrackEnded();
    });

    this.audioElement.addEventListener('error', (e) => {
      const errMessage = this.audioElement.error?.message || 'Error de reproducción de audio';
      
      const track = this.state.currentTrack;
      console.error('Audio stream error for track:', track?.title, errMessage);
      
      this.state.error = errMessage;
      this.state.isPlaying = false;
      this.emit('error', errMessage);
      this.emit('stateChange');
    // this.saveState() is called periodically and on exit
    });
  }

  
  private setupYoutubeListeners() {
    this.ytPlayer.onStateChange = (state) => {
      // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
      if (this.currentSource !== 'youtube') return;
      
      if (state === 1) { // Playing
        this.state.isPlaying = true;
        this.state.error = null;
        this.state.duration = this.ytPlayer.getDuration() || this.state.duration;
        this.updateMediaSessionState('playing');
        this.emit('stateChange');
    // this.saveState() is called periodically and on exit
        
        if (this.ytTimer) clearInterval(this.ytTimer);
        this.ytTimer = setInterval(() => {
          if (this.currentSource === 'youtube' && this.state.isPlaying) {
            this.state.currentTime = this.ytPlayer.getCurrentTime();
            const dur = this.ytPlayer.getDuration();
            if (dur > 0) this.state.duration = dur;
            this.updateMediaSessionPosition();
            this.emit('timeUpdate', { currentTime: this.state.currentTime, duration: this.state.duration });
          }
        }, 500);
      } else if (state === 2) { // Paused
        this.state.isPlaying = false;
        this.updateMediaSessionState('paused');
        this.emit('stateChange');
    // this.saveState() is called periodically and on exit
        if (this.ytTimer) clearInterval(this.ytTimer);
      } else if (state === 0) { // Ended
        this.handleTrackEnded();
      }
    };
    
    this.ytPlayer.onError = (error) => {
      if (this.currentSource !== 'youtube') return;
      this.state.error = "YouTube Error: " + error;
      console.warn("YT Error: ", error);
      if (this.state.currentTrack) { this.startSynthFallback(this.state.currentTrack); }
      this.state.isPlaying = false;
      this.emit('error', this.state.error);
      this.emit('stateChange');
    // this.saveState() is called periodically and on exit
    };
  }

  // --- Media Session API (Bluetooth, Lockscreen, Media Keys) ---
  private setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    const ms = navigator.mediaSession;
    try {
      ms.setActionHandler('play', () => this.play());
      ms.setActionHandler('pause', () => this.pause());
      ms.setActionHandler('previoustrack', () => this.previous());
      ms.setActionHandler('nexttrack', () => this.next());
      ms.setActionHandler('stop', () => this.pause());
      ms.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          this.seek(details.seekTime);
        }
      });
      ms.setActionHandler('seekbackward', (details) => {
        const skip = details.seekOffset || 10;
        this.seek(Math.max(this.state.currentTime - skip, 0));
      });
      ms.setActionHandler('seekforward', (details) => {
        const skip = details.seekOffset || 10;
        this.seek(Math.min(this.state.currentTime + skip, this.state.duration));
      });
    } catch (e) {
      console.warn('MediaSession handler setup issue:', e);
    }
  }

  private updateMediaSessionPosition() {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      if (this.state.duration > 0 && !isNaN(this.state.currentTime)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: this.state.duration,
            playbackRate: this.state.playbackRate || 1.0,
            position: Math.min(this.state.currentTime, this.state.duration),
          });
        } catch (e) {
          // ignore transient position errors
        }
      }
    }
  }

  private updateMediaSessionMetadata(track: Track | null) {
    if (!('mediaSession' in navigator) || !track) return;

    const coverArt = track.artworkUrl || (track.youtubeId ? `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg` : null);
    const artwork = coverArt ? [
      { src: coverArt, sizes: '96x96', type: 'image/png' },
      { src: coverArt, sizes: '128x128', type: 'image/png' },
      { src: coverArt, sizes: '192x192', type: 'image/png' },
      { src: coverArt, sizes: '256x256', type: 'image/png' },
      { src: coverArt, sizes: '384x384', type: 'image/png' },
      { src: coverArt, sizes: '512x512', type: 'image/png' },
    ] : [
      { src: '/icon.png', sizes: '192x192', type: 'image/png' }
    ];

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist || 'Flux Music',
        album: track.album || 'Flux Music Player',
        artwork,
      });
    } catch (e) {
      console.warn('MediaMetadata set failed:', e);
    }
  }

  
  private updateMediaSessionState(playbackState: 'playing' | 'paused' | 'none') {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = playbackState;
      if (playbackState === 'playing') {
        try {
          navigator.mediaSession.setPositionState({
            duration: this.state.duration || 0,
            playbackRate: this.state.playbackRate || 1,
            position: this.state.currentTime || 0
          });
        } catch(e) {}
      }
    }
    
    if (Capacitor.isNativePlatform()) {
      try {
        MediaSession.setPlaybackState({ playbackState: playbackState });
        if (playbackState === 'playing') {
          MediaSession.setPositionState({
            duration: this.state.duration || 0,
            playbackRate: this.state.playbackRate || 1,
            position: this.state.currentTime || 0
          });
        }
      } catch(e) {}
    }
  }


  private synthTimer: any = null;
  private synthCtx: AudioContext | null = null;
  private isUsingSynth: boolean = false;

  private startSynthFallback(track: Track) {
    if (this.isUsingSynth) return;
    this.isUsingSynth = true;
    
    if (this.currentSource === 'html5') this.audioElement.pause();
    this.ytPlayer.pause();
    this.currentSource = 'synth';


    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !this.synthCtx) {
        this.synthCtx = new AudioCtx();
      }
      if (this.synthCtx && this.synthCtx.state === 'suspended') {
        this.synthCtx.resume();
      }
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }

    this.state.isPlaying = true;
    this.state.error = null;
    this.state.duration = track.duration || 180;
    this.emit('stateChange');
    // this.saveState() is called periodically and on exit

    let elapsed = this.state.currentTime || 0;
    if (this.synthTimer) clearInterval(this.synthTimer);

    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];

    this.synthTimer = setInterval(() => {
      if (!this.state.isPlaying) return;
      elapsed += 0.25;
      this.state.currentTime = elapsed;

      if (this.state.duration > 0 && elapsed >= this.state.duration) {
        this.stopSynth();
        this.handleTrackEnded();
        return;
      }

      this.emit('timeUpdate', { currentTime: elapsed, duration: this.state.duration });
      this.emit('stateChange');
    // this.saveState() is called periodically and on exit

      // Play soft ambient tone
      if (this.synthCtx && this.synthCtx.state === 'running') {
        try {
          const step = Math.floor(elapsed * 2) % notes.length;
          const osc = this.synthCtx.createOscillator();
          const gain = this.synthCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(notes[step], this.synthCtx.currentTime);
          gain.gain.setValueAtTime(0.05, this.synthCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.synthCtx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(this.synthCtx.destination);
          osc.start();
          osc.stop(this.synthCtx.currentTime + 0.3);
        } catch (err) {
          // Ignore transient synth error
        }
      }
    }, 250);
  }

  private stopSynth() {
    this.isUsingSynth = false;
    if (this.synthTimer) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
  }

  // --- Queue & Playback Commands ---
  public setQueue(tracks: Track[], startIndex: number = 0, startImmediately: boolean = true) {
    this.queue = [...tracks];
    this.currentIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));

    if (this.state.isShuffle) {
      this.generateShuffledQueue();
    }

    const currentTrack = this.getQueueTrack(this.currentIndex);
    this.state.currentTrack = currentTrack;
    this.emit('queueChange', this.getQueue());
    this.saveState();

    if (currentTrack) {
      this.loadTrack(currentTrack, startImmediately);
    }
  }

  public playTrack(track: Track) {
    const existingIndex = this.queue.findIndex(t => t.id === track.id);
    if (existingIndex !== -1) {
      this.currentIndex = existingIndex;
      this.loadTrack(track, true);
    } else {
      this.queue.unshift(track);
      this.currentIndex = 0;
      if (this.state.isShuffle) this.generateShuffledQueue();
      this.emit('queueChange', this.getQueue());
    this.saveState();
      this.loadTrack(track, true);
    }
  }

  private async loadTrack(track: Track, autoplay: boolean = true) {
    this.stopSynth();

    // Avoid reloading if exact same track is already loaded in audioElement AND no error
    if (this.state.currentTrack?.id === track.id && this.audioElement.src && !this.audioElement.error && !this.isUsingSynth) {
      if (autoplay && this.audioElement.paused) {
        this.play();
      }
      return;
    }

    this.pendingPlayPromise = null;

    this.state.currentTrack = track;
    this.state.currentTime = 0;
    this.state.duration = track.duration || 0;
    this.state.error = null;

    let mediaUrl = track.url;

    if (!mediaUrl || mediaUrl.startsWith('blob:') || track.sourceType === 'local_file') {
      try {
        const storedBlob = await localStorageService.getAudioBlob(track.id);
        if (storedBlob) {
          if (this.currentObjectUrl) {
            URL.revokeObjectURL(this.currentObjectUrl);
          }
          mediaUrl = URL.createObjectURL(storedBlob);
          this.currentObjectUrl = mediaUrl;
          track.url = mediaUrl;
        }
      } catch (err) {
        console.warn('Error loading audio blob from IDB:', err);
      }
    }

    

    
    if (track.sourceType === 'local_file' || track.sourceType === 'folder' || (mediaUrl && (mediaUrl.startsWith('blob:') || mediaUrl.startsWith('data:')))) {
      this.currentSource = 'html5';
      this.ytPlayer.stop();
      this.audioElement.src = mediaUrl;
      this.audioElement.load();
      if (autoplay) this.play();
    } else if (track.youtubeId) {
      this.currentSource = 'youtube';
      this.audioElement.pause();
      this.ytPlayer.loadVideo(track.youtubeId);
      if (autoplay) this.play();
    } else {
      this.currentSource = 'youtube';
      this.audioElement.pause();
      fetch('/api/search?q=' + encodeURIComponent(track.title + ' ' + (track.artist || '')))
        .then(r => r.json())
        .then(d => {
           if(d.results && d.results.length > 0) {
             const ytId = d.results[0].id;
             track.youtubeId = ytId;
             if (this.state.currentTrack?.id === track.id) {
               this.ytPlayer.loadVideo(ytId);
               if (autoplay) this.play();
             }
           } else {
             this.startSynthFallback(track);
           }
        }).catch(() => this.startSynthFallback(track));
    }
    
    this.updateMediaSessionMetadata(track);
    this.emit('trackChange', track);
    this.emit('stateChange');
    // this.saveState() is called periodically and on exit

  }

  public async play() {
    if (!this.state.currentTrack && this.queue.length > 0) {
      this.setQueue(this.queue, 0, true);
      return;
    }

    if (this.isUsingSynth && this.state.currentTrack) {
      this.startSynthFallback(this.state.currentTrack);
      return;
    }

    // If audioElement has an error or no src, reload current track
    if (this.currentSource === 'html5' && (this.audioElement.error || !this.audioElement.src) && this.state.currentTrack) {
      this.loadTrack(this.state.currentTrack, true);
      return;
    }

    try {
      this.state.isPlaying = true;
      this.emit('stateChange');
    // this.saveState() is called periodically and on exit

      
      if (this.currentSource === 'html5') {
        this.pendingPlayPromise = this.audioElement.play();
        await this.pendingPlayPromise;
        this.pendingPlayPromise = null;
      } else if (this.currentSource === 'youtube') {
        this.ytPlayer.play();
      }

    } catch (err: any) {
      this.pendingPlayPromise = null;

      const isInterrupted = 
        err.name === 'AbortError' || 
        (err.message && (err.message.includes('interrupted') || err.message.includes('superseded')));

      if (isInterrupted) {
        // Interrupted by new load/play request; do not log warning or force isPlaying to false
        return;
      }

      if (err.name === 'NotAllowedError') {
        console.warn('Autoplay prevented by browser interaction policy');
        this.state.isPlaying = false;
        this.emit('stateChange');
    // this.saveState() is called periodically and on exit
        return;
      }

      console.warn('AudioElement play error:', err);
      this.state.error = 'Error de reproducción (posible bloqueo de autoplay)';
      this.state.isPlaying = false;
      this.emit('stateChange');
    // this.saveState() is called periodically and on exit
    }
  }

  public async pause() {
    this.audioElement.pause();
    this.ytPlayer.pause();
    if (Capacitor.isNativePlatform()) {
      NativeAudio.pause().catch(e => console.warn(e));
    }
    if (this.isUsingSynth) {
      this.stopSynth();
    }
    this.state.isPlaying = false;
    this.updateMediaSessionState('paused');
    this.emit('stateChange');
  }

  public togglePlay() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public next() {
    const activeQueue = this.getQueue();
    if (activeQueue.length === 0) return;

    if (this.state.repeatMode === 'one' && this.state.currentTrack) {
      this.seek(0);
      this.play();
      return;
    }

    let nextIndex = this.currentIndex + 1;
    if (nextIndex >= activeQueue.length) {
      if (this.state.repeatMode === 'all') {
        nextIndex = 0;
      } else {
        this.pause();
        this.seek(0);
        return;
      }
    }

    this.currentIndex = nextIndex;
    const nextTrack = activeQueue[this.currentIndex];
    if (nextTrack) {
      this.loadTrack(nextTrack, true);
    }
  }

  public previous() {
    // If current track is played more than 3 seconds, restart track
    if (this.audioElement.currentTime > 3) {
      this.seek(0);
      return;
    }

    const activeQueue = this.getQueue();
    if (activeQueue.length === 0) return;

    let prevIndex = this.currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = activeQueue.length - 1;
    }

    this.currentIndex = prevIndex;
    const prevTrack = activeQueue[this.currentIndex];
    if (prevTrack) {
      this.loadTrack(prevTrack, true);
    }
  }

  public seek(seconds: number) {
    if (!isNaN(seconds) && isFinite(seconds)) {
      
      if (this.currentSource === 'html5') {
        if (Capacitor.isNativePlatform()) {
          NativeAudio.seek({ position: seconds }).catch(e => console.warn(e));
        } else {
          this.audioElement.currentTime = seconds;
        }
      }
      if (this.currentSource === 'youtube') this.ytPlayer.seek(seconds);

      this.state.currentTime = seconds;
      this.emit('timeUpdate', { currentTime: seconds, duration: this.state.duration });
    }
  }

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    
    this.audioElement.volume = clamped;
    this.ytPlayer.setVolume(clamped);

    this.state.volume = clamped;
    if (clamped > 0) {
      this.lastVolume = clamped;
      this.state.isMuted = false;
      this.audioElement.muted = false;
    } else {
      this.state.isMuted = true;
      this.audioElement.muted = true;
    }
    this.emit('stateChange');
  }

  public toggleMute() {
    if (this.state.isMuted) {
      const volToRestore = this.lastVolume > 0 ? this.lastVolume : 0.8;
      this.setVolume(volToRestore);
    } else {
      if (this.state.volume > 0) {
        this.lastVolume = this.state.volume;
      }
      this.audioElement.volume = 0;
      this.ytPlayer.setVolume(0);
      this.audioElement.muted = true;
      this.state.isMuted = true;
      this.emit('stateChange');
    }
  }

  public toggleShuffle() {
    this.state.isShuffle = !this.state.isShuffle;
    if (this.state.isShuffle) {
      this.generateShuffledQueue();
    }
    this.emit('stateChange');
    // this.saveState() is called periodically and on exit
    this.emit('queueChange', this.getQueue());
    this.saveState();
  }

  public toggleRepeat() {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const currentIdx = modes.indexOf(this.state.repeatMode);
    this.state.repeatMode = modes[(currentIdx + 1) % modes.length];
    this.emit('stateChange');
    // this.saveState() is called periodically and on exit
  }

  private handleTrackEnded() {
    if (this.state.repeatMode === 'one') {
      this.seek(0);
      this.play();
    } else {
      this.next();
    }
  }

  private generateShuffledQueue() {
    if (this.queue.length === 0) return;
    const array = [...this.queue];
    const current = this.state.currentTrack;

    // Fisher-Yates shuffle
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }

    // Keep current track at index 0 if playing
    if (current) {
      const idx = array.findIndex(t => t.id === current.id);
      if (idx !== -1) {
        array.splice(idx, 1);
        array.unshift(current);
      }
    }

    this.shuffledQueue = array;
    this.currentIndex = 0;
  }

  public updateTrackFavorite(trackId: string, isFavorite: boolean) {
    if (this.state.currentTrack && this.state.currentTrack.id === trackId) {
      this.state.currentTrack = { ...this.state.currentTrack, isFavorite };
    }
    this.queue = this.queue.map(t => t.id === trackId ? { ...t, isFavorite } : t);
    this.shuffledQueue = this.shuffledQueue.map(t => t.id === trackId ? { ...t, isFavorite } : t);
    this.emit('stateChange');
    this.emit('queueChange', this.getQueue());
    this.saveState();
  }

  private getQueueTrack(index: number): Track | null {
    const activeQueue = this.getQueue();
    return activeQueue[index] || null;
  }
}

export const audioEngine = AudioEngine.getInstance();
