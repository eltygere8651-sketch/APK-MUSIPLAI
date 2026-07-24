const fs = require('fs');
const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('App.addListener')) {
  // Add Capacitor App import
  code = `import { App as CapacitorApp } from '@capacitor/app';\n` + code;
  
  // Add listener inside AppContent or App component
  const listenerCode = `
  useEffect(() => {
    CapacitorApp.addListener('appUrlOpen', data => {
      console.log('App opened with URL:', data.url);
      if (data.url.includes('__%2Fauth%2Fhandler') || data.url.includes('__/auth/handler')) {
        // Redirect the webview to the OAuth response URL so Firebase can process it
        const urlObj = new URL(data.url);
        window.location.assign(urlObj.pathname + urlObj.search + urlObj.hash);
      }
    });
  }, []);
`;
  code = code.replace(/export default function App\(\) \{[\s\S]*?return \(/, `export default function App() {\n${listenerCode}\n  return (`);
  
  fs.writeFileSync(file, code);
  console.log('Fixed Google Auth Redirect for Capacitor in App.tsx');
}
