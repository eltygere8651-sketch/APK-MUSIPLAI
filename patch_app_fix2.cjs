const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace("  const { user, loading: authLoading", "  useEffect(() => {\n  }, []);\n  const { user, loading: authLoading");
fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Patched App.tsx");
