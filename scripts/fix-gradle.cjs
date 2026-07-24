const fs = require('fs');
const path = require('path');

const b64Path = path.join(__dirname, 'good-wrapper.b64');
const jarPath = path.join(process.cwd(), 'android', 'gradle', 'wrapper', 'gradle-wrapper.jar');
const dirPath = path.dirname(jarPath);

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

console.log('Restoring known good gradle-wrapper.jar from base64...');
const b64Data = fs.readFileSync(b64Path, 'utf8');
const buffer = Buffer.from(b64Data.replace(/\s+/g, ''), 'base64');

fs.writeFileSync(jarPath, buffer);
console.log('✅ gradle-wrapper.jar restored successfully.');
