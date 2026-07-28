const fs = require('fs');

let code = fs.readFileSync('src/components/LibraryView.tsx', 'utf8');

code = code.replace(
  '<div className="flex flex-col md:flex-row gap-6 select-none">',
  '<div className="flex flex-col md:flex-row gap-6 select-none h-full">'
);

code = code.replace(
  '<div className="flex-1 min-w-0">',
  '<div className="flex-1 min-w-0 h-full flex flex-col">'
);

fs.writeFileSync('src/components/LibraryView.tsx', code);
console.log("Patched LibraryView height");
