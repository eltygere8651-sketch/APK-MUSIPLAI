const fs = require('fs');
let code = fs.readFileSync('src/components/VIPLandingView.tsx', 'utf-8');
code = code.replace("new CustomEvent('open-support-modal'", "new CustomEvent('open-support'");
fs.writeFileSync('src/components/VIPLandingView.tsx', code);
