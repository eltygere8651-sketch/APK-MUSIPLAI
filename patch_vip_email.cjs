const fs = require('fs');
let code = fs.readFileSync('src/components/VIPLandingView.tsx', 'utf-8');

code = code.replaceAll('\`vip_\${deviceHash}@flux.local\`', '\`socio.\${deviceHash.substring(0, 6)}@fluxmusic.com\`');
code = code.replaceAll('\`\${deviceHash}_fluxvip\`', '\`\${deviceHash.substring(0, 10)}_fluxvip\`');

fs.writeFileSync('src/components/VIPLandingView.tsx', code);
console.log('Done VIP Email');
