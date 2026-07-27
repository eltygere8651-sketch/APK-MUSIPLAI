import React, { useState, useEffect, useRef } from 'react';
import { diagnostics, DiagnosticsReport } from '../../engine/NativeAudioDiagnostics';
import { NativeAudioEngine } from '../../engine/NativeAudioEngine';

export function DiagnosticsPanel() {
  const [report, setReport] = useState<DiagnosticsReport>(diagnostics.getReport());
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [stressProgress, setStressProgress] = useState(0);
  const [stressLog, setStressLog] = useState<string[]>([]);
  const engineRef = useRef<NativeAudioEngine | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setReport(diagnostics.getReport());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!engineRef.current) {
        engineRef.current = new NativeAudioEngine();
    }
    return () => {
        engineRef.current?.destroy();
    }
  }, []);

  const addStressLog = (msg: string) => {
    setStressLog(prev => [msg, ...prev].slice(0, 50));
  };

  const runStressTest = async () => {
    if (isStressTesting || !engineRef.current) return;
    setIsStressTesting(true);
    setStressProgress(0);
    setStressLog([]);
    diagnostics.reset();
    
    addStressLog('Starting stress test...');
    const engine = engineRef.current;
    
    try {
      // 100 track changes
      addStressLog('Phase 1: 100 track changes...');
      for (let i = 0; i < 100; i++) {
        await engine.load({ url: 'test-track-' + i });
        setStressProgress((i / 100) * 20);
        await new Promise(r => setTimeout(r, 10)); 
      }

      // 100 pauses and resumes
      addStressLog('Phase 2: 100 pauses & resumes...');
      for (let i = 0; i < 100; i++) {
        await engine.pause();
        await new Promise(r => setTimeout(r, 10)); 
        await engine.resume();
        setStressProgress(20 + (i / 100) * 30);
        await new Promise(r => setTimeout(r, 10)); 
      }

      // 100 seeks
      addStressLog('Phase 3: 100 seeks...');
      for (let i = 0; i < 100; i++) {
        await engine.seek({ position: Math.random() * 100000 });
        setStressProgress(50 + (i / 100) * 30);
        await new Promise(r => setTimeout(r, 10)); 
      }

      // 50 simulated recoveries
      addStressLog('Phase 4: 50 recoveries...');
      for (let i = 0; i < 50; i++) {
        // Simulate error and recovery
        diagnostics.updateState('ERROR_FATAL');
        diagnostics.updateState('RECOVERING');
        await new Promise(r => setTimeout(r, 50)); 
        diagnostics.updateState('PLAYING');
        setStressProgress(80 + (i / 50) * 20);
      }

      addStressLog('Stress test completed successfully.');
      setStressProgress(100);
    } catch (e: any) {
      addStressLog(`Stress test failed: ${e.message}`);
    } finally {
      setIsStressTesting(false);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    return `${m}m ${s % 60}s`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-gray-950 text-gray-100 min-h-screen font-mono">
      <h1 className="text-2xl font-bold mb-6 text-cyan-400">Native Audio Diagnostics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded p-4">
          <h2 className="text-lg font-semibold mb-3 border-b border-gray-800 pb-2 text-cyan-300">Performance Metrics</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-400">Total Play Time:</span>
            <span className="text-right text-green-400">{formatTime(report.totalPlayTimeMs)}</span>
            
            <span className="text-gray-400">Buffering Time:</span>
            <span className="text-right text-yellow-400">{formatTime(report.totalBufferingTimeMs)}</span>
            
            <span className="text-gray-400">Avg Recovery Time:</span>
            <span className="text-right text-orange-400">{formatTime(report.avgRecoveryTimeMs)}</span>
            
            <span className="text-gray-400">Max Recovery Time:</span>
            <span className="text-right text-orange-400">{formatTime(report.maxRecoveryTimeMs)}</span>
            
            <span className="text-gray-400">RAM Usage (Approx):</span>
            <span className="text-right text-blue-400">{report.memoryUsageApproxMb} MB</span>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded p-4">
          <h2 className="text-lg font-semibold mb-3 border-b border-gray-800 pb-2 text-cyan-300">Action Counters</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-400">Pauses:</span>
            <span className="text-right">{report.pauseCount}</span>
            
            <span className="text-gray-400">Seeks:</span>
            <span className="text-right">{report.seekCount}</span>
            
            <span className="text-gray-400">Recoveries:</span>
            <span className="text-right">{report.recoveryCount}</span>
            
            <span className="text-gray-400">Recovered Errors:</span>
            <span className="text-right text-green-400">{report.recoveredErrorCount}</span>
            
            <span className="text-gray-400">Fatal Errors:</span>
            <span className="text-right text-red-500">{report.fatalErrorCount}</span>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded p-4">
          <h2 className="text-lg font-semibold mb-3 border-b border-gray-800 pb-2 text-cyan-300">Interruptions</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-400">Network to Data:</span>
            <span className="text-right">{report.networkChangesToData}</span>
            
            <span className="text-gray-400">Network to WiFi:</span>
            <span className="text-right">{report.networkChangesToWifi}</span>
            
            <span className="text-gray-400">Call Interruptions:</span>
            <span className="text-right">{report.callInterruptions}</span>
            
            <span className="text-gray-400">Bluetooth Dropouts:</span>
            <span className="text-right">{report.bluetoothInterruptions}</span>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => diagnostics.logNetworkChange('data')} className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded">Simulate Data</button>
            <button onClick={() => diagnostics.logNetworkChange('wifi')} className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded">Simulate WiFi</button>
            <button onClick={() => { diagnostics.logEvent('Call interrupted'); diagnostics.updateState('PAUSED'); }} className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded">Simulate Call</button>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-3 border-b border-gray-800 pb-2 text-cyan-300">Stress Test</h2>
          <div className="flex-1 flex flex-col gap-3 justify-center">
            <button 
              onClick={runStressTest}
              disabled={isStressTesting}
              className={`w-full py-2 rounded font-bold ${isStressTesting ? 'bg-gray-800 text-gray-500' : 'bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-800/50'}`}
            >
              {isStressTesting ? 'RUNNING TEST...' : 'RUN EXTREME STRESS TEST'}
            </button>
            
            {isStressTesting && (
              <div className="w-full bg-gray-800 rounded-full h-2.5">
                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${stressProgress}%` }}></div>
              </div>
            )}
            
            <div className="h-20 overflow-y-auto text-xs text-gray-500 bg-black/50 p-2 rounded">
              {stressLog.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded p-4">
        <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
          <h2 className="text-lg font-semibold text-cyan-300">System Event Log</h2>
          <button onClick={() => diagnostics.reset()} className="text-xs text-gray-400 hover:text-white">Clear & Reset All</button>
        </div>
        <div className="h-64 overflow-y-auto font-mono text-xs space-y-1">
          {report.systemEvents.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No events logged yet.</div>
          ) : (
            [...report.systemEvents].reverse().map((event, i) => (
              <div key={i} className={`${event.includes('ERROR') ? 'text-red-400' : event.includes('RECOVERING') ? 'text-orange-400' : event.includes('PLAYING') ? 'text-green-400' : 'text-gray-300'}`}>
                {event}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
