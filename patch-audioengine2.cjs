const fs = require('fs');

let code = fs.readFileSync('src/domain/audio/AudioEngine.ts', 'utf8');

const oldBlock = `    if (track.sourceType === 'local_file' || (mediaUrl && mediaUrl.startsWith('blob:'))) {
      this.currentSource = 'html5';
      this.ytPlayer.stop();
      this.audioElement.src = mediaUrl;
      this.audioElement.load();
      if (autoplay) this.play();
    } else if (track.youtubeId) {
      this.currentSource = 'youtube';
      this.audioElement.pause();
      this.ytPlayer.loadVideo(track.youtubeId);
      if (autoplay) {
        // Delay a bit to allow YouTube to load, otherwise play might be ignored
        this.play(); 
      }
    } else {
      // Fetch via backend search (using youtubei.js instead of yt-dlp)
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

const newBlock = `    if (track.sourceType === 'local_file' || (mediaUrl && mediaUrl.startsWith('blob:'))) {
      this.currentSource = 'html5';
      this.ytPlayer.stop();
      this.audioElement.src = mediaUrl;
      this.audioElement.load();
      if (autoplay) this.play();
    } else {
      this.currentSource = 'html5';
      this.ytPlayer.stop();
      const ytId = track.youtubeId || '';
      const q = encodeURIComponent(track.title + ' ' + (track.artist || ''));
      this.audioElement.src = \`/api/audio-stream?youtubeId=\${ytId}&q=\${q}\`;
      this.audioElement.load();
      if (autoplay) this.play();
    }`;

if (code.includes("if (track.sourceType === 'local_file'")) {
    code = code.replace(oldBlock, newBlock);
    fs.writeFileSync('src/domain/audio/AudioEngine.ts', code);
    console.log("Patched successfully!");
} else {
    console.log("Could not find the block to replace.");
}
