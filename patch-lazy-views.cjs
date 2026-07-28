const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const importsToRemove = [
  "import { LibraryView } from './components/LibraryView';",
  "import { FolderBrowserView } from './components/FolderBrowserView';",
  "import { PlaylistView } from './components/PlaylistView';",
  "import { ImporterView } from './components/ImporterView';",
  "import { SettingsView } from './components/SettingsView';",
  "import { SearchView } from './components/SearchView';"
];

importsToRemove.forEach(imp => {
  code = code.replace(imp + '\n', '');
});

const lazyImports = `
const LibraryView = React.lazy(() => import('./components/LibraryView').then(m => ({ default: m.LibraryView })));
const FolderBrowserView = React.lazy(() => import('./components/FolderBrowserView').then(m => ({ default: m.FolderBrowserView })));
const PlaylistView = React.lazy(() => import('./components/PlaylistView').then(m => ({ default: m.PlaylistView })));
const ImporterView = React.lazy(() => import('./components/ImporterView').then(m => ({ default: m.ImporterView })));
const SettingsView = React.lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
const SearchView = React.lazy(() => import('./components/SearchView').then(m => ({ default: m.SearchView })));
`;

code = code.replace("import { FullScreenPlayerModal } from './components/FullScreenPlayerModal';", "import { FullScreenPlayerModal } from './components/FullScreenPlayerModal';\n" + lazyImports);

// Find where views are rendered and wrap in Suspense
const viewRenderRegex = /(<main className="flex-1 overflow-hidden relative pb-\[72px\] md:pb-\[90px\]">)([\s\S]*?)(<\/main>)/;

const fallback = `<React.Suspense fallback={<div className="flex items-center justify-center h-full w-full"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}>`;

code = code.replace(viewRenderRegex, `$1\n        ${fallback}\n$2\n        </React.Suspense>\n$3`);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx with React.lazy");
