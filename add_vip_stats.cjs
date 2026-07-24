const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

// Add state for vipStats
code = code.replace('const [adminStats, setAdminStats] = useState({ totalUsers: 0, activeUsers: 0, newUsers: 0 });',
`const [adminStats, setAdminStats] = useState({ totalUsers: 0, activeUsers: 0, newUsers: 0 });
  const [vipStats, setVipStats] = useState({ activated: 0, active: 0, expired: 0, conversions: 0, blocked: 0, suspicious: 0 });`);

// Update fetchAnalytics to also fetch VIP stats
code = code.replace('const fetchAnalytics = async () => {\n    try {\n      setLoadingAnalytics(true);',
`const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      
      // Fetch VIP stats using efficient getCountFromServer
      try {
        const now = Date.now();
        const [
          activatedSnap,
          activeSnap,
          expiredSnap,
          conversionsSnap,
          blockedSnap,
          suspiciousSnap
        ] = await Promise.all([
          getCountFromServer(collection(db, "vip_activations")),
          getCountFromServer(query(collection(db, "vip_activations"), where("expiresAt", ">=", now))),
          getCountFromServer(query(collection(db, "vip_activations"), where("expiresAt", "<", now))),
          getCountFromServer(query(collection(db, "users"), where("isVIPGuest", "==", true), where("plan", "==", "premium"))),
          getCountFromServer(query(collection(db, "vip_devices"), where("activations", ">=", 3))),
          getCountFromServer(collection(db, "vip_blocked"))
        ]);
        
        setVipStats({
          activated: activatedSnap.data().count,
          active: activeSnap.data().count,
          expired: expiredSnap.data().count,
          conversions: conversionsSnap.data().count,
          blocked: blockedSnap.data().count,
          suspicious: suspiciousSnap.data().count
        });
      } catch (e) {
        console.error("Error fetching VIP stats:", e);
      }
`);

// Add VIP stats to the UI in the Analytics tab
const targetString = `<h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Resumen de Actividad</h4>`;
code = code.replace(targetString, 
`<h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sistema VIP (Sin Registro)</h4>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 flex flex-col gap-1">
                        <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-black">Activadas</span>
                        <span className="text-lg font-black text-white">{vipStats.activated}</span>
                      </div>
                      <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 flex flex-col gap-1">
                        <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-black">Activas Hoy</span>
                        <span className="text-lg font-black text-white">{vipStats.active}</span>
                      </div>
                      <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Caducadas</span>
                        <span className="text-lg font-black text-white">{vipStats.expired}</span>
                      </div>
                      <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20 flex flex-col gap-1">
                        <span className="text-[9px] uppercase tracking-wider text-blue-400 font-black">Conversiones</span>
                        <span className="text-lg font-black text-white">{vipStats.conversions}</span>
                      </div>
                      <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20 flex flex-col gap-1">
                        <span className="text-[9px] uppercase tracking-wider text-red-400 font-black">Bloqueados</span>
                        <span className="text-lg font-black text-white">{vipStats.blocked}</span>
                      </div>
                      <div className="bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20 flex flex-col gap-1">
                        <span className="text-[9px] uppercase tracking-wider text-orange-400 font-black">Sospechosos</span>
                        <span className="text-lg font-black text-white">{vipStats.suspicious}</span>
                      </div>
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Resumen de Actividad Global</h4>`);

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
