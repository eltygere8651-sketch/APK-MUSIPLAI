const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

// Replace fetchCommunity
const fetchCommunityOld = `    const fetchCommunity = async () => {
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

const fetchCommunityNew = `    const fetchCommunity = async () => {
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

code = code.replace(fetchCommunityOld, fetchCommunityNew);

// Replace fetchCustomExplorePlaylists
const fetchCustomExploreOld = `        let lists = await fetchWithCache("gym_music_explore_custom_playlists_cache", 1000 * 60 * 60 * 12, async () => {
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

const fetchCustomExploreNew = `        let lists = await fetchWithCache("gym_music_explore_custom_playlists_cache", 1000 * 60 * 60 * 12, async () => {
           const res = await fetch("/api/explore/custom-playlists");
           if (!res.ok) throw new Error("Failed to fetch from backend");
           return await res.json();
        });`;

code = code.replace(fetchCustomExploreOld, fetchCustomExploreNew);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
