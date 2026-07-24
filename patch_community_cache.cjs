const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldCode = `    const fetchCommunity = async () => {
      try {
        const { getDocs, collectionGroup, query, orderBy, limit } = await import("firebase/firestore");
        const data = await fetchWithCache("gym_music_community_cache", 1000 * 60 * 60 * 24, async () => {
           const qComm = query(
             collectionGroup(db, "playlists"),
             orderBy("createdAt", "desc"),
             limit(50),
           );`;

const newCode = `    const fetchCommunity = async (force = false) => {
      try {
        const { getDocs, collectionGroup, query, orderBy, limit, where } = await import("firebase/firestore");
        const data = await fetchWithCache("gym_music_community_cache", 1000 * 60 * 60 * 24, async () => {
           const qComm = query(
             collectionGroup(db, "playlists"),
             where("isPublic", "==", true),
             orderBy("createdAt", "desc"),
             limit(50),
           );`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
