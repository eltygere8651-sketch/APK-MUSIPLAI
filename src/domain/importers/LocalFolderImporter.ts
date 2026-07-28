import { Track, AudioFormat } from '../types';

export class LocalFolderImporter {
  public static readonly SUPPORTED_EXTENSIONS = ['mp3', 'aac', 'm4a', 'flac', 'wav', 'ogg', 'opus'];

  public static isSupportedAudioFile(file: File): boolean {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return this.SUPPORTED_EXTENSIONS.includes(ext) || file.type.startsWith('audio/');
  }

  public static getFormatFromExtension(fileName: string): AudioFormat {
    const ext = fileName.split('.').pop()?.toLowerCase() as AudioFormat;
    return this.SUPPORTED_EXTENSIONS.includes(ext as string) ? ext : 'unknown';
  }

  public static getMimeType(fileName: string, fileType?: string): string {
    if (fileType && fileType.startsWith('audio/') && fileType !== 'audio/mp3') {
      return fileType;
    }
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'mp3': return 'audio/mpeg';
      case 'wav': return 'audio/wav';
      case 'ogg': return 'audio/ogg';
      case 'm4a': return 'audio/mp4';
      case 'aac': return 'audio/aac';
      case 'flac': return 'audio/flac';
      case 'opus': return 'audio/opus';
      case 'webm': return 'audio/webm';
      default: return 'audio/mpeg';
    }
  }

  public static fileToDataUrl(file: File | Blob, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        let result = reader.result as string;
        const mimeType = LocalFolderImporter.getMimeType(fileName, file.type);
        if (result.startsWith('data:application/octet-stream') || result.startsWith('data:;base64') || !result.includes('audio/')) {
          result = result.replace(/^data:[^;]*;/, `data:${mimeType};`);
        }
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  public static processFile(file: File, folderPath: string = '/'): Track {
    const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    
    // Parse metadata from filename pattern "Artist - Title" if present
    let artist = 'Artista Desconocido';
    let title = fileNameWithoutExt;

    if (fileNameWithoutExt.includes(' - ')) {
      const parts = fileNameWithoutExt.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }

    return {
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      artist,
      duration: 0, // Will be updated automatically on initial playback metadata load
      url: '',
      format: this.getFormatFromExtension(file.name),
      fileSize: file.size,
      folderPath,
      addedAt: Date.now(),
      sourceType: 'local_file',
      isFavorite: false,
    };
  }

  public static processFileList(files: FileList | File[], defaultFolderPath: string = 'Música Local'): Track[] {
    return this.processFileListWithFiles(files, defaultFolderPath).map(item => item.track);
  }

  public static processFileListWithFiles(files: FileList | File[], defaultFolderPath: string = 'Música Local'): { track: Track; file: File }[] {
    const items: { track: Track; file: File }[] = [];
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      if (this.isSupportedAudioFile(file)) {
        const relativePath = (file as any).webkitRelativePath || file.name;
        const pathFolder = relativePath.includes('/') 
          ? relativePath.substring(0, relativePath.lastIndexOf('/')) 
          : defaultFolderPath;

        const track = this.processFile(file, pathFolder);
        items.push({ track, file });
      }
    }

    return items;
  }
}
