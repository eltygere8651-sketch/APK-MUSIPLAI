const fs = require('fs');

let code = fs.readFileSync('src/domain/audio/AudioEngine.ts', 'utf8');

const loadPersistedState = `
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
        this.emit('stateChange');
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
`;

const setupListenersRegex = /this\.setupYoutubeListeners\(\);\n\s*\}/;
code = code.replace(setupListenersRegex, "this.setupYoutubeListeners();\n    this.loadPersistedState();\n    window.addEventListener('beforeunload', () => this.saveState());\n    setInterval(() => this.saveState(), 10000);\n  }\n" + loadPersistedState);

// Replace queueChange emits with queueChange + saveState
code = code.replace(/this\.emit\('queueChange', this\.getQueue\(\)\);/g, "this.emit('queueChange', this.getQueue());\n    this.saveState();");
code = code.replace(/this\.emit\('stateChange'\);/g, "this.emit('stateChange');\n    // this.saveState() is called periodically and on exit");

fs.writeFileSync('src/domain/audio/AudioEngine.ts', code);
console.log("Patched AudioEngine state persistence");
