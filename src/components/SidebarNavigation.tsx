import React from 'react';
import { Library, ListMusic, DownloadCloud, Search } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  playlistsCount: number;
}

export const SidebarNavigation: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  playlistsCount,
}) => {
  const navItems: {id: string; label: string; icon: any; badge?: number}[] = [
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'library', label: 'Biblioteca', icon: Library },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'import', label: 'Importar', icon: DownloadCloud }
  ];

  return (
    <nav className="w-56 shrink-0 bg-black border-r border-neutral-900 p-3 hidden md:flex flex-col justify-between select-none">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase">
          Explorar
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-neutral-400'}`} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-neutral-900/50 rounded-2xl border border-neutral-800/40 text-center text-neutral-400 text-xs">
        <p className="font-semibold text-neutral-200 mb-0.5">Flux Player</p>
        <p className="text-[10px] text-neutral-500">Audio Alta Fidelidad</p>
      </div>
    </nav>
  );
};
