const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const targetStr = `          <div className="flex flex-col p-3 md:p-3 gap-2.5 overflow-y-auto scrollbar-none flex-1 min-h-0 w-full items-stretch">`;

const replacement = `          <div className="flex flex-col p-3 md:p-3 gap-2.5 overflow-y-auto scrollbar-none flex-1 min-h-0 w-full items-stretch">
            {/* Comunidad Promo Card */}
            <button
              onClick={() => {
                setShowLibrary(true);
                setIsSidebarExpanded(false);
              }}
              className="w-full relative overflow-hidden group bg-gradient-to-br from-emerald-500/10 via-[#0a0a0c] to-[#0a0a0c] border border-emerald-500/20 hover:border-emerald-500/50 rounded-2xl p-4 cursor-pointer text-left transition-all hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(16,185,129,0.1)] mb-1 shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/5 to-emerald-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
              <div className="flex justify-between items-start mb-2">
                <span className="bg-emerald-500 text-black text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse">
                  Tu Mejor Opción
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:rotate-12 transition-transform">
                  <Globe className="w-3.5 h-3.5" />
                </div>
              </div>
              <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider mb-1.5 group-hover:text-emerald-400 transition-colors">
                Ir a La Comunidad
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                Reproduce tu música, explora nuevas playlists y únete a otros usuarios. <strong className="text-emerald-400 font-bold">¡Te recomendamos usar la comunidad!</strong>
              </p>
            </button>
`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
