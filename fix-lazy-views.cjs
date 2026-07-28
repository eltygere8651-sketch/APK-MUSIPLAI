const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The first patch probably failed to wrap the main content because the regex didn't match.
// Let's check if Suspense is in the file.
if (!code.includes('<React.Suspense')) {
  const viewRenderRegex = /(<main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-36 sm:pb-32 bg-black">)([\s\S]*?)(<\/main>)/;
  const fallback = `<React.Suspense fallback={<div className="flex items-center justify-center h-full w-full pt-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}>`;
  code = code.replace(viewRenderRegex, `$1\n        ${fallback}\n$2\n        </React.Suspense>\n$3`);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Fixed React.lazy wrapping");
} else {
  console.log("Suspense already present, doing nothing");
}
