const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const fetchCommunityOld = `    const fetchCommunity = async () => {
      try {
        const data = await fetchWithCache("gym_music_community_cache", 1000 * 60 * 60 * 24, async () => {
           const res = await fetch("/api/community/playlists");
           if (!res.ok) throw new Error("Failed to fetch from backend");
           return await res.json();
        });
        communityDocsRef.current = data;
        processMergedDocs();
      } catch (e) {
        console.error("Error fetching community playlists", e);
      }
    };`;

const fetchCommunityNew = `    const fetchCommunity = async () => {
      try {
        const { getDocs, collectionGroup, query, orderBy, limit } = await import("firebase/firestore");
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

const fetchCustomExploreOld = `        let lists = await fetchWithCache("gym_music_explore_custom_playlists_cache", 1000 * 60 * 60 * 12, async () => {
           const res = await fetch("/api/explore/custom-playlists");
           if (!res.ok) throw new Error("Failed to fetch from backend");
           return await res.json();
        });`;

const fetchCustomExploreNew = `        let lists = await fetchWithCache("gym_music_explore_custom_playlists_cache", 1000 * 60 * 60 * 12, async () => {
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

code = code.replace(fetchCustomExploreOld, fetchCustomExploreNew);

const fetchUserOld = `    const fetchUserPlaylists = async (force = false) => {
      if (!user) {
        userDocsRef.current = [];
        processMergedDocs();
        return;
      }
      try {
        const data = await fetchWithCache(\`gym_music_user_cache_\${user.uid}\`, 1000 * 60 * 60 * 24, async () => {
          const res = await fetch(\`/api/user/playlists?uid=\${user.uid}&force=\${force}\`);
          if (!res.ok) throw new Error("Failed to fetch user playlists from backend");
          return await res.json();
        }, force);
        userDocsRef.current = data;
        processMergedDocs();
      } catch (error) {
        console.error("Error fetching user playlists", error);
      }
    };`;

const fetchUserNew = `    const fetchUserPlaylists = async (force = false) => {
      if (!user) {
        userDocsRef.current = [];
        processMergedDocs();
        return;
      }
      try {
        const { getDocs, collection, query, orderBy } = await import("firebase/firestore");
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
    };`;

code = code.replace(fetchUserOld, fetchUserNew);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
