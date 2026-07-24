const fs = require('fs');

let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const bibliotecaBtnTarget = `<button
          onClick={() => {
            if (window.innerWidth < 768) {
              setShowLibrary(false);
              if (mobileView === "playlists") {
                setMobileView("player");
              } else {
                setMobileView("playlists");
                setIsTrackListExpanded(true);
              }
            } else {
              setShowLibrary(false);
              setIsSidebarExpanded(!isSidebarExpanded);
            }
          }}
          className={\`hidden md:flex shrink-0 px-4 py-1.5 rounded-full text-[11px] sm:text-[12px] font-bold transition-all cursor-pointer border snap-start items-center gap-1.5 \${
            isSidebarExpanded ||
            (window.innerWidth < 768 &&
              mobileView === "playlists" &&
              !showLibrary)
              ? "bg-white/20 backdrop-blur-xl border-white/40 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/20"
              : "bg-white/10 backdrop-blur-md border-white/10 text-white hover:bg-white/20 shadow-lg"
          }\`}
        >
          <Library className="w-3.5 h-3.5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <span className="font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">Mi Biblioteca</span>
        </button>`;

code = code.replace(bibliotecaBtnTarget, '');

const comunidadBtnTarget = `<button
          onClick={() => {
            if (showLibrary) {
              setShowLibrary(false);
            } else {
              setShowLibrary(true);
              setPreviewPlaylist(null);
              setIsSidebarExpanded(false);
              if (window.innerWidth < 768) {
                setMobileView("player");
              }
            }
          }}
          className={\`relative hidden md:flex shrink-0 px-4 py-1.5 rounded-full text-[11px] sm:text-[12px] font-bold transition-all cursor-pointer border snap-start \${
            showLibrary
              ? "bg-white/20 backdrop-blur-xl border-white/40 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/20"
              : "bg-white/10 backdrop-blur-md border-white/10 text-white hover:bg-white/20 shadow-lg"
          }\`}
        >
          <span className="font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">Comunidad</span>
          {hasNewCommunity && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-[#050505] shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
        </button>`;

code = code.replace(comunidadBtnTarget, '');

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
