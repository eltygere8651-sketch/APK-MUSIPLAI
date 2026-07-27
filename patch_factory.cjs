const fs = require('fs');
let content = fs.readFileSync('src/engine/PlaybackEngineFactory.ts', 'utf8');

const replacement = `import { PlaybackEngine } from './types';
import { ReactPlayerEngine } from './ReactPlayerEngine';
import { NativeAudioEngine } from './NativeAudioEngine';
import { Capacitor } from '@capacitor/core';

// Feature Flag to switch between ReactPlayer and NativeAudio
export const USE_NATIVE_AUDIO = true;

export class PlaybackEngineFactory {
  private static instance: PlaybackEngine;

  static getEngine(): PlaybackEngine {
    if (!this.instance) {
      const platform = Capacitor.getPlatform();
      
      if (USE_NATIVE_AUDIO && (platform === 'android' || platform === 'ios')) {
        console.log(\`[ENGINE_FACTORY] Using NativeAudioEngine for platform: \${platform}\`);
        this.instance = new NativeAudioEngine();
      } else {
        console.log(\`[ENGINE_FACTORY] Using ReactPlayerEngine for platform: \${platform}\`);
        this.instance = new ReactPlayerEngine();
      }
    }
    return this.instance;
  }
}
`;

fs.writeFileSync('src/engine/PlaybackEngineFactory.ts', replacement, 'utf8');
console.log("Patched Factory successfully");
