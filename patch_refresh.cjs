const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldCode = `    const fetchCustomExplorePlaylists = async () => {
      try {
        const { getDocs, collection, query, orderBy } = await import("firebase/firestore");
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
        });
        
        // Filter by country
        lists = lists.filter((p: any) => 
          p.country === selectedCountry || 
          (!p.country && selectedCountry === "ES")
        );
        
        setCustomExplorePlaylists(lists);
      } catch (error) {
        console.warn(
          "Permiso denegado para explorar listas personalizadas, o reglas no propagadas:",
          error,
        );
      }
    };
    fetchCustomExplorePlaylists();

    const handleRefresh = () => fetchCustomExplorePlaylists();`;

const newCode = `    const fetchCustomExplorePlaylists = async (force = false) => {
      try {
        const { getDocs, collection, query, orderBy } = await import("firebase/firestore");
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
        }, force);
        
        // Filter by country
        lists = lists.filter((p: any) => 
          p.country === selectedCountry || 
          (!p.country && selectedCountry === "ES")
        );
        
        setCustomExplorePlaylists(lists);
      } catch (error) {
        console.warn(
          "Permiso denegado para explorar listas personalizadas, o reglas no propagadas:",
          error,
        );
      }
    };
    fetchCustomExplorePlaylists();

    const handleRefresh = () => fetchCustomExplorePlaylists(true);`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
