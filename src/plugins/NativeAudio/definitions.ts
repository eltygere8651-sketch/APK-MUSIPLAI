import { PluginListenerHandle } from '@capacitor/core';

export interface NativeAudioPlugin {
  load(options: { url: string; title?: string; artist?: string; coverUrl?: string; position?: number }): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  seek(options: { position: number }): Promise<void>;
  setQueue(options: { items: any[] }): Promise<void>; // Optional for queue
  next(): Promise<void>;
  previous(): Promise<void>;
  destroy(): Promise<void>;

  addListener(
    eventName: 'onStateChanged',
    listenerFunc: (state: { status: string; error?: string }) => void,
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'onProgress',
    listenerFunc: (info: { position: number; duration: number }) => void,
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'onBuffering',
    listenerFunc: (info: { isBuffering: boolean }) => void,
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'onDuration',
    listenerFunc: (info: { duration: number }) => void,
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'onTrackChanged',
    listenerFunc: (info: { index: number; title?: string }) => void,
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'onRecovering',
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'onRecovered',
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'onError',
    listenerFunc: (info: { message: string; fatal: boolean }) => void,
  ): Promise<PluginListenerHandle>;
}
