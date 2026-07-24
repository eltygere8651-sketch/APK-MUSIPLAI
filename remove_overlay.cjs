const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace('{/* Overlays to hide any remaining YouTube branding edges if scale is not enough */}\n                <div className="absolute bottom-0 right-0 w-32 h-16 bg-black z-30 pointer-events-none blur-xl opacity-80" />', '');

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Overlay removed");
