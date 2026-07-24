export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  duration: string;
  url?: string;
  description?: string;
  artwork_url?: string;
  thumbnail?: string;
  artwork?: string;
}

export interface MusicPlaylist {
  id: string;
  name: string;
  genre: string;
  description: string;
  icon: string;
  thumbnail_url?: string;
  tracks: MusicTrack[];
  ownerId?: string;
  path?: string;
  isAdminContent?: boolean;
  createdAt?: any;
  updatedAt?: any;
  folder?: string | null;
  orderScore?: number;
}
