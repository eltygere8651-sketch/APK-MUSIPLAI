const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const newRoute = `
const userCache = new Map();
const USER_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

app.get("/api/user/playlists", async (req, res) => {
  try {
    const uid = req.query.uid;
    const force = req.query.force === "true";
    if (!uid) return res.status(400).json({ error: "Missing uid" });

    const cached = userCache.get(uid);
    if (!force && cached && Date.now() - cached.timestamp < USER_CACHE_TTL) {
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.json(cached.data);
    }

    const db = await getClientDb();
    if (!db) return res.status(500).json({ error: "Firestore not initialized" });
    
    const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
    const q = query(collection(db, "users", uid, "playlists"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
      
    const playlists = snapshot.docs.map(doc => ({
      id: doc.id,
      _data: doc.data(),
      ref: { path: doc.ref.path }
    }));
    
    userCache.set(uid, { data: playlists, timestamp: Date.now() });
    
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.json(playlists);
  } catch (err) {
    console.error("Error fetching user playlists in backend:", err);
    res.status(500).json({ error: "Failed to fetch user playlists" });
  }
});
`;

if (!code.includes('/api/user/playlists')) {
  code = code.replace('// YouTube Search Endpoint', newRoute + '\n// YouTube Search Endpoint');
  fs.writeFileSync('server.ts', code);
  console.log("Patched server.ts successfully");
} else {
  console.log("Already patched.");
}
