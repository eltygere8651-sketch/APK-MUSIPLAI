const fs = require('fs');

let code = fs.readFileSync('src/domain/audio/AudioEngine.ts', 'utf8');

const importCap = "import { Capacitor } from '@capacitor/core';\nimport { MediaSession } from '@jofr/capacitor-media-session';\n";

if (!code.includes("import { MediaSession }")) {
  code = importCap + code;
}

const capacitorMediaSession = `
    if (Capacitor.isNativePlatform()) {
      try {
        MediaSession.setActionHandler({ action: 'play' }, () => this.play());
        MediaSession.setActionHandler({ action: 'pause' }, () => this.pause());
        MediaSession.setActionHandler({ action: 'previoustrack' }, () => this.previous());
        MediaSession.setActionHandler({ action: 'nexttrack' }, () => this.next());
        MediaSession.setActionHandler({ action: 'seekforward' }, () => {
          this.seek(Math.min(this.state.duration, this.state.currentTime + 10));
        });
        MediaSession.setActionHandler({ action: 'seekbackward' }, () => {
          this.seek(Math.max(0, this.state.currentTime - 10));
        });
        
        MediaSession.setPositionState({
          duration: this.state.duration,
          position: this.state.currentTime,
          playbackRate: this.state.playbackRate
        });
      } catch (err) {
        console.warn('Capacitor MediaSession Error:', err);
      }
    }
`;

const capacitorUpdate = `
    if (Capacitor.isNativePlatform()) {
      try {
        MediaSession.setMetadata({
          title: track.title,
          artist: track.artist || 'Artista Desconocido',
          album: track.album || 'Álbum Desconocido',
          artwork: artwork
        });
      } catch(err) {}
    }
`;

// Insert into setupMediaSession
code = code.replace(
  "ms.setActionHandler('seekto', (details) => {",
  "ms.setActionHandler('seekto', (details) => {"
); // Let's just find the end of the try block

code = code.replace(
  "console.warn('MediaSession actions not supported', e);\n    }",
  "console.warn('MediaSession actions not supported', e);\n    }\n" + capacitorMediaSession
);

code = code.replace(
  "artwork: artwork\n    });",
  "artwork: artwork\n    });\n" + capacitorUpdate
);

const positionStateUpdate = `
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
`;

code = code.replace(
  /private updateMediaSessionState\([\s\S]*?\n  \}/,
  positionStateUpdate
);

fs.writeFileSync('src/domain/audio/AudioEngine.ts', code);
console.log("Patched MediaSession");
