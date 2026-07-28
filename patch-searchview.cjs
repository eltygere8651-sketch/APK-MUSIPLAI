const fs = require('fs');

let code = fs.readFileSync('src/components/SearchView.tsx', 'utf8');

code = code.replace(
  "youtubeId: result.id,\n      duration: result.duration,\n      createdAt: Date.now()",
  "youtubeId: result.id,\n      duration: result.duration,\n      createdAt: Date.now(),\n      url: '',\n      addedAt: Date.now()"
);

fs.writeFileSync('src/components/SearchView.tsx', code);
console.log("Patched SearchView.tsx");
