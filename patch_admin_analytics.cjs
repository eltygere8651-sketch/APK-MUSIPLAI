const fs = require('fs');
const path = './src/components/UserManagementAdmin.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('const [globalAnalytics, setGlobalAnalytics] = useState<any[]>([]);', '');

content = content.replace(/const docRef = doc\(db, "admin", "analytics"\);\s*const snap = await getDoc\(docRef\);\s*if \(snap\.exists\(\)\) \{\s*setGlobalAnalytics\(\[snap\.data\(\)\]\);\s*\} else \{\s*setGlobalAnalytics\(\[\]\);\s*\}/g, '');

const uiRegex = /\{globalAnalytics\.length > 0 && globalAnalytics\[0\]\.musicTime \!== undefined \? \(\s*<div[^>]*>.*?<\/div>\s*\) : \(\s*<div[^>]*>Sin datos suficientes\.<\/div>\s*\)\}/g;
// Actually, since I know the exact structure, it's easier to just slice it out or use string replacement.
fs.writeFileSync(path, content);
