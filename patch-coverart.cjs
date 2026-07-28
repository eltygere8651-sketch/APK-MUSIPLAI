const fs = require('fs');

function patchFile(file) {
  let code = fs.readFileSync(file, 'utf8');

  if (!code.includes("const getCoverArt =")) {
    const fn = `\n  const getCoverArt = (t: import('../domain/types').Track) => t.artworkUrl || (t.youtubeId ? \`https://i.ytimg.com/vi/\${t.youtubeId}/hqdefault.jpg\` : null);\n`;
    code = code.replace("const NowPlayingBar = (", "const NowPlayingBar = (");
    code = code.replace(/const (NowPlayingBar|FullScreenPlayerModal) = \([^)]*\)\s*(?:=>)?\s*\{/, match => match + fn);
    
    code = code.replace(/currentTrack\.artworkUrl/g, "getCoverArt(currentTrack)");
    
    fs.writeFileSync(file, code);
    console.log("Patched", file);
  }
}

patchFile('src/components/NowPlayingBar.tsx');
patchFile('src/components/FullScreenPlayerModal.tsx');
