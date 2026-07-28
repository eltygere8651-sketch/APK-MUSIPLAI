const fs = require('fs');
let code = fs.readFileSync('src/components/SidebarNavigation.tsx', 'utf8');

code = code.replace(
  "{ id: 'import', label: 'Importar', icon: DownloadCloud }",
  "{ id: 'import', label: 'Importar', icon: DownloadCloud },\n    { id: 'settings', label: 'Ajustes', icon: Settings }"
);

fs.writeFileSync('src/components/SidebarNavigation.tsx', code);
