const fs = require('fs');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/fetchWithCache\(`\$\{API_BASE_URL\}"/g, 'fetchWithCache("');
  content = content.replace(/fetch\(`\$\{API_BASE_URL\}"/g, 'fetch("');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed back', file);
  }
});
