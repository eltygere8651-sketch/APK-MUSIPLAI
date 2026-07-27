import { PlaybackEngine } from './types';
import { ReactPlayerEngine } from './ReactPlayerEngine';
import { NativeAudioEngine } from './NativeAudioEngine';

// Feature Flag to switch between ReactPlayer and NativeAudio
export const USE_NATIVE_AUDIO = true;

export class PlaybackEngineFactory {
  private static instance: PlaybackEngine;

  static getEngine(): PlaybackEngine {
    if (!this.instance) {
      if (USE_NATIVE_AUDIO) {
        this.instance = new NativeAudioEngine();
      } else {
        this.instance = new ReactPlayerEngine();
      }
    }
    return this.instance;
  }
}
