const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldMap = `const results = search.videos.slice(0, 10).map(v => ({
      id: v.id,
      title: v.title?.text || v.title,
      duration: v.duration?.seconds,
      author: v.author?.name
    }));`;

const newMap = `const results = search.videos.slice(0, 10).map((v: any) => ({
      id: v.id,
      title: v.title?.text || v.title,
      duration: v.duration?.seconds || 0,
      author: v.author?.name || 'Unknown'
    }));`;

code = code.replace(oldMap, newMap);
code = code.replace("const search = await ytClient.search(query, { type: 'video' });", "const search = await ytClient.search(query as string, { type: 'video' });");

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts");
