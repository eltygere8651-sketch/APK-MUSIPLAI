const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetCheckUnread = `    const checkUnread = async () => {
      try {
        const snapshot = await getDocs(q);
        const newestId = !snapshot.empty ? snapshot.docs[0].id : null;
        let hasUnreadDb = false;

        const lastViewed = localStorage.getItem("flux_last_viewed_announcement_id");
        if (newestId && newestId !== lastViewed) {
          hasUnreadDb = true;
        }

        setHasUnread(hasUnreadDb);
      } catch (err) {
        console.warn("No se pudo revisar anuncios de Firebase en tiempo real:", err);
        // Fallback to local compiled updates
        const lastViewed = localStorage.getItem("flux_last_viewed_announcement_id");
        if (COMPILED_UPDATES.length > 0 && COMPILED_UPDATES[0].id !== lastViewed) {
          setHasUnread(true);
        }
      }
    };`;

const replacementCheckUnread = `    const checkUnread = async () => {
      try {
        const snapshot = await getDocs(q);
        
        const newestFbId = !snapshot.empty ? snapshot.docs[0].id : null;
        const ca = !snapshot.empty ? snapshot.docs[0].data().createdAt : null;
        const fbDate = ca ? (typeof ca.toMillis === 'function' ? ca.toMillis() : ca.toMillis ? ca.toMillis() : new Date(ca).getTime()) : 0;
        
        const compiledId = COMPILED_UPDATES.length > 0 ? COMPILED_UPDATES[0].id : null;
        const compiledDate = COMPILED_UPDATES.length > 0 ? COMPILED_UPDATES[0].createdAt.getTime() : 0;
        
        let newestId = null;
        if (newestFbId && fbDate > compiledDate) {
          newestId = newestFbId;
        } else {
          newestId = compiledId;
        }

        const lastViewed = localStorage.getItem("flux_last_viewed_announcement_id");
        if (newestId && newestId !== lastViewed) {
          setHasUnread(true);
        } else {
          setHasUnread(false);
        }
      } catch (err) {
        console.warn("No se pudo revisar anuncios de Firebase en tiempo real:", err);
        // Fallback to local compiled updates
        const lastViewed = localStorage.getItem("flux_last_viewed_announcement_id");
        if (COMPILED_UPDATES.length > 0 && COMPILED_UPDATES[0].id !== lastViewed) {
          setHasUnread(true);
        }
      }
    };`;

code = code.replace(targetCheckUnread, replacementCheckUnread);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed checkUnread');
