const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace('import ClientResolverPOC from "./lab/clientResolver/ClientResolverPOC";\n', '');
content = content.replace(/  const \[isPOC, setIsPOC\] = useState\(window\.location\.hash === '#poc'\);\n/, '');
content = content.replace(/  if \(isPOC\) \{\n    return <ClientResolverPOC \/>;\n  \}\n\n/, '');

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Patched App.tsx");
