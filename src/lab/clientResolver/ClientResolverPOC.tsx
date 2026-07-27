import React, { useState } from 'react';
import { Innertube } from 'youtubei.js';

export default function ClientResolverPOC() {
  const [videoId, setVideoId] = useState('jNQXAC9IVRw');
  const [log, setLog] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState('');

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const testResolve = async () => {
    setLog([]);
    setAudioUrl('');
    try {
      addLog('Iniciando youtubei.js en cliente...');
      const start = Date.now();
      const yt = await Innertube.create({
        generate_session_locally: true,
      });
      addLog(`Innertube inicializado en ${Date.now() - start}ms`);
      
      addLog('Solicitando info de ' + videoId);
      const infoStart = Date.now();
      const info = await yt.getInfo(videoId);
      addLog(`Info obtenida en ${Date.now() - infoStart}ms`);
      
      addLog('Playability: ' + info.playability_status?.status);
      
      const formats = info.streaming_data?.adaptive_formats || [];
      const m4a = formats.find((f: any) => f.itag === 140) || formats.find((f: any) => f.itag === 251);
      
      if (m4a) {
        addLog(`Formato encontrado: itag ${m4a.itag}, mime: ${m4a.mime_type}`);
        addLog(`Tamaño: ${m4a.content_length ? (m4a.content_length / 1024 / 1024).toFixed(2) + 'MB' : 'desconocido'}`);
        addLog(`Duración (aprox): ${m4a.approx_duration_ms ? (m4a.approx_duration_ms / 1000).toFixed(2) + 's' : 'desconocido'}`);
        
        const url = m4a.url || (m4a.decipher ? m4a.decipher(yt.session.player) : null);
        if (url) {
          addLog(`URL obtenida correctamente`);
          setAudioUrl(url);
          
          // Test HEAD
          try {
            const headStart = Date.now();
            const headRes = await fetch(url, { method: 'HEAD' });
            addLog(`HEAD status: ${headRes.status} (${Date.now() - headStart}ms)`);
            addLog(`Content-Type: ${headRes.headers.get('content-type')}`);
            addLog(`Content-Length: ${headRes.headers.get('content-length')}`);
            addLog(`Accept-Ranges: ${headRes.headers.get('accept-ranges')}`);
          } catch (e: any) {
             addLog('HEAD request failed (posiblemente CORS de video en web, en Capacitor debería pasar): ' + e.message);
          }
        } else {
          addLog('No se pudo obtener URL o descifrar.');
        }
      } else {
        addLog('No se encontró formato de audio');
      }
    } catch (e: any) {
      addLog('ERROR: ' + e.message);
    }
  };

  return (
    <div className="p-4 bg-zinc-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-zinc-100">Client Resolver POC</h1>
      <p className="text-zinc-400 mb-6 text-sm">
        Esta herramienta resuelve la URL directamente desde el dispositivo sin pasar por el backend.
        <br/>
        En Android/iOS (Capacitor) el CORS es ignorado. En Web puede fallar.
      </p>
      
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <input 
          type="text" 
          value={videoId} 
          onChange={e => setVideoId(e.target.value)} 
          className="bg-zinc-800 text-zinc-100 p-3 rounded-lg border border-zinc-700 focus:outline-none focus:border-zinc-500 w-full sm:w-64"
          placeholder="Video ID"
        />
        <button 
          onClick={testResolve} 
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Resolver
        </button>
      </div>
      
      {audioUrl && (
        <div className="mb-6 bg-zinc-800 p-4 rounded-xl border border-zinc-700">
          <h3 className="font-bold mb-3 text-emerald-400">Reproductor HTML5 (Prueba):</h3>
          <audio controls src={audioUrl} className="w-full" />
          <div className="mt-2 text-xs text-zinc-500 truncate" title={audioUrl}>
            URL: {audioUrl.substring(0, 80)}...
          </div>
        </div>
      )}

      <div className="bg-black p-4 rounded-xl border border-zinc-800 font-mono text-xs sm:text-sm h-80 overflow-y-auto space-y-1 shadow-inner">
        {log.length === 0 && <span className="text-zinc-600">No hay logs todavía...</span>}
        {log.map((l, i) => (
          <div key={i} className={l.includes('ERROR') ? 'text-red-400' : l.includes('SUCCESS') || l.includes('correctamente') ? 'text-emerald-400' : 'text-zinc-300'}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
