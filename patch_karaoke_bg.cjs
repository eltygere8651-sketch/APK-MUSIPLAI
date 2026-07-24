const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const target = `            trackListTab === "karaoke" &&
            !showLibrary &&
            !isSidebarExpanded &&
            (window.innerWidth >= 768 || mobileView === "player")
              ? "bg-blue-600 text-white border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]"`;

const replacement = `            trackListTab === "karaoke" &&
            !showLibrary &&
            !isSidebarExpanded &&
            (window.innerWidth >= 768 || mobileView === "player")
              ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
