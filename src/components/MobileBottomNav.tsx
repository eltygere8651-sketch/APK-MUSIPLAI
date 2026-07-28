import React from 'react';
import { Library, ListMusic, DownloadCloud, Search, Compass } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  playlistsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  playlistsCount = 0,
}) => {
  const navItems: {id: string; label: string; icon: any; badge?: number}[] = [
    { id: 'explore', label: 'Explorar', icon: Compass },
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'library', label: 'Biblioteca', icon: Library },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'import', label: 'Importar', icon: DownloadCloud },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/85 backdrop-blur-3xl border-t border-neutral-900 md:hidden select-none pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 items-center h-[56px] px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-2 transition-all relative ${
                isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <div className="relative">
                <Icon className={`w-[22px] h-[22px] transition-transform ${isActive ? 'scale-100 text-white' : 'scale-95 text-neutral-500'}`} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-black text-[9px] font-extrabold rounded-full px-1 min-w-[14px] h-[14px] flex items-center justify-center shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight truncate max-w-full px-0.5 ${isActive ? 'font-semibold text-white' : 'font-medium text-neutral-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
