const fs = require('fs');
let code = fs.readFileSync('src/domain/audio/AudioEngine.ts', 'utf8');

const badBlock = `    } else {
      this.currentSource = 'html5';
      this.ytPlayer.stop();
      const ytId = track.youtubeId || '';
      const q = encodeURIComponent(track.title + ' ' + (track.artist || ''));
      this.audioElement.src = \`/api/audio-stream?youtubeId=\${ytId}&q=\${q}\`;
      this.audioElement.load();
      if (autoplay) this.play();
    }`;

const goodBlock = `    } else if (track.youtubeId) {
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
    }`;

code = code.replace(badBlock, goodBlock);
fs.writeFileSync('src/domain/audio/AudioEngine.ts', code);
