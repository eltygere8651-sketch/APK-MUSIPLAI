const fs = require('fs');

let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

// Fix in the search click handler:
const searchClickFind = `                                    fetch(\`/api/youtube/upnext?id=\${ytTrack.id}\`)
                                      .then(r => r.json())
                                      .then(data => {
                                        if (data && data.length > 0) {
                                          const radioQueue = data.filter((t: any) => t.id !== \`yt_temp_\${ytTrack.id}\`);
                                          setTrackQueue(radioQueue);
                                          trackQueueRef.current = radioQueue;
                                          showNotification(\`\${radioQueue.length} canciones relacionadas añadidas a la cola\`);
                                        }`;

const searchClickReplace = `                                    fetch(\`/api/youtube/upnext?id=\${ytTrack.id}\`)
                                      .then(r => r.json())
                                      .then(data => {
                                        if (data && data.length > 0) {
                                          const radioQueue = data
                                            .filter((t: any) => t.id !== ytTrack.id)
                                            .map((t: any) => ({ ...t, id: \`yt_temp_\${t.id}\` }));
                                          setTrackQueue(radioQueue);
                                          trackQueueRef.current = radioQueue;
                                          showNotification(\`\${radioQueue.length} canciones similares añadidas a la cola\`);
                                        }`;

code = code.replace(searchClickFind, searchClickReplace);

// Fix in the grid click handler:
const gridClickFind = `                                        fetch(\`/api/youtube/upnext?id=\${item.id}\`)
                                          .then(r => r.json())
                                          .then(data => {
                                            if (data && data.length > 0) {
                                              const radioQueue = data.filter((t: any) => t.id !== tempTrack.id);
                                              setTrackQueue(radioQueue);
                                              trackQueueRef.current = radioQueue;
                                              showNotification(\`\${radioQueue.length} canciones relacionadas añadidas a la cola\`);
                                            }
                                          }).catch(() => {});`;

const gridClickReplace = `                                        fetch(\`/api/youtube/upnext?id=\${item.id}\`)
                                          .then(r => r.json())
                                          .then(data => {
                                            if (data && data.length > 0) {
                                              const radioQueue = data
                                                .filter((t: any) => t.id !== item.id)
                                                .map((t: any) => ({ ...t, id: \`yt_temp_\${t.id}\` }));
                                              setTrackQueue(radioQueue);
                                              trackQueueRef.current = radioQueue;
                                              showNotification(\`\${radioQueue.length} canciones relacionadas añadidas a la cola\`);
                                            }
                                          }).catch(() => {});`;

code = code.replace(gridClickFind, gridClickReplace);

// Fix in handleNext infinite radio logic:
const nextRadioFind = `      // Infinite radio logic: if queue is empty and we are playing a youtube track, fetch more related tracks
      if (newQueue.length === 0 && nextTrackTarget.id.startsWith('yt_temp_')) {
          const ytId = nextTrackTarget.id.replace('yt_temp_', '');
          fetch(\`/api/youtube/upnext?id=\${ytId}\`)
            .then(r => r.json())
            .then(data => {
              if (data && data.length > 0) {
                const radioQueue = data.filter((t: any) => t.id !== nextTrackTarget.id);
                setTrackQueue(radioQueue);
                trackQueueRef.current = radioQueue;
              }
            }).catch(() => {});
      }`;

const nextRadioReplace = `      // Infinite radio logic: if queue is empty and we are playing a youtube track, fetch more related tracks
      if (newQueue.length === 0 && nextTrackTarget.id.startsWith('yt_temp_')) {
          const ytId = nextTrackTarget.id.replace('yt_temp_', '');
          fetch(\`/api/youtube/upnext?id=\${ytId}\`)
            .then(r => r.json())
            .then(data => {
              if (data && data.length > 0) {
                const radioQueue = data
                  .filter((t: any) => t.id !== ytId)
                  .map((t: any) => ({ ...t, id: \`yt_temp_\${t.id}\` }));
                setTrackQueue(radioQueue);
                trackQueueRef.current = radioQueue;
              }
            }).catch(() => {});
      }`;

code = code.replace(nextRadioFind, nextRadioReplace);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
