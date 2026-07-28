import { Playlist, Track } from '../types';

export interface StructureImportResponse {
  playlist: Playlist;
  tracks: Track[];
  summary: string;
}

export class StructureImporter {
  public static async importPublicPlaylistStructure(url: string): Promise<StructureImportResponse> {
    const trimmed = url.trim();
    
    if (!trimmed) {
      throw new Error('Proporciona un enlace público válido');
    }

    const response = await fetch(`/api/import-link?url=${encodeURIComponent(trimmed)}`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'No se pudo importar el enlace');
    }

    const data = await response.json();
    return {
      playlist: data.playlist,
      tracks: data.tracks || [],
      summary: data.summary || `Se ha importado "${data.playlist?.name}" correctamente.`
    };
  }
}
