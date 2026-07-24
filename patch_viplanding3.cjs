const fs = require('fs');
let code = fs.readFileSync('src/components/VIPLandingView.tsx', 'utf-8');
const target = `import { Check, Loader2, ArrowRight, MessageSquare, Info } from 'lucide-react';`;
const replace = `import { Check, Loader2, ArrowRight, MessageSquare, Info, LogOut } from 'lucide-react';`;
if (code.includes(target)) {
  code = code.replace(target, replace);
  fs.writeFileSync('src/components/VIPLandingView.tsx', code);
  console.log("Patched VIPLandingView lucide import");
}
