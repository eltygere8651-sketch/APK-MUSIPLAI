import React, { useState, useEffect, useRef } from "react";
import { NativeAudio } from "./NativeAudioPlugin";

interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "error" | "success" | "warning";
}

export default function LabApp() {
  const [videoId, setVideoId] = useState("jfKfPfyJRdk"); // Lofi Girl (default test)
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [streamInfo, setStreamInfo] = useState<any>(null);
  const [status, setStatus] = useState("IDLE");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expirationCounter, setExpirationCounter] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fallback para web (para ver que la URL funciona antes de probar en nativo)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const addLog = (message: string, type: "info" | "error" | "success" | "warning" = "info") => {
    const timestamp = new Date().toISOString().split("T")[1].slice(0, -1);
    setLogs((prev) => [{ timestamp, message, type }, ...prev]);
  };

  useEffect(() => {
    // Escuchar eventos del plugin nativo si existe
    const setupListeners = async () => {
      try {
        await NativeAudio.addListener("onPlaybackStateChanged", (state) => {
          setStatus(state.status.toUpperCase());
          addLog(`Native Status: ${state.status} ${state.error ? `| Error: ${state.error}` : ""}`, state.error ? "error" : "info");
        });
        
        await NativeAudio.addListener("onPositionChanged", (info) => {
          // Loggear solo cada 10 segundos para no saturar
          if (Math.floor(info.position / 1000) % 10 === 0) {
            addLog(`Native Position: ${Math.floor(info.position / 1000)}s / ${Math.floor(info.duration / 1000)}s`);
          }
        });
      } catch (err) {
        addLog("El plugin nativo no está disponible en este entorno (solo funcionará compilado en Android/iOS).", "warning");
      }
    };
    setupListeners();
  }, []);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setExpirationCounter(0);
    timerRef.current = setInterval(() => {
      setExpirationCounter((c) => c + 1);
    }, 1000);
  };

  const fetchDirectUrl = async () => {
    try {
      addLog(`Solicitando URL directa para: ${videoId}...`);
      setStatus("FETCHING");
      setAudioUrl(null);

      // Usamos el API de Piped directamente en el lab para aislar el experimento del backend principal
      const res = await fetch(`https://pipedapi.kavin.rocks/streams/${videoId}`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      
      const data = await res.json();
      const audioStreams = data.audioStreams;
      
      if (!audioStreams || audioStreams.length === 0) {
        throw new Error("No se encontraron streams de audio para este video");
      }

      // Filtrar el mejor M4A o WebM
      const m4aStream = audioStreams.find((s: any) => s.mimeType.includes("mp4") || s.mimeType.includes("m4a"));
      const bestStream = m4aStream || audioStreams[0];

      setAudioUrl(bestStream.url);
      setStreamInfo(bestStream);
      addLog(`URL Obtenida: ${bestStream.mimeType} | Bitrate: ${bestStream.bitrate}`, "success");
      setStatus("READY");
      startTimer();
    } catch (err: any) {
      addLog(`Error obteniendo URL: ${err.message}`, "error");
      setStatus("ERROR");
    }
  };

  const playNative = async () => {
    if (!audioUrl) return addLog("No hay URL cargada", "warning");
    try {
      addLog("Enviando URL al motor nativo (Media3/AVPlayer)...", "info");
      setStatus("PLAYING (NATIVE)");
      await NativeAudio.play({ 
        url: audioUrl,
        title: "Laboratorio de Pruebas",
        artist: "Motor Nativo"
      });
      addLog("Comando PLAY ejecutado exitosamente en el puente nativo.", "success");
    } catch (err: any) {
      addLog(`Error en plugin nativo: ${err.message}. (¿Estás ejecutando en la web en lugar del móvil?)`, "error");
    }
  };

  const stopNative = async () => {
    try {
      await NativeAudio.stop();
      setStatus("STOPPED");
      addLog("Comando STOP enviado al motor nativo.");
    } catch (err: any) {
      addLog(`Error en plugin nativo: ${err.message}`, "error");
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <header className="mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-3xl font-bold text-white mb-2">🧪 Native Audio Validation Lab</h1>
        <p className="text-zinc-400">
          Laboratorio aislado para probar la viabilidad de URLs directas con Media3 (Android) y AVPlayer (iOS).
          Este entorno no interactúa con la aplicación principal.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Panel de Control */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">1. Obtención de URL</h2>
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-white outline-none focus:border-zinc-500"
              placeholder="YouTube Video ID"
            />
            <button 
              onClick={fetchDirectUrl}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              Obtener URL
            </button>
          </div>

          <h2 className="text-xl font-semibold mb-4">2. Controles de Reproducción</h2>
          <div className="flex flex-col gap-3">
            <button 
              onClick={playNative}
              disabled={!audioUrl}
              className={`p-3 rounded font-medium transition ${audioUrl ? 'bg-green-600 hover:bg-green-700' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
            >
              ▶ Reproducir (Plugin Nativo)
            </button>
            <button 
              onClick={stopNative}
              disabled={!audioUrl}
              className={`p-3 rounded font-medium transition ${audioUrl ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
            >
              ⏹ Detener (Plugin Nativo)
            </button>
          </div>

          {/* Fallback Web */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <h3 className="text-sm text-zinc-400 mb-2">Fallback de prueba web (HTML5)</h3>
            <audio 
              ref={audioRef}
              src={audioUrl || ""} 
              controls 
              className="w-full"
              onPlay={() => addLog("Reproduciendo en Fallback Web HTML5")}
              onPause={() => addLog("Pausado en Fallback Web HTML5")}
              onError={(e) => addLog(`Error HTML5: ${e.currentTarget.error?.message}`, "error")}
            />
          </div>
        </div>

        {/* Panel de Estado y Logs */}
        <div className="flex flex-col h-[600px]">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Estado</p>
              <p className={`font-mono font-bold ${status.includes("ERROR") ? "text-red-500" : "text-green-400"}`}>
                {status}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Edad de la URL</p>
              <p className="font-mono">{formatTime(expirationCounter)}</p>
            </div>
          </div>

          <div className="bg-black border border-zinc-800 rounded-xl flex-1 flex flex-col overflow-hidden">
            <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
              <span className="text-sm font-semibold">Consola de Eventos</span>
              <button 
                onClick={() => setLogs([])}
                className="text-xs text-zinc-500 hover:text-white transition"
              >
                Limpiar
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-sm flex flex-col-reverse">
              {logs.map((log, i) => (
                <div key={i} className={`mb-2 pb-2 border-b border-zinc-900 last:border-0 ${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'warning' ? 'text-yellow-400' :
                  'text-zinc-300'
                }`}>
                  <span className="text-zinc-600 mr-2">[{log.timestamp}]</span>
                  {log.message}
                </div>
              ))}
              {logs.length === 0 && <div className="text-zinc-600 text-center mt-10">Esperando eventos...</div>}
            </div>
          </div>
        </div>
      </div>

      {streamInfo && (
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Información del Stream</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-zinc-500">Formato</p>
              <p className="font-mono">{streamInfo.mimeType}</p>
            </div>
            <div>
              <p className="text-zinc-500">Bitrate</p>
              <p className="font-mono">{Math.round(streamInfo.bitrate / 1000)} kbps</p>
            </div>
            <div>
              <p className="text-zinc-500">Content Length</p>
              <p className="font-mono">{streamInfo.contentLength ? `${(parseInt(streamInfo.contentLength) / 1024 / 1024).toFixed(2)} MB` : 'Desconocido'}</p>
            </div>
            <div>
              <p className="text-zinc-500">Caducidad (aprox)</p>
              <p className="font-mono">Verificar expiración</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-zinc-500 mb-1">URL (Truncada):</p>
            <p className="font-mono text-xs text-zinc-400 break-all bg-black p-2 rounded border border-zinc-800">
              {audioUrl?.substring(0, 150)}...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
