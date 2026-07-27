const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace("function AppContent() {\n  useEffect(() => {\n  useEffect(() => {\n  }, []);", "function AppContent() {");

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Patched App.tsx again");
