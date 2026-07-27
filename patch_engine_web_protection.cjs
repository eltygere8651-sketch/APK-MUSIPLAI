const fs = require('fs');
let content = fs.readFileSync('src/engine/NativeAudioEngine.tsx', 'utf8');

if (!content.includes("@capacitor/core")) {
    content = content.replace("import React,", "import { Capacitor } from '@capacitor/core';\nimport React,");
}

const targetConstructor = `  constructor() {
    this.setupListeners();`;
const replacementConstructor = `  constructor() {
    if (Capacitor.getPlatform() === 'web') {
      console.error("NATIVE_AUDIO_NOT_AVAILABLE_ON_WEB: NativeAudioEngine must not be used on the web. Switching to ReactPlayerEngine requires factory level handling, but catching this here as a safety measure.");
    }
    this.setupListeners();`;

if(content.includes(targetConstructor)) {
    content = content.replace(targetConstructor, replacementConstructor);
    fs.writeFileSync('src/engine/NativeAudioEngine.tsx', content, 'utf8');
    console.log("Patched constructor");
} else {
    console.log("Could not find constructor target");
}

