const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

const oldEffect = `  useEffect(() => {
    // Escucha en tiempo real de usuarios con actividad en los últimos 15 minutos
    const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
    const q = query(
      collection(db, "users"),
      where("lastActiveAt", ">=", fifteenMinsAgo)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeList: any[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Ordenar en lado del cliente para evitar errores por índices compuestos requeridos de ordenamiento en Firestore
      activeList.sort((a: any, b: any) => getMs(b.lastActiveAt) - getMs(a.lastActiveAt));
      setRealtimeActiveUsers(activeList);
      
      setAdminStats(prev => ({
        ...prev,
        activeUsers: activeList.length
      }));
    }, (err) => {
      console.warn("Real-time active users listener failed:", err);
      // Fallback usando filtrado en los usuarios ya cargados
      const clientFiltered = usersRef.current.filter(u => {
        const ms = getMs(u.lastActiveAt);
        return ms && (Date.now() - ms <= 15 * 60 * 1000);
      });
      setRealtimeActiveUsers(clientFiltered);
    });

    return () => unsubscribe();
  }, []);`;

const newEffect = `  useEffect(() => {
    if (activeTab !== "analytics") {
      setRealtimeActiveUsers([]);
      return;
    }

    // Escucha en tiempo real de usuarios con actividad en los últimos 15 minutos
    const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
    const q = query(
      collection(db, "users"),
      where("lastActiveAt", ">=", fifteenMinsAgo)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const activeList: any[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter((u: any) => getMs(u.lastActiveAt) >= now - 15 * 60 * 1000);

      // Ordenar en lado del cliente para evitar errores por índices compuestos requeridos de ordenamiento en Firestore
      activeList.sort((a: any, b: any) => getMs(b.lastActiveAt) - getMs(a.lastActiveAt));
      setRealtimeActiveUsers(activeList);
      
      setAdminStats(prev => ({
        ...prev,
        activeUsers: activeList.length
      }));
    }, (err) => {
      console.warn("Real-time active users listener failed:", err);
      // Fallback usando filtrado en los usuarios ya cargados
      const clientFiltered = usersRef.current.filter(u => {
        const ms = getMs(u.lastActiveAt);
        return ms && (Date.now() - ms <= 15 * 60 * 1000);
      });
      setRealtimeActiveUsers(clientFiltered);
    });

    return () => unsubscribe();
  }, [activeTab]);`;

if (code.includes('where("lastActiveAt", ">=", fifteenMinsAgo)')) {
  // Use regex for flexible matching in case of minor whitespace differences
  code = code.replace(/useEffect\(\(\) => \{\s*\/\/ Escucha en tiempo real de usuarios con actividad en los últimos 15 minutos[\s\S]*?return \(\) => unsubscribe\(\);\s*\}, \[\]\);/, newEffect);
  fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
  console.log("Patched listener successfully");
} else {
  console.log("Could not find effect to patch");
}
