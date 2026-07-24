const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetState = `const [hasUnread, setHasUnread] = useState(false);
  const [globalBanner, setGlobalBanner] = useState<{title: string, content: string, category?: string} | null>(null);`;
const replacementState = `const [hasUnread, setHasUnread] = useState(false);
  const [globalBanner, setGlobalBanner] = useState<{id: string, title: string, content: string, category?: string} | null>(null);`;
code = code.replace(targetState, replacementState);

const targetCheck = `          if (Date.now() - dbDate.getTime() < 86400000 && data.active !== false) {
             setGlobalBanner({ title: data.title, content: data.content, category: data.category });
          } else {
             setGlobalBanner(null);
          }`;
const replacementCheck = `          if (Date.now() - dbDate.getTime() < 86400000 && data.active !== false) {
             const dismissedId = localStorage.getItem("flux_dismissed_banner");
             if (dismissedId !== newestDoc.id) {
               setGlobalBanner({ id: newestDoc.id, title: data.title, content: data.content, category: data.category });
             } else {
               setGlobalBanner(null);
             }
          } else {
             setGlobalBanner(null);
          }`;
code = code.replace(targetCheck, replacementCheck);

const targetBannerUI = `        {globalBanner && (
          <div className="w-full mt-2 overflow-hidden bg-gradient-to-r from-emerald-500/10 via-emerald-400/20 to-emerald-500/10 border-y border-emerald-500/20 py-2 shrink-0 flex items-center relative shadow-[0_0_15px_rgba(16,185,129,0.1)]">
             <div className="flex items-center gap-6 text-emerald-400 font-extrabold uppercase text-[10px] tracking-widest px-4 animate-marquee whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-white drop-shadow-md">{globalBanner.title}:</span> 
                <span className="opacity-90">{globalBanner.content}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)] ml-12" />
             </div>
          </div>
        )}`;
const replacementBannerUI = `        {globalBanner && (
          <div className="w-full mt-2 overflow-hidden bg-gradient-to-r from-emerald-500/10 via-emerald-400/20 to-emerald-500/10 border-y border-emerald-500/20 py-2 shrink-0 flex items-center justify-between relative shadow-[0_0_15px_rgba(16,185,129,0.1)]">
             <div className="flex items-center gap-6 text-emerald-400 font-extrabold uppercase text-[10px] tracking-widest px-4 animate-marquee whitespace-nowrap overflow-hidden">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-white drop-shadow-md">{globalBanner.title}:</span> 
                <span className="opacity-90">{globalBanner.content}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)] ml-12" />
             </div>
             <button
                onClick={() => {
                   localStorage.setItem("flux_dismissed_banner", globalBanner.id);
                   setGlobalBanner(null);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-1.5 rounded-full z-10 transition-colors"
                title="Cerrar aviso"
             >
                <X className="w-3.5 h-3.5 text-emerald-400" />
             </button>
          </div>
        )}`;
code = code.replace(targetBannerUI, replacementBannerUI);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed global banner in App.tsx');
