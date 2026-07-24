const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const fetchUserOld = `    const fetchUserPlaylists = async (force = false) => {
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
    };`;

const fetchUserNew = `    const fetchUserPlaylists = async (force = false) => {
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

if (code.includes(fetchUserOld)) {
  code = code.replace(fetchUserOld, fetchUserNew);
  fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
  console.log("Patched GymMusicPlayer successfully.");
} else {
  console.log("Could not find the target string.");
}
