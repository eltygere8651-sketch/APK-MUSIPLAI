const fs = require('fs');
const path = require('path');

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

  // if the file contains fetch("/api or fetch(`/api etc
  if (content.match(/fetch\(\s*["'`]\/api/)) {
    // Add import if not present
    if (!content.includes('API_BASE_URL')) {
      // Find path to constants.ts
      const depth = file.split('/').length - 2;
      const prefix = depth === 0 ? './' : '../'.repeat(depth);
      content = `import { API_BASE_URL } from "${prefix}lib/constants";\n` + content;
    }

    // Replace fetch("/api/...") with fetch(`${API_BASE_URL}/api/...`)
    content = content.replace(/fetch\(\s*"/g, 'fetch(`${API_BASE_URL}"'); // this is tricky
    
    // Safer regex for all forms:
    // fetch("/api/...") -> fetch(`${API_BASE_URL}/api/...`)
    content = content.replace(/fetch\(\s*['"]\/api\/(.*?)['"](.*?)\)/g, 'fetch(`${API_BASE_URL}/api/$1`$2)');
    content = content.replace(/fetch\(\s*`\/api\/(.*?)`(.*?)\)/g, 'fetch(`${API_BASE_URL}/api/$1`$2)');
    
    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
    }
  }
});
