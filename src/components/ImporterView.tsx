import React, { useState } from 'react';
import { Upload, FolderPlus, FileText, Link, Check, AlertCircle, Music, FileAudio } from 'lucide-react';
import { LocalFolderImporter } from '../domain/importers/LocalFolderImporter';
import { M3uImporter } from '../domain/importers/M3uImporter';
import { StructureImporter } from '../domain/importers/StructureImporter';
import { Track, Playlist } from '../domain/types';

interface ImporterViewProps {
  onImportTracks: (tracksWithFiles: { track: Track; blob?: Blob }[]) => void;
  onImportPlaylist: (playlist: Playlist, tracks?: Track[]) => void;
  onClose?: () => void;
}

export const ImporterView: React.FC<ImporterViewProps> = ({
  onImportTracks,
  onImportPlaylist,
  onClose,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File Drag & Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = async (files: File[]) => {
    let importedTracksCount = 0;
    const audioFiles: File[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (['m3u', 'm3u8', 'pls'].includes(ext)) {
        const text = await file.text();
        const parsed = ext === 'pls' 
          ? M3uImporter.parsePls(text, file.name)
          : M3uImporter.parseM3u(text, file.name);

        const newPlaylist: Playlist = {
          id: `m3u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: parsed.playlistName,
          trackIds: parsed.tracks.map(t => t.id!),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          sourceFormat: ext as any,
        };

        const convertedTracks: Track[] = parsed.tracks.map(t => ({
          id: t.id!,
          title: t.title || 'Pista',
          artist: t.artist || 'Desconocido',
          duration: t.duration || 0,
          url: t.url || '',
          addedAt: Date.now(),
          sourceType: 'imported_playlist',
        }));

        onImportPlaylist(newPlaylist, convertedTracks);
        setStatusMessage({ type: 'success', text: `Playlist M3U "${parsed.playlistName}" importada.` });
      } else if (LocalFolderImporter.isSupportedAudioFile(file)) {
        audioFiles.push(file);
      }
    }

    if (audioFiles.length > 0) {
      const items = LocalFolderImporter.processFileListWithFiles(audioFiles);
      const itemsWithDataUrl = await Promise.all(
        items.map(async (i) => {
          const dataUrl = await LocalFolderImporter.fileToDataUrl(i.file, i.file.name);
          return {
            track: { ...i.track, url: dataUrl },
            blob: i.file,
          };
        })
      );
      onImportTracks(itemsWithDataUrl);
      importedTracksCount += items.length;
      setStatusMessage({
        type: 'success',
        text: `Se han añadido ${importedTracksCount} archivos de audio a tu biblioteca local.`
      });
    }
  };

  // Public structure URL import
  const handleStructureImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicUrl.trim()) return;

    setIsLoadingUrl(true);
    setStatusMessage(null);

    try {
      const result = await StructureImporter.importPublicPlaylistStructure(publicUrl);
      onImportPlaylist(result.playlist, result.tracks);
      setStatusMessage({ type: 'success', text: result.summary });
      setPublicUrl('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al importar la lista' });
    } finally {
      setIsLoadingUrl(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none">
      {/* Mobile Sticky Header */}
      {onClose && (
        <div className="sticky top-[env(safe-area-inset-top)] z-20 -mx-4 sm:mx-0 px-4 py-3 bg-black/90 backdrop-blur-md border-b border-neutral-800/50 sm:hidden flex items-center justify-between mb-2">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-bold text-white hover:text-emerald-400 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </div>
            <span>Biblioteca</span>
          </button>
          <span className="text-sm font-bold">Importar</span>
          <div className="w-8"></div>
        </div>
      )}

      <div className="border-b border-neutral-800/50 pb-6 mb-8 hidden sm:block">
        <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Importar Biblioteca</h2>
        <p className="text-sm text-neutral-400">
          Añade tus canciones locales o importa listas desde plataformas externas.
        </p>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-semibold mb-6 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {statusMessage.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-[24px] p-8 text-center transition-all flex flex-col items-center justify-center min-h-[300px] ${
            dragActive 
              ? 'border-emerald-400 bg-emerald-500/5' 
              : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50'
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-6 text-emerald-400">
            <Upload className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-white mb-2">Archivos Locales</h3>
          <p className="text-xs text-neutral-400 mb-8 max-w-[200px]">
            Arrastra archivos MP3, FLAC, AAC o listas M3U aquí
          </p>

          <div className="flex flex-col w-full max-w-[240px] gap-3">
            <label className="flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black font-bold text-sm px-6 py-3 rounded-full cursor-pointer transition-transform active:scale-95">
              <FileAudio className="w-4 h-4" />
              <span>Seleccionar Archivos</span>
              <input
                type="file"
                multiple
                accept="audio/*,.mp3,.flac,.wav,.m4a,.aac,.ogg,.opus,.m3u,.m3u8,.pls"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>

            <label className="flex items-center justify-center gap-2 bg-black hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-sm px-6 py-3 rounded-full cursor-pointer transition-colors">
              <FolderPlus className="w-4 h-4 text-emerald-400" />
              <span>Seleccionar Carpeta</span>
              <input
                type="file"
                {...({ webkitdirectory: '', directory: '' } as any)}
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Public Structure Importer */}
        <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-[24px] p-8 flex flex-col">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-6 text-emerald-400">
            <Link className="w-8 h-8" />
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2">Importar desde Enlace</h3>
          <p className="text-xs text-neutral-400 mb-8">
            Pega un enlace público de Spotify o YouTube para importar automáticamente la lista de canciones.
          </p>

          <form onSubmit={handleStructureImport} className="flex flex-col gap-4 mt-auto">
            <input
              type="url"
              value={publicUrl}
              onChange={(e) => setPublicUrl(e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              className="w-full px-4 py-3.5 bg-black border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-neutral-500 placeholder-neutral-600"
            />
            <button
              type="submit"
              disabled={isLoadingUrl || !publicUrl.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-black font-bold text-sm px-6 py-3.5 rounded-xl transition-colors"
            >
              {isLoadingUrl ? 'Procesando...' : 'Importar Lista'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
