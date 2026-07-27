import React, { useState, useEffect } from "react";
import { NativeAudio } from "../plugins/NativeAudio";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel";
import { CertificationPanel } from "./components/CertificationPanel";

interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "error" | "success" | "warning";
}

export default function SandboxApp() {
  const [activeTab, setActiveTab] = useState<"sandbox" | "diagnostics" | "certification">("sandbox");
  const [url, setUrl] = useState("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
  const [status, setStatus] = useState("IDLE");
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [seekTarget, setSeekTarget] = useState(0);

  const addLog = (message: string, type: "info" | "error" | "success" | "warning" = "info") => {
    const timestamp = new Date().toISOString().split("T")[1].slice(0, -1);
    setLogs((prev) => [{ timestamp, message, type }, ...prev]);
  };

  useEffect(() => {
    if (activeTab !== "sandbox") return;
    
    let listeners: any[] = [];
    const setup = async () => {
      try {
        listeners.push(await NativeAudio.addListener("onStateChanged", (state) => {
          setStatus(state.status);
          addLog(`State changed: ${state.status}`, "info");
        }));
        listeners.push(await NativeAudio.addListener("onProgress", (info) => {
          setPosition(info.position);
          setDuration(info.duration);
        }));
        listeners.push(await NativeAudio.addListener("onBuffering", (info) => {
          setIsBuffering(info.isBuffering);
          addLog(`Buffering: ${info.isBuffering}`, "warning");
        }));
        listeners.push(await NativeAudio.addListener("onError", (info) => {
          addLog(`Error: ${info.message} (Fatal: ${info.fatal})`, "error");
          if (info.message && info.message.includes("403")) {
            handleSimulatedSelfHealing();
          }
        }));
        addLog("Plugin listeners registered.", "success");
      } catch (e: any) {
        addLog(`Failed to register listeners: ${e.message}`, "error");
      }
    };
    setup();
    return () => {
      listeners.forEach(l => l.remove().catch(()=>{}));
    };
  }, [activeTab]);

  const handleSimulatedSelfHealing = async () => {
    addLog("Initiating Simulated Self-Healing...", "warning");
    setStatus("RECOVERING");
    
    // Save position
    const savedPos = position;
    addLog(`Saved position: ${savedPos}ms`, "info");
    
    // Wait 1 second
    await new Promise(r => setTimeout(r, 1000));
    
    // Inject simulated URL
    const newUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
    addLog(`Injected new URL: ${newUrl}`, "success");
    
    // Load new URL
    await NativeAudio.load({ url: newUrl, title: "Recovered Track", artist: "Sandbox" });
    
    // Seek
    await NativeAudio.seek({ position: savedPos });
    addLog(`Seeked to ${savedPos}ms`, "info");
    
    // Resume
    await NativeAudio.play();
    addLog("Self-healing complete. Resumed.", "success");
  };

  const handleLoad = async () => {
    try {
      addLog(`Loading URL: ${url}`, "info");
      await NativeAudio.load({ url, title: "Sandbox Test", artist: "Unknown" });
      addLog("Load successful", "success");
    } catch (e: any) {
      addLog(`Load failed: ${e.message}`, "error");
    }
  };

  const handlePlay = async () => {
    try {
      await NativeAudio.play();
      addLog("Play command sent", "info");
    } catch (e: any) {
      addLog(`Play failed: ${e.message}`, "error");
    }
  };

  const handlePause = async () => {
    try {
      await NativeAudio.pause();
      addLog("Pause command sent", "info");
    } catch (e: any) {
      addLog(`Pause failed: ${e.message}`, "error");
    }
  };

  const handleStop = async () => {
    try {
      await NativeAudio.stop();
      addLog("Stop command sent", "info");
    } catch (e: any) {
      addLog(`Stop failed: ${e.message}`, "error");
    }
  };

  const handleSeek = async () => {
    try {
      await NativeAudio.seek({ position: seekTarget * 1000 });
      addLog(`Seek command sent to ${seekTarget}s`, "info");
    } catch (e: any) {
      addLog(`Seek failed: ${e.message}`, "error");
    }
  };

  const handleSimulate403 = () => {
    addLog("Simulating 403 Error manually...", "error");
    handleSimulatedSelfHealing();
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-5xl mx-auto pt-6 px-6">
        <div className="flex gap-4 border-b border-zinc-800 pb-2 mb-6">
          <button 
            onClick={() => setActiveTab("sandbox")}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === "sandbox" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Basic Sandbox
          </button>
          <button 
            onClick={() => setActiveTab("diagnostics")}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === "diagnostics" ? "bg-zinc-800 text-cyan-400" : "text-zinc-500 hover:text-cyan-600"}`}
          >
            Diagnostics & Stress Test
          </button>
          <button 
            onClick={() => setActiveTab("certification")}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === "certification" ? "bg-zinc-800 text-purple-400" : "text-zinc-500 hover:text-purple-600"}`}
          >
            Certification
          </button>
        </div>
      </div>
      
      {activeTab === "sandbox" ? (
        <div className="p-6 max-w-5xl mx-auto font-sans pt-0">
          <h1 className="text-3xl font-bold mb-2">Native Audio Sandbox 🧪</h1>
          <p className="text-zinc-400 mb-8">Isolated testing environment for the Capacitor NativeAudio plugin.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <h2 className="font-semibold mb-4 text-xl">1. Configuration</h2>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Audio URL</label>
                  <input 
                    type="text" 
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded p-2 text-sm w-full outline-none focus:border-blue-500"
                  />
                  <button onClick={handleLoad} className="bg-blue-600 hover:bg-blue-700 p-2 rounded text-sm font-medium mt-2">
                    Load Track
                  </button>
                </div>
              </div>
              
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <h2 className="font-semibold mb-4 text-xl">2. Controls</h2>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={handlePlay} className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded">Play</button>
                  <button onClick={handlePause} className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded">Pause</button>
                  <button onClick={handleStop} className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded">Stop</button>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <input 
                    type="number" 
                    value={seekTarget}
                    onChange={e => setSeekTarget(Number(e.target.value))}
                    className="bg-zinc-950 border border-zinc-800 rounded p-2 text-sm w-24"
                    placeholder="Secs"
                  />
                  <button onClick={handleSeek} className="bg-zinc-800 hover:bg-zinc-700 px-4 rounded text-sm">
                    Seek (s)
                  </button>
                </div>
                
                <div className="mt-4">
                  <button onClick={handleSimulate403} className="bg-red-600/20 text-red-400 hover:bg-red-600/40 border border-red-900/50 p-2 rounded text-sm w-full">
                    Simulate 403 Error & Recovery
                  </button>
                </div>
              </div>
              
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <h2 className="font-semibold mb-4 text-xl">3. Player State</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500 block text-xs">STATUS</span>
                    <span className={`font-bold ${status === 'PLAYING' ? 'text-green-400' : 'text-white'}`}>{status}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-xs">BUFFERING</span>
                    <span>{isBuffering ? "YES" : "NO"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-xs">POSITION</span>
                    <span>{(position / 1000).toFixed(1)}s</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-xs">DURATION</span>
                    <span>{(duration / 1000).toFixed(1)}s</span>
                  </div>
                </div>
                <div className="mt-4 w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all" 
                    style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-black border border-zinc-800 rounded-xl flex flex-col h-[600px] overflow-hidden">
              <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
                <span className="font-semibold text-sm">Event Console</span>
                <button onClick={() => setLogs([])} className="text-xs text-zinc-500 hover:text-white">Clear</button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto font-mono text-xs flex flex-col-reverse">
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
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "diagnostics" ? (
        <DiagnosticsPanel />
      ) : (
        <CertificationPanel />
      )}
    </div>
  );
}
