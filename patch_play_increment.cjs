const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const incFn = `  const incrementPlaylistPlays = async (playlist: MusicPlaylist) => {
    try {
      if (!playlist.id || !playlist.ref?.path) return;
      
      // Do not increment own playlists
      if (currentUser && playlist.ownerId === currentUser.uid) return;

      const { doc, increment, updateDoc } = await import("firebase/firestore");
      const docRef = doc(db, playlist.ref.path);
      await updateDoc(docRef, { plays: increment(1) });
    } catch(e) {
      console.warn("Could not increment plays", e);
    }
  };

  const playPreviewTrack = (playlist: MusicPlaylist, trackIdx: number) => {`;

code = code.replace("  const playPreviewTrack = (playlist: MusicPlaylist, trackIdx: number) => {", incFn);

const playPreviewTrackBodyOld = `    const isSamePlaylist = playingPlaylist?.id === playlist.id;
    setPlayingPlaylist(playlist);
    setSelectedPlaylist(playlist);

    if (isSamePlaylist) {`;

const playPreviewTrackBodyNew = `    const isSamePlaylist = playingPlaylist?.id === playlist.id;
    setPlayingPlaylist(playlist);
    setSelectedPlaylist(playlist);
    
    if (!isSamePlaylist) {
      incrementPlaylistPlays(playlist);
    }

    if (isSamePlaylist) {`;

code = code.replace(playPreviewTrackBodyOld, playPreviewTrackBodyNew);


const handleTrackClickOld = `  const handleTrackClick = (idx: number) => {
    expectedPlayingRef.current = true;
    if (selectedPlaylist && selectedPlaylist.id !== playingPlaylist?.id) {
      setPlayingPlaylist(selectedPlaylist);
      setCurrentTrackIndex(idx);
      setIsPlaying(true);
      return;
    }`;

const handleTrackClickNew = `  const handleTrackClick = (idx: number) => {
    expectedPlayingRef.current = true;
    if (selectedPlaylist && selectedPlaylist.id !== playingPlaylist?.id) {
      setPlayingPlaylist(selectedPlaylist);
      setCurrentTrackIndex(idx);
      setIsPlaying(true);
      incrementPlaylistPlays(selectedPlaylist);
      return;
    }`;

code = code.replace(handleTrackClickOld, handleTrackClickNew);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
