const fs = require('fs');

let content = fs.readFileSync('src/engine/NativeAudioEngine.tsx', 'utf8');

const importStatement = `import { resolveAudioUrl } from '../lib/ClientResolver';\n`;
if (!content.includes('resolveAudioUrl')) {
  content = content.replace(/(import { PlaybackEngine } from '.\/types';)/, `$1\n${importStatement}`);
}

const syncUrlRegex = /\/\/ Sync URL changes to Native Engine[\s\S]*?\}, \[context\.currentUrl\]\);/m;
const initialLoadRegex = /\/\/ Initial load if url is present on mount[\s\S]*?\}, \[\]\);/m;

const newSyncUrl = `
  // Helper to extract Video ID from URL
  const extractVideoId = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
    } catch {
      return null;
    }
  };

  // Sync URL changes to Native Engine
  useEffect(() => {
    console.log(\`[DEBUG_BRIDGE] Sync URL changes triggered. context.currentUrl: \${context.currentUrl}\`);
    if (context.currentUrl && context.currentUrl !== currentUrlRef.current) {
      console.log(\`[DEBUG_BRIDGE] URL changed from \${currentUrlRef.current} to \${context.currentUrl}\`);
      currentUrlRef.current = context.currentUrl;
      const displayTrack = context.displayTracks?.[context.currentTrackIndex];
      loadingUrlRef.current = context.currentUrl;
      
      const loadVideo = async () => {
        try {
          const videoId = extractVideoId(context.currentUrl);
          if (!videoId) throw new Error('Invalid Video ID');
          
          console.log('[DEBUG_BRIDGE] Resolving audio url for ' + videoId);
          const audioUrl = await resolveAudioUrl(videoId);
          console.log('[DEBUG_BRIDGE] Resolved direct audio URL length:', audioUrl.length);

          const loadParams = {
            url: audioUrl,
            title: displayTrack?.title || "Audio Track",
            artist: displayTrack?.artist || "Unknown Artist",
            coverUrl: displayTrack?.imageUrl || displayTrack?.thumbnail || "",
            position: context.pendingSeekPosRef?.current ? context.pendingSeekPosRef.current * 1000 : 0
          };
          
          console.log(\`[DEBUG_BRIDGE] Calling engine.load() with params\`);
          await engine.load(loadParams);
          console.log(\`[DEBUG_BRIDGE] engine.load() completed successfully.\`);
          
          if (context.isPlaying) {
            console.log(\`[DEBUG_BRIDGE] context.isPlaying is true, calling engine.play()\`);
            await engine.play();
          }
        } catch (e) {
          console.warn("[DEBUG_BRIDGE] NativeAudioBridge load error", e);
          if (context.consecutiveErrorsRef) {
             context.consecutiveErrorsRef.current += 1;
          }
          if (context.handleNextRef?.current) {
             setTimeout(() => context.handleNextRef.current(true), 1500);
          }
        }
      };
      
      loadVideo();
    } else if (!context.currentUrl) {
      console.log(\`[DEBUG_BRIDGE] No URL, stopping engine\`);
      engine.stop().catch(() => {});
    }
  }, [context.currentUrl]);
`;

const newInitialLoad = `
  // Initial load if url is present on mount
  useEffect(() => {
    console.log(\`[DEBUG_BRIDGE] Initial load check. context.currentUrl: \${context.currentUrl}\`);
    if (context.currentUrl && currentUrlRef.current === context.currentUrl && loadingUrlRef.current !== context.currentUrl) {
      loadingUrlRef.current = context.currentUrl;
      const displayTrack = context.displayTracks?.[context.currentTrackIndex];
      
      const loadVideo = async () => {
        try {
          const videoId = extractVideoId(context.currentUrl);
          if (!videoId) throw new Error('Invalid Video ID');
          
          console.log('[DEBUG_BRIDGE] Resolving audio url for ' + videoId);
          const audioUrl = await resolveAudioUrl(videoId);

          const loadParams = {
            url: audioUrl,
            title: displayTrack?.title || "Audio Track",
            artist: displayTrack?.artist || "Unknown Artist",
            coverUrl: displayTrack?.imageUrl || displayTrack?.thumbnail || "",
            position: context.pendingSeekPosRef?.current ? context.pendingSeekPosRef.current * 1000 : 0
          };
          
          console.log(\`[DEBUG_BRIDGE] Initial loading engine\`);
          await engine.load(loadParams);
          
          if (context.isPlaying) {
            console.log(\`[DEBUG_BRIDGE] Initial load complete, playing\`);
            await engine.play();
          }
        } catch (e) {
          console.warn("[DEBUG_BRIDGE] NativeAudioBridge initial load error", e);
        }
      };
      
      loadVideo();
    }
  }, []);
`;

content = content.replace(syncUrlRegex, newSyncUrl.trim());
content = content.replace(initialLoadRegex, newInitialLoad.trim());

fs.writeFileSync('src/engine/NativeAudioEngine.tsx', content, 'utf8');
