const fs = require('fs');
let code = fs.readFileSync('src/components/ShareModal.tsx', 'utf-8');
const target = "const shareUrl = typeof window !== 'undefined' ? window.location.origin.replace(/^http:\\/\\//i, 'https://') + \"/vip\" : \"https://fluxplay.cc/vip\";";
code = code.replace(target, 'const shareUrl = "https://www.fluxplay.cc/vip";');
fs.writeFileSync('src/components/ShareModal.tsx', code);
