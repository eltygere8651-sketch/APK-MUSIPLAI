const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

// The new replacement from patch_search_radio.cjs is now the target, and we swap it back.
const searchClickTarget = `                                    const artistName = ytTrack.artist && ytTrack.artist !== "Flux" ? ytTrack.artist : "";
                                    
                                    // Use upnext for infinite radio behavior based on the clicked track
                                    fetch(\`/api/youtube/upnext?id=\${ytTrack.id}\`)
                                      .then(r => r.json())
                                      .then(data => {
                                        if (data && data.length > 0) {
                                          const targetIdWithPrefix = \`yt_temp_\${ytTrack.id}\`;
                                          const radioQueue = data
                                            .filter((t: any) => t.id !== ytTrack.id && t.id !== targetIdWithPrefix)
                                            .map((t: any) => ({
                                              ...t,
                                              id: t.id.startsWith('yt_temp_') ? t.id : \`yt_temp_\${t.id}\`
                                            }));
                                          setTrackQueue(radioQueue);
                                          trackQueueRef.current = radioQueue;
                                          showNotification(\`\${radioQueue.length} canciones del repertorio añadidas\`);
                                        } else {
                                          const allTracksOnly = youtubeResults
                                            .filter((t) => !t.isPlaylist && t.id !== ytTrack.id)
                                            .map((t) => ({
                                              id: \`yt_temp_\${t.id}\`,
                                              title: t.title,
                                              artist: t.artist || "Flux",
                                              url: t.url,
                                              duration: t.duration || "N/A",
                                              bpm: 120,
                                            }));
                                          setTrackQueue(allTracksOnly);
                                          trackQueueRef.current = allTracksOnly;
                                          showNotification(\`\${allTracksOnly.length} canciones añadidas a la cola\`);
                                        }
                                      }).catch(() => {});`;

const searchClickReplacement = `                                    const artistName = ytTrack.artist && ytTrack.artist !== "Flux" ? ytTrack.artist : "";

                                    if (artistName && searchQuery && searchQuery.trim().length > 0) {
                                      // Buscar el repertorio del artista específicamente para no mezclar
                                      Promise.all([
                                        fetch(\`/api/youtube/search?q=\${encodeURIComponent(artistName + " exitos")}\`).then(r => r.json()).catch(() => []),
                                        fetch(\`/api/youtube/search?q=\${encodeURIComponent(artistName + " audio")}\`).then(r => r.json()).catch(() => []),
                                        fetch(\`/api/youtube/search?q=\${encodeURIComponent(artistName + " album completo")}\`).then(r => r.json()).catch(() => [])
                                      ]).then(([exitosData, audioData, albumData]) => {
                                        const combined = [...(Array.isArray(exitosData) ? exitosData : []), ...(Array.isArray(audioData) ? audioData : []), ...(Array.isArray(albumData) ? albumData : [])];
                                        const uniqueMap = new Map();
                                        const targetIdWithPrefix = \`yt_temp_\${ytTrack.id}\`;
                                        
                                        combined.forEach(t => {
                                          if (!t.isPlaylist && t.id !== ytTrack.id && t.id !== targetIdWithPrefix) {
                                            const tArtist = (t.artist || "").toLowerCase();
                                            const tTitle = (t.title || "").toLowerCase();
                                            const aNameLower = artistName.toLowerCase();
                                            // Filtro estricto: el nombre del artista debe estar en el campo de artista o en el título (para fts)
                                            if (tArtist.includes(aNameLower) || tTitle.includes(aNameLower)) {
                                              uniqueMap.set(t.id, t);
                                            }
                                          }
                                        });
                                        
                                        const radioQueue = Array.from(uniqueMap.values()).map((t: any) => ({
                                          ...t,
                                          id: t.id.startsWith('yt_temp_') ? t.id : \`yt_temp_\${t.id}\`
                                        }));
                                        
                                        if (radioQueue.length > 0) {
                                          setTrackQueue(radioQueue);
                                          trackQueueRef.current = radioQueue;
                                          showNotification(\`\${radioQueue.length} éxitos de \${artistName} añadidos a la cola\`);
                                        } else {
                                          // Fallback a los resultados actuales de la búsqueda
                                          const allTracksOnly = youtubeResults
                                            .filter((t) => !t.isPlaylist && t.id !== ytTrack.id)
                                            .map((t) => ({
                                              id: \`yt_temp_\${t.id}\`,
                                              title: t.title,
                                              artist: t.artist || "Flux",
                                              url: t.url,
                                              duration: t.duration || "N/A",
                                              bpm: 120,
                                            }));
                                          setTrackQueue(allTracksOnly);
                                          trackQueueRef.current = allTracksOnly;
                                          showNotification(\`\${allTracksOnly.length} canciones añadidas a la cola\`);
                                        }
                                      }).catch(() => {});
                                    } else {
                                      // Fallback original para otras listas o cuando no hay artista definido
                                      fetch(\`/api/youtube/upnext?id=\${ytTrack.id}\`)
                                        .then(r => r.json())
                                        .then(data => {
                                          if (data && data.length > 0) {
                                            const targetIdWithPrefix = \`yt_temp_\${ytTrack.id}\`;
                                            const radioQueue = data
                                              .filter((t: any) => t.id !== ytTrack.id && t.id !== targetIdWithPrefix)
                                              .map((t: any) => ({
                                                ...t,
                                                id: t.id.startsWith('yt_temp_') ? t.id : \`yt_temp_\${t.id}\`
                                              }));
                                            setTrackQueue(radioQueue);
                                            trackQueueRef.current = radioQueue;
                                            showNotification(\`\${radioQueue.length} canciones similares añadidas a la cola\`);
                                          } else {
                                            const allTracksOnly = youtubeResults
                                              .filter((t) => !t.isPlaylist && t.id !== ytTrack.id)
                                              .map((t) => ({
                                                id: \`yt_temp_\${t.id}\`,
                                                title: t.title,
                                                artist: t.artist || "Flux",
                                                url: t.url,
                                                duration: t.duration || "N/A",
                                                bpm: 120,
                                              }));
                                            setTrackQueue(allTracksOnly);
                                            trackQueueRef.current = allTracksOnly;
                                            showNotification(\`\${allTracksOnly.length} canciones añadidas a la cola\`);
                                          }
                                        }).catch(() => {});
                                    }`;

code = code.replace(searchClickTarget, searchClickReplacement);

const nextRadioTarget = `      // Infinite radio logic: if queue is running out, fetch more related tracks and append
      if (newQueue.length <= 3 && nextTrackTarget.id.startsWith('yt_temp_') && !window._isFetchingUpNext) {
          window._isFetchingUpNext = true;
          const ytId = nextTrackTarget.id.replace('yt_temp_', '');
          fetch(\`/api/youtube/upnext?id=\${ytId}\`)
            .then(r => r.json())
            .then(data => {
              if (data && data.length > 0) {
                const targetIdWithPrefix = \`yt_temp_\${ytId}\`;
                // Filter out duplicates that might already be in the newQueue
                const currentIds = new Set(newQueue.map((t: any) => t.id));
                const radioQueue = data
                  .filter((t: any) => t.id !== ytId && t.id !== targetIdWithPrefix)
                  .map((t: any) => ({
                    ...t,
                    id: t.id.startsWith('yt_temp_') ? t.id : \`yt_temp_\${t.id}\`
                  }))
                  .filter((t: any) => !currentIds.has(t.id));
                  
                const appendedQueue = [...newQueue, ...radioQueue];
                setTrackQueue(appendedQueue);
                trackQueueRef.current = appendedQueue;
              }
            })
            .catch(() => {})
            .finally(() => {
              window._isFetchingUpNext = false;
            });
      }`;

const nextRadioReplacement = `      // Infinite radio logic: if queue is empty and we are playing a youtube track, fetch more related tracks
      if (newQueue.length === 0 && nextTrackTarget.id.startsWith('yt_temp_')) {
          const ytId = nextTrackTarget.id.replace('yt_temp_', '');
          fetch(\`/api/youtube/upnext?id=\${ytId}\`)
            .then(r => r.json())
            .then(data => {
              if (data && data.length > 0) {
                const targetIdWithPrefix = \`yt_temp_\${ytId}\`;
                const radioQueue = data
                  .filter((t: any) => t.id !== ytId && t.id !== targetIdWithPrefix)
                  .map((t: any) => ({
                    ...t,
                    id: t.id.startsWith('yt_temp_') ? t.id : \`yt_temp_\${t.id}\`
                  }));
                setTrackQueue(radioQueue);
                trackQueueRef.current = radioQueue;
              }
            }).catch(() => {});
      }`;

code = code.replace(nextRadioTarget, nextRadioReplacement);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log('Reverted infinite radio patch');
