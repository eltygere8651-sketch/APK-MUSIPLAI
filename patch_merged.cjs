const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldStr = `    const processMergedDocs = () => {
      // Unir documentos, dando prioridad a las versiones del usuario
      const combined = new Map();
      communityDocsRef.current.forEach((doc) => combined.set(doc.id, doc));
      userDocsRef.current.forEach((doc) => combined.set(doc.id, doc));

      const mergedDocs = Array.from(combined.values());

      mergedDocs.sort((a, b) => {
        const orderA =
          typeof a.data().orderScore === "number" ? a.data().orderScore : 0;
        const orderB =
          typeof b.data().orderScore === "number" ? b.data().orderScore : 0;
        if (orderA !== orderB) {
          return orderB - orderA; // Descending
        }
        const tA = a.data().createdAt?.toMillis?.() || 0;
        const tB = b.data().createdAt?.toMillis?.() || 0;
        return tB - tA;
      });

      const folders = mergedDocs
        .map((doc) => {
          const data = doc.data();`;

const newStr = `    const processMergedDocs = () => {
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

code = code.replace(oldStr, newStr);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
