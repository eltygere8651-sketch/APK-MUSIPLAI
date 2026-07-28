export class YoutubePlayerWrapper {
  private player: any = null;
  private isReady = false;
  private pendingVideoId: string | null = null;
  private pendingPlay: boolean = false;
  private pendingVolume: number | null = null;
  private container: HTMLDivElement | null = null;
  
  public onReady?: () => void;
  public onStateChange?: (state: number) => void;
  public onError?: (error: any) => void;

  constructor() {
    this.init();
  }

  private init() {
    if ((window as any).YT && (window as any).YT.Player) {
      this.createPlayer();
      return;
    }

    if (!document.getElementById('youtube-iframe-api')) {
      const script = document.createElement('script');
      script.id = 'youtube-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }

    const oldCallback = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      if (oldCallback) oldCallback();
      this.createPlayer();
    };
  }

  private createPlayer() {
    this.container = document.createElement('div');
    this.container.id = 'yt-audio-player-wrapper-' + Math.random().toString(36).substring(7);
    this.container.style.position = 'absolute';
    this.container.style.left = '-9999px';
    this.container.style.top = '-9999px';
    this.container.style.width = '200px';
    this.container.style.height = '200px';
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'none'; // Prevent interacting when hidden

    const innerDiv = document.createElement('div');
    innerDiv.id = 'yt-audio-player-inner-' + Math.random().toString(36).substring(7);
    innerDiv.style.width = '100%';
    innerDiv.style.height = '100%';
    this.container.appendChild(innerDiv);
    
    document.body.appendChild(this.container);

    this.player = new (window as any).YT.Player(innerDiv.id, {
      height: '200',
      width: '200',
      videoId: 'dQw4w9WgXcQ', // Dummy video to ensure initialization
      playerVars: {
        playsinline: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        autohide: 1,
        cc_load_policy: 0
      },
      
      events: {
        'onReady': () => {
          this.isReady = true; console.log('[YT] Player is READY');
          if (this.pendingVolume !== null) this.setVolume(this.pendingVolume);
          if (this.pendingVideoId) this.loadVideo(this.pendingVideoId);
          if (this.pendingPlay) setTimeout(() => this.play(), 500);
          if (this.onReady) this.onReady();
        },
        'onStateChange': (event: any) => {
          if (this.onStateChange) this.onStateChange(event.data);
        },
        'onError': (event: any) => {
          console.error('[YT] onError', event.data);
          if (this.onError) this.onError(event.data);
        }
      }
    });
  }

  public loadVideo(videoId: string) {
    console.log('[YT] loadVideo called with', videoId);
    if (this.isReady && this.player) {
      this.player.loadVideoById(videoId);
    } else {
      this.pendingVideoId = videoId;
    }
  }

  public play() {
    console.log('[YT] play called');
    if (this.isReady && this.player) {
      this.player.playVideo();
    } else {
      this.pendingPlay = true;
    }
  }

  public pause() {
    if (this.isReady && this.player) {
      this.player.pauseVideo();
    }
  }

  public stop() {
    if (this.isReady && this.player) {
      this.player.stopVideo();
    }
  }

  public seek(seconds: number) {
    if (this.isReady && this.player) {
      this.player.seekTo(seconds, true);
    }
  }

  public setVolume(volume: number) {
    if (this.isReady && this.player && this.player.setVolume) {
      this.player.setVolume(Math.round(volume * 100));
    } else {
      this.pendingVolume = volume;
    }
  }

  public getCurrentTime(): number {
    if (this.isReady && this.player && this.player.getCurrentTime) {
      return this.player.getCurrentTime() || 0;
    }
    return 0;
  }

  public getContainer(): HTMLDivElement | null { return this.container; }
  public getDuration(): number {
    if (this.isReady && this.player && this.player.getDuration) {
      return this.player.getDuration() || 0;
    }
    return 0;
  }
}
