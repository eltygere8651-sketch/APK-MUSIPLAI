const fs = require('fs');
let content = fs.readFileSync('src/engine/NativeAudioEngine.tsx', 'utf8');

const target = `        } catch (e) {
          console.warn("[DEBUG_BRIDGE] NativeAudioBridge initial load error", e);
          console.error(\`[RESOLVER_DEBUG]\\nvideoId: \${videoId}\\ncurrentUrl: \${context.currentUrl}\\naudioUrl: \${audioUrl}\\nerror:\`, e);
        }`;

const replacement = `        } catch (e) {
          console.warn("[DEBUG_BRIDGE] NativeAudioBridge initial load error", e);
          console.error(\`[RESOLVER_DEBUG]\\nvideoId: \${videoId}\\ncurrentUrl: \${context.currentUrl}\\naudioUrl: \${audioUrl}\\nerror:\`, e);
          if (context.consecutiveErrorsRef) {
             context.consecutiveErrorsRef.current += 1;
          }
          if (context.handleNextRef?.current) {
             setTimeout(() => context.handleNextRef.current(true), 1500);
          }
        }`;

if(content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/engine/NativeAudioEngine.tsx', content, 'utf8');
    console.log("Patched successfully");
} else {
    console.log("Target not found!");
}
