const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const target = `                                    // Logic for continuous playback from search results
                                    const allTracksOnly = youtubeResults
                                      .filter((t) => !t.isPlaylist)
                                      .map((t) => ({
                                        id: \`yt_temp_\${t.id}\`,
                                        title: t.title,
                                        artist: t.artist || "Flux",
                                        url: t.url,
                                        duration: t.duration || "N/A",
                                        bpm: 120,
                                      }));

                                    const currentIdx = allTracksOnly.findIndex(
                                      (t) => t.id === trackId,
                                    );

                                    if (currentIdx !== -1) {
                                      setOverrideCurrentTrack(
                                        allTracksOnly[currentIdx],
                                      );
                                      pendingSeekPosRef.current = null;
                                      setPosition(0);
                                      setDuration(0);
                                      setIsPlaying(true);

                                      // Queue the rest of search results
                                      if (
                                        allTracksOnly.length >
                                        currentIdx + 1
                                      ) {
                                        const nextInSearch =
                                          allTracksOnly.slice(currentIdx + 1);
                                        setTrackQueue(nextInSearch);
                                        trackQueueRef.current = nextInSearch;
                                      }

                                      showNotification(
                                        \`Reproduciendo: \${ytTrack.title}\`,
                                      );
                                    }`;

const replacement = `                                    // Set the selected track
                                    const selectedTrackObj = {
                                      id: \`yt_temp_\${ytTrack.id}\`,
                                      title: ytTrack.title,
                                      artist: ytTrack.artist || "Flux",
                                      url: ytTrack.url,
                                      duration: ytTrack.duration || "N/A",
                                      bpm: 120,
                                    };
                                    setOverrideCurrentTrack(selectedTrackObj);
                                    pendingSeekPosRef.current = null;
                                    setPosition(0);
                                    setDuration(0);
                                    setIsPlaying(true);
                                    showNotification(\`Reproduciendo: \${ytTrack.title}\`);

                                    // Fetch upnext (radio) for this track to simulate Spotify-like radio queue
                                    fetch(\`/api/youtube/upnext?id=\${ytTrack.id}\`)
                                      .then(r => r.json())
                                      .then(data => {
                                        if (data && data.length > 0) {
                                          // The first item is often the track itself, so we skip it if it matches
                                          const radioQueue = data.filter((t: any) => t.id !== \`yt_temp_\${ytTrack.id}\`);
                                          setTrackQueue(radioQueue);
                                          trackQueueRef.current = radioQueue;
                                        } else {
                                          // Fallback to rest of search results if upnext fails
                                          const allTracksOnly = youtubeResults
                                            .filter((t) => !t.isPlaylist)
                                            .map((t) => ({
                                              id: \`yt_temp_\${t.id}\`,
                                              title: t.title,
                                              artist: t.artist || "Flux",
                                              url: t.url,
                                              duration: t.duration || "N/A",
                                              bpm: 120,
                                            }));
                                          const currentIdx = allTracksOnly.findIndex((t) => t.id === trackId);
                                          if (currentIdx !== -1 && allTracksOnly.length > currentIdx + 1) {
                                            const nextInSearch = allTracksOnly.slice(currentIdx + 1);
                                            setTrackQueue(nextInSearch);
                                            trackQueueRef.current = nextInSearch;
                                          }
                                        }
                                      }).catch(() => {
                                         // Silently fail to fallback or just leave queue empty
                                      });
`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
