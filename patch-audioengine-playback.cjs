const fs = require('fs');

let code = fs.readFileSync('src/domain/audio/AudioEngine.ts', 'utf8');

// For loadTrack
const loadTrackRegex = /if \(this\.currentSource === 'html5'\) \{[\s\S]*?this\.audioElement\.play\(\)\.catch\(\(err\) => \{\n\s*console\.warn\('Autoplay failed:', err\);\n\s*\}\);\n\s*\}/;

const newLoadTrack = `if (this.currentSource === 'html5') {
        if (Capacitor.isNativePlatform()) {
           NativeAudio.load({
             url: track.url,
             title: track.title,
             artist: track.artist,
             coverUrl: track.artworkUrl
           }).then(() => {
             if (autoplay) {
               NativeAudio.play().catch(e => console.warn('NativeAudio play error', e));
             }
           }).catch(e => console.warn('NativeAudio load error', e));
        } else {
           this.audioElement.src = track.url;
           this.audioElement.load();
           if (autoplay) {
             this.audioElement.play().catch((err) => {
               console.warn('Autoplay failed:', err);
             });
           }
        }
      }`;

code = code.replace(loadTrackRegex, newLoadTrack);

// For play
const playRegex = /if \(this\.currentSource === 'html5'\) \{\n\s*this\.pendingPlayPromise = this\.audioElement\.play\(\);\n\s*try \{\n\s*await this\.pendingPlayPromise;\n\s*\} catch \(err\) \{\n\s*console\.warn\('Play interrupted:', err\);\n\s*\}\n\s*\}/;
const newPlay = `if (this.currentSource === 'html5') {
      if (Capacitor.isNativePlatform()) {
        try { await NativeAudio.play(); } catch(e) { console.warn(e); }
      } else {
        this.pendingPlayPromise = this.audioElement.play();
        try {
          await this.pendingPlayPromise;
        } catch (err) {
          console.warn('Play interrupted:', err);
        }
      }
    }`;
code = code.replace(playRegex, newPlay);

// For pause
const pauseRegex = /if \(this\.currentSource === 'html5'\) \{\n\s*this\.audioElement\.pause\(\);\n\s*\}/;
const newPause = `if (this.currentSource === 'html5') {
      if (Capacitor.isNativePlatform()) {
        try { await NativeAudio.pause(); } catch(e) { console.warn(e); }
      } else {
        this.audioElement.pause();
      }
    }`;
code = code.replace(pauseRegex, newPause);

// For seek
const seekRegex = /if \(this\.currentSource === 'html5'\) this\.audioElement\.currentTime = seconds;/;
const newSeek = `if (this.currentSource === 'html5') {
        if (Capacitor.isNativePlatform()) {
          NativeAudio.seek({ position: seconds }).catch(e => console.warn(e));
        } else {
          this.audioElement.currentTime = seconds;
        }
      }`;
code = code.replace(seekRegex, newSeek);

fs.writeFileSync('src/domain/audio/AudioEngine.ts', code);
console.log("Patched playback methods for NativeAudio");
