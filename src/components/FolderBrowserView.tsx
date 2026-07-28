import React, { useMemo } from 'react';
import { Folder, FolderOpen, Music, HardDrive } from 'lucide-react';
import { Track } from '../domain/types';
import { TrackList } from './TrackList';

interface FolderBrowserProps {
  tracks: Track[];
  currentTrackId?: string;
  isPlaying?: boolean;
  onPlayTrack: (track: Track, tracks: Track[]) => void;
  onToggleFavorite: (trackId: string) => void;
}

export const FolderBrowserView: React.FC<FolderBrowserProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  onToggleFavorite,
}) => {
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(null);

  // Group tracks by folderPath
  const folders = useMemo(() => {
    const map = new Map<string, Track[]>();
    tracks.forEach((t) => {
      const folder = t.folderPath || 'Música Local';
      if (!map.has(folder)) map.set(folder, []);
      map.get(folder)!.push(t);
    });
    return Array.from(map.entries());
  }, [tracks]);

  if (folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-neutral-900/30 rounded-2xl border border-neutral-800/40">
        <Folder className="w-12 h-12 text-neutral-600 mb-3 stroke-1" />
        <h3 className="text-sm font-semibold text-neutral-300 mb-1">Sin Carpetas Locales</h3>
        <p className="text-xs text-neutral-500 max-w-sm">
          Aún no se han importado carpetas del dispositivo. Usa la sección 'Importar Música' para seleccionar carpetas o archivos de audio.
        </p>
      </div>
    );
  }

  const activeFolderTracks = selectedFolder
    ? tracks.filter((t) => (t.folderPath || 'Música Local') === selectedFolder)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Carpetas del Dispositivo ({folders.length})</h2>
        </div>
        {selectedFolder && (
          <button
            onClick={() => setSelectedFolder(null)}
            className="text-xs text-emerald-400 hover:underline font-medium"
          >
            ← Volver a todas las carpetas
          </button>
        )}
      </div>

      {!selectedFolder ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map(([folderPath, folderTracks]) => (
            <div
              key={folderPath}
              onClick={() => setSelectedFolder(folderPath)}
              className="bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800/60 hover:border-emerald-500/40 rounded-2xl p-4 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3.5 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Folder className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white truncate">{folderPath}</h3>
                  <p className="text-xs text-neutral-400">{folderTracks.length} archivos de audio</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 flex flex-col h-full min-h-0">
          <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl flex items-center gap-3">
            <FolderOpen className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-white">{selectedFolder}</h3>
              <p className="text-xs text-neutral-400">{activeFolderTracks.length} canciones encontradas</p>
            </div>
          </div>

          <TrackList
            tracks={activeFolderTracks}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            onPlayTrack={onPlayTrack}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      )}
    </div>
  );
};
