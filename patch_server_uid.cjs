const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace('const q = query(collection(db, "users", uid, "playlists"), orderBy("createdAt", "desc"));', 'const q = query(collection(db, "users", uid as string, "playlists"), orderBy("createdAt", "desc"));');
fs.writeFileSync('server.ts', code);
