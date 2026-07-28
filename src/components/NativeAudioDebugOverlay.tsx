import React, { useState } from 'react';

export const DEBUG_NATIVE_AUDIO = true;

export interface NativeDebugData {
  videoId: string | null;
  originalUrl: string | null;
  finalUrl: string | null;
  httpResponseCode: string | number | null;
  media3State: string | null;
  isPlaying: boolean | null;
  playWhenReady: boolean | null;
  bufferedPosition: number | null;
  currentPosition: number | null;
  errorMessage: string | null;
  playbackException: string | null;
  onPlayerError: string | null;
  stackTrace: string | null;
  lastUpdated: string | null;
  dataSourceInstrumentation?: Record<string, any> | null;
}

interface Props {
  debugData: NativeDebugData;
  onRefreshNative?: () => void;
  onTestFetch?: () => void;
}

export const NativeAudioDebugOverlay: React.FC<Props> = ({
  debugData,
  onRefreshNative,
  onTestFetch
}) => {
  const [minimized, setMinimized] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!DEBUG_NATIVE_AUDIO) return null;

  const handleCopy = () => {
    const fullText = JSON.stringify(debugData, null, 2);
    navigator.clipboard?.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isError = Boolean(debugData.errorMessage || debugData.onPlayerError || debugData.playbackException);

  if (minimized) {
    return (
      <div className="fixed bottom-3 right-3 z-[99999] bg-black/90 border border-amber-500/80 text-amber-300 rounded-lg p-2 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-mono">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
        <span className="font-bold">DEBUG MEDIA3</span>
        {isError && <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">ERROR</span>}
        <button
          onClick={() => setMinimized(false)}
          className="bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 px-2 py-1 rounded text-xs ml-1 font-sans cursor-pointer"
        >
          Expandir 🔍
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 max-h-[85vh] z-[99999] bg-slate-950/95 border-t-2 border-amber-500 text-slate-100 font-mono text-xs overflow-y-auto shadow-2xl backdrop-blur-md p-3 sm:p-4 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isError ? 'bg-red-500 animate-ping' : debugData.isPlaying ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
          <span className="font-bold text-amber-400 text-sm">
            🛠️ DEBUG NATIVE AUDIO (Android Media3)
          </span>
          <span className="text-[10px] text-slate-400">
            {debugData.lastUpdated ? `Actualizado: ${debugData.lastUpdated}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onTestFetch && (
            <button
              onClick={onTestFetch}
              className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/50 px-2 py-1 rounded text-[11px] font-sans transition cursor-pointer"
            >
              Test HEAD HTTP
            </button>
          )}
          {onRefreshNative && (
            <button
              onClick={onRefreshNative}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded text-[11px] font-sans border border-slate-700 transition cursor-pointer"
            >
              Consultar Media3
            </button>
          )}
          <button
            onClick={handleCopy}
            className="bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 px-2 py-1 rounded text-[11px] font-sans transition cursor-pointer"
          >
            {copied ? '¡Copiado!' : 'Copiar Log'}
          </button>
          <button
            onClick={() => setMinimized(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[11px] font-sans cursor-pointer"
          >
            Minimizar _
          </button>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] leading-relaxed">
        {/* Video ID */}
        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block font-semibold">Video ID:</span>
          <span className="text-amber-300 select-all break-all">{debugData.videoId || 'null'}</span>
        </div>

        {/* Media3 State & Flags */}
        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block font-semibold">Estado Media3:</span>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
              debugData.media3State === 'STATE_READY' || debugData.media3State === 'PLAYING'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : debugData.media3State === 'STATE_BUFFERING' || debugData.media3State === 'BUFFERING'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {debugData.media3State || 'STATE_UNKNOWN'}
            </span>
            <span className="text-slate-300">
              isPlaying: <strong className={debugData.isPlaying ? 'text-emerald-400' : 'text-rose-400'}>{String(debugData.isPlaying)}</strong>
            </span>
            <span className="text-slate-300">
              playWhenReady: <strong className="text-sky-300">{String(debugData.playWhenReady)}</strong>
            </span>
          </div>
        </div>

        {/* Positions */}
        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block font-semibold">Posiciones:</span>
          <div className="flex gap-4 text-slate-300 mt-0.5">
            <span>currentPosition: <strong className="text-cyan-300">{debugData.currentPosition ?? 0} ms</strong></span>
            <span>bufferedPosition: <strong className="text-purple-300">{debugData.bufferedPosition ?? 0} ms</strong></span>
          </div>
        </div>

        {/* HTTP Response Code */}
        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block font-semibold">HTTP Response Code:</span>
          <span className={`font-bold ${
            String(debugData.httpResponseCode).startsWith('2')
              ? 'text-emerald-400'
              : debugData.httpResponseCode
              ? 'text-rose-400'
              : 'text-slate-400'
          }`}>
            {debugData.httpResponseCode !== null && debugData.httpResponseCode !== undefined
              ? String(debugData.httpResponseCode)
              : 'Sin registrar'}
          </span>
        </div>

        {/* Original URL */}
        <div className="bg-slate-900/80 p-2 rounded border border-slate-800 md:col-span-2">
          <span className="text-slate-400 block font-semibold">URL Original (currentUrl):</span>
          <span className="text-slate-300 select-all break-all text-[10px]">{debugData.originalUrl || 'null'}</span>
        </div>

        {/* Final URL */}
        <div className="bg-slate-900/80 p-2 rounded border border-slate-800 md:col-span-2">
          <span className="text-slate-400 block font-semibold">URL Final (audioUrl Media3):</span>
          <span className="text-sky-300 select-all break-all text-[10px]">{debugData.finalUrl || 'null'}</span>
        </div>

        {/* DataSource Instrumentation */}
        {debugData.dataSourceInstrumentation && (
          <div className="bg-slate-900/90 p-2.5 rounded border border-amber-500/50 md:col-span-2 text-amber-200">
            <span className="text-amber-400 font-bold block mb-1">📡 DATASOURCE INSTRUMENTATION (ExoPlayer Stream Inspection):</span>
            <pre className="bg-black/90 p-2 rounded text-[10px] text-amber-300 overflow-x-auto whitespace-pre-wrap select-all border border-amber-900/50">
              {JSON.stringify(debugData.dataSourceInstrumentation, null, 2)}
            </pre>
          </div>
        )}

        {/* Errors Section */}
        {isError && (
          <div className="bg-rose-950/50 p-2.5 rounded border border-rose-800/80 md:col-span-2 text-rose-200">
            <span className="text-rose-300 font-bold block mb-1">⚠️ DETALLES DEL ERROR:</span>
            
            {debugData.errorMessage && (
              <div className="mb-1">
                <strong className="text-rose-400">Mensaje de Error:</strong> {debugData.errorMessage}
              </div>
            )}

            {debugData.onPlayerError && (
              <div className="mb-1">
                <strong className="text-rose-400">onPlayerError():</strong> {debugData.onPlayerError}
              </div>
            )}

            {debugData.playbackException && (
              <div className="mb-1">
                <strong className="text-rose-400">PlaybackException Completa:</strong> {debugData.playbackException}
              </div>
            )}

            {debugData.stackTrace && (
              <div className="mt-2">
                <strong className="text-rose-400 block mb-0.5">Stack Trace:</strong>
                <pre className="bg-black/80 p-2 rounded text-[9px] text-rose-300 overflow-x-auto max-h-40 whitespace-pre-wrap select-all">
                  {debugData.stackTrace}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
