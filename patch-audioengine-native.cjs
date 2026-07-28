const fs = require('fs');

let code = fs.readFileSync('src/domain/audio/AudioEngine.ts', 'utf8');

const importNativeAudio = "import { NativeAudio } from '../../plugins/NativeAudio';\n";

if (!code.includes("import { NativeAudio }")) {
  code = importNativeAudio + code;
}

const setupNativeAudioListeners = `
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
`;

// Insert into constructor
code = code.replace(
  "this.setupYoutubeListeners();\n    this.loadPersistedState();",
  "this.setupYoutubeListeners();\n    this.setupNativeAudioListeners();\n    this.loadPersistedState();"
);

// Insert definition
code = code.replace(
  "private setupAudioListeners() {",
  setupNativeAudioListeners + "\n  private setupAudioListeners() {"
);

fs.writeFileSync('src/domain/audio/AudioEngine.ts', code);
console.log("Patched NativeAudio listeners");
