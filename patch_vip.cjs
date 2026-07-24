const fs = require('fs');
const file = 'src/components/VIPLandingView.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `  if (trialState === 'expired') {

    const isAnonymous = auth.currentUser?.isAnonymous;
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center px-6 text-center font-sans relative">
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        <span className="text-6xl mb-6 block z-10">🎵</span>
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2 z-10">
           {isAnonymous ? "Conserva toda tu música" : "Ya disfrutaste de tu prueba gratuita."}
        </h1>
        <p className="text-slate-300 text-lg mb-8 z-10">
           {isAnonymous 
             ? "No pierdas tus playlists, historial ni favoritos." 
             : "Continúa disfrutando de toda la música sin anuncios por solo 5 € al mes."}
        </p>
        
        {isAnonymous ? (
            <div className="flex flex-col gap-4 w-full max-w-sm z-10 mt-4">
                 <button
                   onClick={() => setTrialState('link-email')}
                   className="w-full bg-white text-black font-black uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                 >
                   📧 Continuar con Email
                 </button>
                 
                 <button
                   onClick={handleLinkGoogle}
                   disabled={isLoading}
                   className="w-full bg-[#4285F4] text-white font-black uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#3367d6] transition-colors disabled:opacity-50"
                 >
                   {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "🔵 Continuar con Google"}
                 </button>
            </div>
        ) : (
            <button
              onClick={handleContactSupport}
              disabled={isLoading}
              className="w-full max-w-sm bg-emerald-500 text-black font-black uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors z-10 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>⚡ SOLICITAR PREMIUM (ABRIR MENÚ LATERAL)</>
              )}
            </button>
        )}

        {auth.currentUser && (`;

const replacement = `  if (trialState === 'expired') {

    const isAnonymous = auth.currentUser?.isAnonymous;
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center px-6 text-center font-sans relative">
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        <span className="text-6xl mb-6 block z-10">🎵</span>
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2 z-10">
           Ya disfrutaste de tu prueba gratuita.
        </h1>
        <p className="text-slate-300 text-lg mb-8 z-10">
           Continúa disfrutando de toda la música sin anuncios por solo 5 € al mes.
        </p>
        
        <button
          onClick={handleContactSupport}
          disabled={isLoading}
          className="w-full max-w-sm bg-emerald-500 text-black font-black uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors z-10 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
            <>⚡ SOLICITAR PREMIUM (ABRIR MENÚ LATERAL)</>
          )}
        </button>

        {auth.currentUser && (`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(file, code);
  console.log("Patched successfully");
} else {
  console.log("Target not found!");
}
