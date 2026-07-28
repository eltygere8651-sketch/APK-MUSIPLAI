export type AudioFormat = 'mp3' | 'aac' | 'm4a' | 'flac' | 'wav' | 'ogg' | 'opus' | 'm3u' | 'm3u8' | 'unknown';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  url: string; // Blob URL, Data URL, or Http URL
  artworkUrl?: string;
  format?: AudioFormat;
  bitrate?: number;
  fileSize?: number;
  addedAt: number;
  folderPath?: string;
  isFavorite?: boolean;
  playCount?: number;
  lastPlayedAt?: number;
  sourceType: 'local_file' | 'folder' | 'imported_playlist' | 'web_stream' | 'youtube';
  youtubeId?: string;
  createdAt?: number;
  spotifyId?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
  sourceFormat?: 'custom' | 'm3u' | 'm3u8' | 'pls' | 'spotify_structure' | 'yt_structure';
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  year?: number;
  trackCount: number;
}

export interface Artist {
  id: string;
  name: string;
  avatarUrl?: string;
  trackCount: number;
}

export interface FolderItem {
  id: string;
  path: string;
  name: string;
  trackCount: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  playbackRate: number;
  bufferedPosition: number;
  error: string | null;
}

export interface QueueItem {
  track: Track;
  originalIndex: number;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'amoled';
  crossfadeDuration: number; // 0 = off, 1-12 seconds
  gaplessPlayback: boolean;
  replayGain: boolean;
  autoResume: boolean;
  offlineOnly: boolean;
  highQualityAudio: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}
