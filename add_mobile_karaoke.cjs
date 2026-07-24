const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const replacement = `
        {/* Explorar */}
        <button
          onClick={() => {
            setSelectedPlaylist(null);
            setTrackListTab("search");
            setIsTrackListExpanded(true);
            setMobileView("player");
            setShowLibrary(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={\`relative flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all \${
            mobileView === "player" &&
            trackListTab === "search" &&
            !selectedPlaylist &&
            !showLibrary
              ? "text-emerald-400 font-bold"
              : "text-slate-500 hover:text-emerald-400"
          }\`}
        >
          <div className="relative">
            <Compass className="w-5 h-5" />
            {hasNewExplore && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-[#0c0c0d] shadow-[0_0_5px_rgba(239,68,68,0.8)]" />}
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">
            Explorar
          </span>
        </button>

        {/* Karaoke (Mobile) */}
        <button
          onClick={() => {
            setSearchQuery("");
            setYoutubeResults([]);
            setPreviewPlaylist(null);
            
            setTrackListTab("karaoke");
            setIsTrackListExpanded(true);
            setShowLibrary(false);
            setIsSidebarExpanded(false);
            setMobileView("player");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={\`relative flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all \${
            trackListTab === "karaoke"
              ? "text-emerald-400 font-bold"
              : "text-slate-500 hover:text-emerald-400"
          }\`}
        >
          <div className="relative">
            <Mic className="w-5 h-5" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">
            Karaoke
          </span>
        </button>
`;

// Replace the first button logic
code = code.replace(/\{\/\*\s*Explorar\s*\*\/\}[\s\S]*?<span className="text-\[8px\] font-black uppercase tracking-widest">\s*Explorar\s*<\/span>\s*<\/button>/, replacement);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log("Added Karaoke to Mobile Bottom Navigation Bar");
