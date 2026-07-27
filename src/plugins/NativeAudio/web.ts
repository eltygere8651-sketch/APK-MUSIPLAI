import { WebPlugin } from '@capacitor/core';
import type { NativeAudioPlugin } from './definitions';

export class NativeAudioWeb extends WebPlugin implements NativeAudioPlugin {
  async load(options: { url: string; title?: string; artist?: string; coverUrl?: string; position?: number }): Promise<void> {
    console.log('NativeAudio load', options);
  }
  async play(): Promise<void> { console.log('NativeAudio play'); }
  async pause(): Promise<void> { console.log('NativeAudio pause'); }
  async resume(): Promise<void> { console.log('NativeAudio resume'); }
  async stop(): Promise<void> { console.log('NativeAudio stop'); }
  async seek(options: { position: number }): Promise<void> { console.log('NativeAudio seek', options); }
  async setQueue(options: { items: any[] }): Promise<void> { console.log('NativeAudio setQueue', options); }
  async next(): Promise<void> { console.log('NativeAudio next'); }
  async previous(): Promise<void> { console.log('NativeAudio previous'); }
  async destroy(): Promise<void> { console.log('NativeAudio destroy'); }
}
