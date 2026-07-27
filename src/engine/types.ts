import React from 'react';

export interface PlaybackState {
  status: 'IDLE' | 'LOADING' | 'BUFFERING' | 'PLAYING' | 'PAUSED' | 'RECOVERING' | 'STOPPED' | 'ERROR_FATAL';
  position: number;
  duration: number;
  volume: number;
  playbackRate: number;
}

export type EngineEvent = 
  | 'PLAYING' | 'PAUSED' | 'BUFFERING' | 'STOPPED' 
  | 'RECOVERING' | 'ERROR' | 'TRACK_CHANGED' | 'PROGRESS' | 'STATE_CHANGED';

export interface PlaybackEngine {
  load(options: { url: string; title?: string; artist?: string; coverUrl?: string; position?: number }): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  seek(options: { position: number }): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  setQueue(options: { items: any[] }): Promise<void>;
  setVolume(volume: number): Promise<void>;
  setPlaybackRate(rate: number): Promise<void>;
  destroy(): Promise<void>;
  getState(): PlaybackState;
  
  on(event: EngineEvent, callback: (...args: any[]) => void): void;
  off(event: EngineEvent, callback: (...args: any[]) => void): void;
  
  render?(context?: any): React.ReactNode;
}
