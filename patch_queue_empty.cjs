const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const target = `    if (trackQueueRef.current.length > 0) {
      nextTrackTarget = trackQueueRef.current[0];
      setOverrideCurrentTrack(nextTrackTarget);
      setTrackQueue(trackQueueRef.current.slice(1));
      showNotification(\`Siguiente en cola: \${nextTrackTarget.title}\`);
      pendingSeekPosRef.current = null;
      setPosition(0);
      setDuration(0);
      setIsPlaying(true);
      loadIframeVideoDirectly(nextTrackTarget);
      return;
    }`;

const replacement = `    if (trackQueueRef.current.length > 0) {
      nextTrackTarget = trackQueueRef.current[0];
      setOverrideCurrentTrack(nextTrackTarget);
      
      const newQueue = trackQueueRef.current.slice(1);
      setTrackQueue(newQueue);
      trackQueueRef.current = newQueue;

      // Infinite radio logic: if queue is empty and we are playing a youtube track, fetch more related tracks
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
      }

      showNotification(\`Siguiente en cola: \${nextTrackTarget.title}\`);
      pendingSeekPosRef.current = null;
      setPosition(0);
      setDuration(0);
      setIsPlaying(true);
      loadIframeVideoDirectly(nextTrackTarget);
      return;
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
