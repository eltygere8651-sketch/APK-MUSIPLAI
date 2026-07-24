const fs = require('fs');

let code = fs.readFileSync('src/components/ExploreView.tsx', 'utf8');
code = code.replace(
  '<div className="space-y-4 pb-32 px-0 sm:px-2">',
  '<div className="space-y-6 pb-6 px-0">'
);
fs.writeFileSync('src/components/ExploreView.tsx', code);
