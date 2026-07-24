const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetFloat = `      {/* --- PWA ONE-CLICK INSTALL FLOAT --- */}
      <AnimatePresence>
        {canShowInstallHelper && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-20 right-4 z-[90] flex justify-end"
          >
            <button
              onClick={handleInstallPress}
              className="bg-[#1ED760] hover:bg-emerald-400 text-black px-3 py-2 sm:px-5 sm:py-2.5 rounded-full font-black uppercase text-[9px] sm:text-[11px] tracking-widest shadow-[0_8px_20px_rgba(30,215,96,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Instalar</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>`;

const replaceFloat = `      {/* --- PWA ONE-CLICK INSTALL FLOAT --- */}
      <AnimatePresence>
        {canShowInstallHelper && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-20 right-4 sm:top-24 sm:right-6 z-[90] flex justify-end pointer-events-none"
          >
            <button
              onClick={handleInstallPress}
              title="Instalar App"
              className="pointer-events-auto bg-black/60 backdrop-blur-md border border-[#1ED760]/30 hover:border-[#1ED760]/60 hover:bg-[#1ED760]/10 text-white w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(30,215,96,0.2)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 group"
            >
              <Download className="w-4 h-4 text-[#1ED760] group-hover:scale-110 transition-transform" />
              <span className="hidden sm:block text-[10px] font-black uppercase tracking-wider text-[#1ED760]">Instalar App</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>`;

code = code.replace(targetFloat, replaceFloat);
fs.writeFileSync('src/App.tsx', code);
console.log('Optimized float');
