const fs = require('fs');
let content = fs.readFileSync('src/engine/NativeAudioEngine.tsx', 'utf8');

// 1. Add import
if (!content.includes("resolveClientStream")) {
  content = content.replace(
    "import { resolveAudioUrl } from '../lib/ClientResolver';",
    "import { resolveAudioUrl } from '../lib/ClientResolver';\nimport { resolveClientStream } from '../lib/ClientStreamResolver';"
  );
}

// 2. Add flag
if (!content.includes("USE_CLIENT_STREAM_RESOLVER")) {
  content = content.replace(
    "export function NativeAudioBridge({ children }: { children: React.ReactNode }) {",
    "const USE_CLIENT_STREAM_RESOLVER = true;\n\nexport function NativeAudioBridge({ children }: { children: React.ReactNode }) {"
  );
}

// 3. Update first loadVideo
const oldLoad1 = `          console.log('[DEBUG_BRIDGE] Resolving audio url for ' + videoId);
          audioUrl = await resolveAudioUrl(videoId);
          console.log('[DEBUG_BRIDGE] Resolved direct audio URL length:', audioUrl.length);`;

const newLoad1 = `          console.log('[DEBUG_BRIDGE] Resolving audio url for ' + videoId);
          if (USE_CLIENT_STREAM_RESOLVER) {
            try {
              audioUrl = await resolveClientStream(videoId);
              console.log('[CLIENT_RESOLVER] Resolved successfully from client');
            } catch (err) {
              console.warn('[CLIENT_RESOLVER_FAILED] Client resolver failed, falling back to backend resolver', err);
              audioUrl = await resolveAudioUrl(videoId);
            }
          } else {
            audioUrl = await resolveAudioUrl(videoId);
          }
          console.log('[DEBUG_BRIDGE] Resolved direct audio URL length:', audioUrl.length);`;

content = content.replace(oldLoad1, newLoad1);

// 4. Update second loadVideo
const oldLoad2 = `          console.log('[DEBUG_BRIDGE] Resolving audio url for ' + videoId);
          audioUrl = await resolveAudioUrl(videoId);
          const loadParams = {`;

const newLoad2 = `          console.log('[DEBUG_BRIDGE] Resolving audio url for ' + videoId);
          if (USE_CLIENT_STREAM_RESOLVER) {
            try {
              audioUrl = await resolveClientStream(videoId);
              console.log('[CLIENT_RESOLVER] Resolved successfully from client');
            } catch (err) {
              console.warn('[CLIENT_RESOLVER_FAILED] Client resolver failed, falling back to backend resolver', err);
              audioUrl = await resolveAudioUrl(videoId);
            }
          } else {
            audioUrl = await resolveAudioUrl(videoId);
          }
          const loadParams = {`;

content = content.replace(oldLoad2, newLoad2);

fs.writeFileSync('src/engine/NativeAudioEngine.tsx', content, 'utf8');
console.log("Patched successfully");
