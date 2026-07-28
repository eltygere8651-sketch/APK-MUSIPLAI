const fs = require('fs');

let code = fs.readFileSync('src/domain/storage/LocalStorage.ts', 'utf8');

const getAllTracksRegex = /public async getAllTracks\(\)[\s\S]*?return track;\n\s*\}\)\n\s*\);\n\s*\}/;

const newGetAllTracks = `public async getAllTracks(): Promise<Track[]> {
    const db = await this.dbPromise;
    // We do NOT fetch all blobs into memory here. It crashes on large libraries.
    // We just return the track metadata. The AudioEngine will fetch the blob when playing.
    const tracks = await db.getAll('tracks');
    return tracks;
  }`;

code = code.replace(getAllTracksRegex, newGetAllTracks);

fs.writeFileSync('src/domain/storage/LocalStorage.ts', code);
console.log("Patched LocalStorage getAllTracks");
