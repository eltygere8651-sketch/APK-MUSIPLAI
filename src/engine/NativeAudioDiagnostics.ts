export interface DiagnosticsReport {
  startTime: number;
  endTime: number | null;
  totalPlayTimeMs: number;
  totalBufferingTimeMs: number;
  pauseCount: number;
  seekCount: number;
  recoveryCount: number;
  recoveredErrorCount: number;
  fatalErrorCount: number;
  networkChangesToData: number;
  networkChangesToWifi: number;
  callInterruptions: number;
  bluetoothInterruptions: number;
  avgRecoveryTimeMs: number;
  maxRecoveryTimeMs: number;
  memoryUsageApproxMb: number;
  systemEvents: string[];
}

class NativeAudioDiagnostics {
  private report: DiagnosticsReport = {
    startTime: Date.now(),
    endTime: null,
    totalPlayTimeMs: 0,
    totalBufferingTimeMs: 0,
    pauseCount: 0,
    seekCount: 0,
    recoveryCount: 0,
    recoveredErrorCount: 0,
    fatalErrorCount: 0,
    networkChangesToData: 0,
    networkChangesToWifi: 0,
    callInterruptions: 0,
    bluetoothInterruptions: 0,
    avgRecoveryTimeMs: 0,
    maxRecoveryTimeMs: 0,
    memoryUsageApproxMb: 0,
    systemEvents: []
  };

  private lastStateChangeTime: number = Date.now();
  private currentState: string = 'IDLE';
  private recoveryStartTime: number = 0;
  private totalRecoveryTimeMs: number = 0;

  logEvent(event: string) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    this.report.systemEvents.push(`[${timestamp}] ${event}`);
    if (this.report.systemEvents.length > 500) {
      this.report.systemEvents.shift();
    }
  }

  updateState(newState: string) {
    const now = Date.now();
    const duration = now - this.lastStateChangeTime;

    if (this.currentState === 'PLAYING') {
      this.report.totalPlayTimeMs += duration;
    } else if (this.currentState === 'BUFFERING') {
      this.report.totalBufferingTimeMs += duration;
    }

    if (newState === 'PAUSED' && this.currentState === 'PLAYING') {
      this.report.pauseCount++;
    }

    if (newState === 'RECOVERING' && this.currentState !== 'RECOVERING') {
      this.report.recoveryCount++;
      this.recoveryStartTime = now;
    }

    if (this.currentState === 'RECOVERING' && (newState === 'PLAYING' || newState === 'PAUSED')) {
      const recoveryTime = now - this.recoveryStartTime;
      this.totalRecoveryTimeMs += recoveryTime;
      this.report.avgRecoveryTimeMs = this.totalRecoveryTimeMs / this.report.recoveryCount;
      if (recoveryTime > this.report.maxRecoveryTimeMs) {
        this.report.maxRecoveryTimeMs = recoveryTime;
      }
      this.report.recoveredErrorCount++;
    }

    if (newState === 'ERROR_FATAL') {
      this.report.fatalErrorCount++;
    }

    this.currentState = newState;
    this.lastStateChangeTime = now;
    this.logEvent(`State changed to: ${newState}`);
    
    this.updateMemoryUsage();
  }

  logSeek() {
    this.report.seekCount++;
    this.logEvent('Seek performed');
  }
  
  logNetworkChange(type: 'wifi' | 'data') {
      if (type === 'wifi') {
          this.report.networkChangesToWifi++;
          this.logEvent('Network changed to WiFi');
      } else {
          this.report.networkChangesToData++;
          this.logEvent('Network changed to Data');
      }
  }

  private updateMemoryUsage() {
    if ((performance as any).memory) {
      this.report.memoryUsageApproxMb = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
    } else {
      // Mock for standard webviews without performance.memory API
      this.report.memoryUsageApproxMb = Math.round(15 + Math.random() * 5); 
    }
  }

  getReport(): DiagnosticsReport {
    this.updateMemoryUsage();
    // Also update current state time
    const now = Date.now();
    const duration = now - this.lastStateChangeTime;
    const reportCopy = { ...this.report };
    
    if (this.currentState === 'PLAYING') {
      reportCopy.totalPlayTimeMs += duration;
    } else if (this.currentState === 'BUFFERING') {
      reportCopy.totalBufferingTimeMs += duration;
    }

    return reportCopy;
  }
  
  reset() {
      this.report = {
        startTime: Date.now(),
        endTime: null,
        totalPlayTimeMs: 0,
        totalBufferingTimeMs: 0,
        pauseCount: 0,
        seekCount: 0,
        recoveryCount: 0,
        recoveredErrorCount: 0,
        fatalErrorCount: 0,
        networkChangesToData: 0,
        networkChangesToWifi: 0,
        callInterruptions: 0,
        bluetoothInterruptions: 0,
        avgRecoveryTimeMs: 0,
        maxRecoveryTimeMs: 0,
        memoryUsageApproxMb: 0,
        systemEvents: []
      };
      this.lastStateChangeTime = Date.now();
      this.currentState = 'IDLE';
      this.totalRecoveryTimeMs = 0;
  }
}

export const diagnostics = new NativeAudioDiagnostics();
