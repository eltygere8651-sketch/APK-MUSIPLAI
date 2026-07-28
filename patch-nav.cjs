const fs = require('fs');
let code = fs.readFileSync('src/components/MobileBottomNav.tsx', 'utf8');
code = code.replace("grid-cols-3", "grid-cols-5");
fs.writeFileSync('src/components/MobileBottomNav.tsx', code);
