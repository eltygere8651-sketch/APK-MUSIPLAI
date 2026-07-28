import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { UserProfile } from '../domain/types';
import { FluxLogo } from './FluxLogo';

interface HeaderProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onNavigate: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
}) => {
  return (
    <header className="relative flex items-center justify-between px-4 py-3 bg-transparent border-b border-neutral-900/50 text-white min-h-[60px]">
      {/* Left Spacer for flex balance */}
      <div className="flex-1 z-10" />

      {/* Center: Official Brand Logo & Name */}
      <div 
        onClick={() => onNavigate('library')}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity select-none z-0"
      >
        <FluxLogo className="w-8 h-8" />
        <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1">
          <span>Flux</span>
          <span className="text-emerald-400">Player</span>
        </h1>
      </div>

      {/* Right: Sole Settings Button */}
      <div className="flex items-center justify-end flex-1 z-10">
        <button
          onClick={() => onNavigate('settings')}
          className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800/60 transition-colors"
          title="Configuración"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
