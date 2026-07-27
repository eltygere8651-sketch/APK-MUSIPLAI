const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace("  useEffect(() => {\n  const { user, loading: authLoading", "  const { user, loading: authLoading");

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Patched App.tsx");
