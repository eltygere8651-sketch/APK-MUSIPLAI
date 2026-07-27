import { registerPlugin, PluginListenerHandle } from "@capacitor/core";

export interface NativeAudioPlugin {
  /**
   * Envía la URL directa al motor nativo (Media3 o AVPlayer)
   */
  play(options: { url: string; title?: string; artist?: string; coverUrl?: string }): Promise<void>;
  
  /**
   * Pausa la reproducción
   */
  pause(): Promise<void>;
  
  /**
   * Reanuda la reproducción
   */
  resume(): Promise<void>;
  
  /**
   * Detiene la reproducción y libera recursos
   */
  stop(): Promise<void>;
  
  /**
   * Salta a una posición específica en milisegundos
   */
  seek(options: { position: number }): Promise<void>;
  
  /**
   * Evento disparado cuando cambia el estado del reproductor
   * Ej: 'playing', 'paused', 'buffering', 'error'
   */
  addListener(
    eventName: "onPlaybackStateChanged",
    listenerFunc: (state: { status: string; error?: string }) => void
  ): Promise<PluginListenerHandle>;
  
  /**
   * Evento disparado periódicamente con el progreso actual
   */
  addListener(
    eventName: "onPositionChanged",
    listenerFunc: (info: { position: number; duration: number }) => void
  ): Promise<PluginListenerHandle>;
}

// Registro del plugin en el puente de Capacitor.
// Esta interfaz interactuará con el código nativo (Java/Swift) una vez implementado.
export const NativeAudio = registerPlugin<NativeAudioPlugin>("NativeAudio");
