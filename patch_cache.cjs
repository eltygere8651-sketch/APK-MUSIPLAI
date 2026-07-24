const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

// 1. Add fetchWithCache function
const helper = `
const fetchWithCache = async (cacheKey, ttl, fetcher, forceRefresh = false) => {
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < ttl) {
           return parsed.data;
        }
      }
    } catch (e) {}
  }
  const data = await fetcher();
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
  } catch(e) {}
  return data;
};
`;

code = code.replace('const GymMusicPlayer =', helper + '\nconst GymMusicPlayer =');

// 2. Patch processMergedDocs
const processMergedDocsOld = `    const processMergedDocs = () => {
      // Unir documentos, dando prioridad a las versiones del usuario
      const combined = new Map();
      communityDocsRef.current.forEach((doc) => combined.set(doc.id, doc));
      userDocsRef.current.forEach((doc) => combined.set(doc.id, doc));

      const mergedDocs = Array.from(combined.values());

      mergedDocs.sort((a, b) => {
        const orderA =
          typeof a.data().orderScore === "number" ? a.data().orderScore : 0;
        const orderB =
          typeof b.data().orderScore === "number" ? b.data().orderScore : 0;
        if (orderA !== orderB) {
          return orderB - orderA; // Descending
        }
        const tA = a.data().createdAt?.toMillis?.() || 0;
        const tB = b.data().createdAt?.toMillis?.() || 0;
        return tB - tA;
      });

      const folders = mergedDocs
        .map((doc) => {
          const data = doc.data();`;

const processMergedDocsNew = `    const processMergedDocs = () => {
      const normalizeDoc = (doc) => {
        if (typeof doc.data === 'function') {
           return { id: doc.id, data: doc.data(), ref: { path: doc.ref.path } };
        }
        return { id: doc.id, data: doc._data, ref: { path: doc.ref.path } };
      };

      // Unir documentos, dando prioridad a las versiones del usuario
      const combined = new Map();
      communityDocsRef.current.forEach((doc) => combined.set(doc.id, normalizeDoc(doc)));
      userDocsRef.current.forEach((doc) => combined.set(doc.id, normalizeDoc(doc)));

      const mergedDocs = Array.from(combined.values());

      mergedDocs.sort((a, b) => {
        const orderA =
          typeof a.data.orderScore === "number" ? a.data.orderScore : 0;
        const orderB =
          typeof b.data.orderScore === "number" ? b.data.orderScore : 0;
        if (orderA !== orderB) {
          return orderB - orderA; // Descending
        }
        const tA = a.data.createdAt?.toMillis?.() || (a.data.createdAt?.seconds ? a.data.createdAt.seconds * 1000 : 0) || a.data.createdAt || 0;
        const tB = b.data.createdAt?.toMillis?.() || (b.data.createdAt?.seconds ? b.data.createdAt.seconds * 1000 : 0) || b.data.createdAt || 0;
        return tB - tA;
      });

      const folders = mergedDocs
        .map((doc) => {
          const data = doc.data;`;

code = code.replace(processMergedDocsOld, processMergedDocsNew);

// 3. Patch fetchCommunity
const fetchCommunityOld = `    const fetchCommunity = async () => {
      try {
        const qComm = query(
          collectionGroup(db, "playlists"),
          orderBy("createdAt", "desc"),
          limit(50),
        );
        const snap = await getDocs(qComm);
        communityDocsRef.current = snap.docs;
        processMergedDocs();
      } catch (e) {
        console.error("Error fetching community playlists", e);
      }
    };`;

const fetchCommunityNew = `    const fetchCommunity = async () => {
      try {
        const data = await fetchWithCache("gym_music_community_cache", 1000 * 60 * 60 * 24, async () => {
           const qComm = query(
             collectionGroup(db, "playlists"),
             orderBy("createdAt", "desc"),
             limit(50),
           );
           const snap = await getDocs(qComm);
           return snap.docs.map(doc => ({
             id: doc.id,
             _data: doc.data(),
             ref: { path: doc.ref.path }
           }));
        });
        communityDocsRef.current = data;
        processMergedDocs();
      } catch (e) {
        console.error("Error fetching community playlists", e);
      }
    };`;

code = code.replace(fetchCommunityOld, fetchCommunityNew);

// 4. Patch fetchUserPlaylists
const fetchUserPlaylistsOld = `    const fetchUserPlaylists = async () => {
      if (!user) {
        userDocsRef.current = [];
        processMergedDocs();
        return;
      }
      try {
        const qUser = query(
          collection(db, "users", user.uid, "playlists"),
          orderBy("createdAt", "desc"),
        );
        const snap = await getDocs(qUser);
        userDocsRef.current = snap.docs;
        processMergedDocs();
      } catch (error) {
        console.error("Error fetching user playlists", error);
      }
    };
    fetchUserPlaylists();

    const handleRefresh = () => fetchUserPlaylists();`;

const fetchUserPlaylistsNew = `    const fetchUserPlaylists = async (force = false) => {
      if (!user) {
        userDocsRef.current = [];
        processMergedDocs();
        return;
      }
      try {
        const data = await fetchWithCache(\`gym_music_user_cache_\${user.uid}\`, 1000 * 60 * 60 * 24, async () => {
          const qUser = query(
            collection(db, "users", user.uid, "playlists"),
            orderBy("createdAt", "desc"),
          );
          const snap = await getDocs(qUser);
          return snap.docs.map(doc => ({
             id: doc.id,
             _data: doc.data(),
             ref: { path: doc.ref.path }
          }));
        }, force);
        userDocsRef.current = data;
        processMergedDocs();
      } catch (error) {
        console.error("Error fetching user playlists", error);
      }
    };
    fetchUserPlaylists();

    const handleRefresh = () => fetchUserPlaylists(true);`;

code = code.replace(fetchUserPlaylistsOld, fetchUserPlaylistsNew);

// 5. Patch explore_custom_playlists
const fetchCustomExplorePlaylistsOld = `        const { getDocs, collection, query, orderBy } = await import("firebase/firestore");
        const q = query(
          collection(db, "explore_custom_playlists"),
          orderBy("createdAt", "desc"),
        );
        const snap = await getDocs(q);
        let lists = snap.docs.map((doc) => ({
          ...doc.data(),
          docId: doc.id,
        }));`;

const fetchCustomExplorePlaylistsNew = `        const { getDocs, collection, query, orderBy } = await import("firebase/firestore");
        let lists = await fetchWithCache("gym_music_explore_custom_playlists_cache", 1000 * 60 * 60 * 12, async () => {
           const q = query(
             collection(db, "explore_custom_playlists"),
             orderBy("createdAt", "desc"),
           );
           const snap = await getDocs(q);
           return snap.docs.map((doc) => ({
             ...doc.data(),
             docId: doc.id,
           }));
        });`;

code = code.replace(fetchCustomExplorePlaylistsOld, fetchCustomExplorePlaylistsNew);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log("Patched successfully!");
