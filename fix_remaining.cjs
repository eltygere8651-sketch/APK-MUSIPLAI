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

  if (content.includes('"/api/') || content.includes('`/api/')) {
    if (!content.includes('API_BASE_URL')) {
      const depth = file.split('/').length - 2;
      const prefix = depth === 0 ? './' : '../'.repeat(depth);
      content = `import { API_BASE_URL } from "${prefix}lib/constants";\n` + content;
    }
    
    // Replace "/api/path" with `${API_BASE_URL}/api/path`
    content = content.replace(/"\/api\/(.*?)"/g, '`${API_BASE_URL}/api/$1`');
    // Replace `/api/path` with `${API_BASE_URL}/api/path`
    content = content.replace(/`\/api\/(.*?)`/g, '`${API_BASE_URL}/api/$1`');

    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
    }
  }
});
