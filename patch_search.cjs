const fs = require('fs');
let code = fs.readFileSync('api/youtube/search.ts', 'utf8');

const oldLogic = `    if (isPlaylistSearch) {
       const [resAll, resPl] = await Promise.all([
           yt.search(query),
           yt.search(query, { type: 'playlist' })
       ]);
       resultsObj = resAll;
       if (resPl.playlists) extraItems = resPl.playlists;
       else if (resPl.results) extraItems = resPl.results;
    } else {
       resultsObj = await yt.search(query);
    }`;

const newLogic = `    let musicSongs: any[] = [];
    if (isPlaylistSearch) {
       const [resAll, resPl] = await Promise.all([
           yt.search(query),
           yt.search(query, { type: 'playlist' })
       ]);
       resultsObj = resAll;
       if (resPl.playlists) extraItems = resPl.playlists;
       else if (resPl.results) extraItems = resPl.results;
    } else {
       const [resAll, resMusic] = await Promise.all([
           yt.search(query),
           yt.music.search(query, { type: 'song' }).catch(() => null)
       ]);
       resultsObj = resAll;
       if (resMusic && resMusic.contents) {
           const shelf = resMusic.contents.find((c: any) => c.type === 'MusicShelf');
           if (shelf && shelf.contents) {
               musicSongs = shelf.contents;
           }
       }
    }`;

code = code.replace(oldLogic, newLogic);

const oldCombine = `const combinedItems = [...(resultsObj.results || []), ...extraItems];`;
const newCombine = `const combinedItems = [...musicSongs, ...(resultsObj.results || []), ...extraItems];`;

code = code.replace(oldCombine, newCombine);

const oldItemLogic = `      for (const item of combinedItems) {
        if (item.type === 'Video') {`;
const newItemLogic = `      for (const item of combinedItems) {
        if (item.type === 'MusicResponsiveListItem') {
           try {
             const title = item.title;
             const author = item.artists?.map((a: any) => a.name).join(', ') || "Unknown Artist";
             const duration = item.duration?.text || "";
             const id = item.id;
             const thumbnail = item.thumbnails?.[0]?.url || "";
             
             if (id && title && !seenIds.has(id)) {
               seenIds.add(id);
               parsedResults.push({
                 id,
                 title: title,
                 artist: author,
                 duration,
                 url: \`https://www.youtube.com/watch?v=\${id}\`,
                 thumbnail,
                 isPlaylist: false
               });
             }
           } catch(e) {}
        } else if (item.type === 'Video') {`;

code = code.replace(oldItemLogic, newItemLogic);

fs.writeFileSync('api/youtube/search.ts', code);
