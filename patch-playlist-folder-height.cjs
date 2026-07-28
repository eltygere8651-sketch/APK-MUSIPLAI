const fs = require('fs');

let playlist = fs.readFileSync('src/components/PlaylistView.tsx', 'utf8');
playlist = playlist.replace(
  '<div className="space-y-6 select-none">',
  '<div className="space-y-6 select-none h-full flex flex-col">'
);
playlist = playlist.replace(
  '<div className="flex-1">',
  '<div className="flex-1 flex flex-col min-h-0">'
);
fs.writeFileSync('src/components/PlaylistView.tsx', playlist);

let folder = fs.readFileSync('src/components/FolderBrowserView.tsx', 'utf8');
folder = folder.replace(
  '<div className="space-y-6 select-none">',
  '<div className="space-y-6 select-none h-full flex flex-col">'
);
folder = folder.replace(
  '<div className="space-y-4">',
  '<div className="space-y-4 flex flex-col h-full min-h-0">'
);
fs.writeFileSync('src/components/FolderBrowserView.tsx', folder);

console.log("Patched heights");
