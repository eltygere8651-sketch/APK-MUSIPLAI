import React from 'react';
import { Volume2, HardDrive, LogOut, User } from 'lucide-react';
import { UserSettings, UserProfile } from '../domain/types';

interface SettingsViewProps {
  settings: UserSettings;
  user: UserProfile | null;
  trackCount: number;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  onClose?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  user,
  trackCount,
  onUpdateSettings,
  onLogout,
  onOpenAuth,
  onClose,
}) => {
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
          <span className="text-sm font-bold">Ajustes</span>
          <div className="w-8"></div>
        </div>
      )}

      <div className="border-b border-neutral-800/50 pb-6 mb-8 hidden sm:block">
        <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Configuración</h2>
        <p className="text-sm text-neutral-400">
          Gestiona tu cuenta y personaliza tu experiencia de audio.
        </p>
      </div>

      {/* User Account Card */}
      <div className="bg-neutral-900 border border-neutral-800/80 rounded-[24px] p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <img
            src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'guest'}&backgroundColor=171717`}
            alt="User avatar"
            className="w-14 h-14 rounded-full bg-neutral-800 border border-neutral-700/50 object-cover"
          />
          <div>
            <h3 className="text-base font-bold text-white">{user?.displayName || 'Usuario Invitado'}</h3>
            <p className="text-xs text-neutral-400 mt-0.5">{user?.email || 'Sesión Local (Sin Sincronización)'}</p>
          </div>
        </div>

        {user ? (
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-black hover:bg-neutral-800 text-neutral-300 font-bold text-xs px-5 py-2.5 rounded-full border border-neutral-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 bg-white hover:bg-neutral-200 text-black font-bold text-xs px-5 py-2.5 rounded-full transition-transform active:scale-95"
          >
            <User className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </button>
        )}
      </div>

      {/* Audio Playback Settings */}
      <div className="bg-neutral-900 border border-neutral-800/80 rounded-[24px] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-neutral-800/50 bg-neutral-900/50">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Volume2 className="w-5 h-5 text-neutral-400" />
            <h3>Reproducción</h3>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Crossfade */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Crossfade (Fundido)</p>
              <p className="text-xs text-neutral-400 mt-1">Transición suave entre pistas</p>
            </div>
            <select
              value={settings.crossfadeDuration}
              onChange={(e) => onUpdateSettings({ crossfadeDuration: parseInt(e.target.value, 10) })}
              className="bg-black border border-neutral-800 text-xs font-semibold text-white rounded-xl px-4 py-2 focus:outline-none focus:border-neutral-600 cursor-pointer"
            >
              <option value={0}>Desactivado</option>
              <option value={3}>3 segundos</option>
              <option value={6}>6 segundos</option>
              <option value={10}>10 segundos</option>
            </select>
          </div>

          <div className="w-full h-px bg-neutral-800/50" />

          {/* Gapless */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Reproducción Sin Pausas</p>
              <p className="text-xs text-neutral-400 mt-1">Elimina silencios entre pistas continuas</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.gaplessPlayback}
                onChange={(e) => onUpdateSettings({ gaplessPlayback: e.target.checked })}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Storage Settings */}
      <div className="bg-neutral-900 border border-neutral-800/80 rounded-[24px] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-neutral-800/50 bg-neutral-900/50">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <HardDrive className="w-5 h-5 text-neutral-400" />
            <h3>Almacenamiento Local</h3>
          </div>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">Caché Offline (IndexedDB)</p>
            <p className="text-xs text-neutral-400 mt-1">Archivos de audio importados y guardados</p>
          </div>
          <div className="bg-black border border-neutral-800 rounded-xl px-4 py-2">
            <span className="font-bold text-white text-sm">{trackCount}</span>
            <span className="text-xs text-neutral-400 ml-1">canciones</span>
          </div>
        </div>
      </div>
    </div>
  );
};
