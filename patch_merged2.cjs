const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const regex = /const processMergedDocs = \(\) => \{\s+\/\/ Unir documentos, dando prioridad a las versiones del usuario\s+const combined = new Map\(\);\s+communityDocsRef\.current\.forEach\(\(doc\) => combined\.set\(doc\.id, doc\)\);\s+userDocsRef\.current\.forEach\(\(doc\) => combined\.set\(doc\.id, doc\)\);\s+const mergedDocs = Array\.from\(combined\.values\(\)\);\s+mergedDocs\.sort\(\(a, b\) => \{\s+const orderA =\s+typeof a\.data\(\)\.orderScore === "number"\s*\?\s*a\.data\(\)\.orderScore\s*:\s*0;\s+const orderB =\s+typeof b\.data\(\)\.orderScore === "number"\s*\?\s*b\.data\(\)\.orderScore\s*:\s*0;\s+if \(orderA !== orderB\) \{\s+return orderB - orderA; \/\/ Descending\s+\}\s+const tA = a\.data\(\)\.createdAt\?\.toMillis\?\.\(\) \|\| 0;\s+const tB = b\.data\(\)\.createdAt\?\.toMillis\?\.\(\) \|\| 0;\s+return tB - tA;\s+\}\);\s+const folders = mergedDocs\s+\.map\(\(doc\) => \{\s+const data = doc\.data\(\);/s;

const newStr = `const processMergedDocs = () => {
      const normalizeDoc = (doc) => {
        if (typeof doc.data === 'function') {
           return { id: doc.id, data: doc.data(), ref: { path: doc.ref.path } };
        }
        return { id: doc.id, data: doc._data || doc.data || {}, ref: { path: doc.ref?.path || "" } };
      };

      // Unir documentos, dando prioridad a las versiones del usuario
      const combined = new Map();
      communityDocsRef.current.forEach((doc) => combined.set(doc.id, normalizeDoc(doc)));
      userDocsRef.current.forEach((doc) => combined.set(doc.id, normalizeDoc(doc)));

      const mergedDocs = Array.from(combined.values());

      mergedDocs.sort((a, b) => {
        const orderA =
          typeof a.data.orderScore === "number" ? a.data.orderScore : 0;
        const orderB =
          typeof b.data.orderScore === "number" ? b.data.orderScore : 0;
        if (orderA !== orderB) {
          return orderB - orderA; // Descending
        }
        const tA = a.data.createdAt?.toMillis?.() || (a.data.createdAt?.seconds ? a.data.createdAt.seconds * 1000 : 0) || a.data.createdAt || 0;
        const tB = b.data.createdAt?.toMillis?.() || (b.data.createdAt?.seconds ? b.data.createdAt.seconds * 1000 : 0) || b.data.createdAt || 0;
        return tB - tA;
      });

      const folders = mergedDocs
        .map((doc) => {
          const data = doc.data;`;

if (regex.test(code)) {
    code = code.replace(regex, newStr);
    fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
    console.log("Patched successfully!");
} else {
    console.log("Regex didn't match.");
}
