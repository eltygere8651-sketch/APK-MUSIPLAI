const fs = require('fs');
const sharp = require('sharp');
const crypto = require('crypto');

async function check() {
  const files = ['public/icon-512.png', 'public/apple-touch-icon.png', 'dist/icon-512.png', 'dist/apple-touch-icon.png'];
  
  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.log(`${file} does not exist`);
      continue;
    }
    
    const buf = fs.readFileSync(file);
    console.log(`\n--- ${file} ---`);
    console.log(`Size: ${buf.length} bytes`);
    
    // Check Magic Bytes for PNG: 89 50 4E 47 0D 0A 1A 0A
    const hexHeader = buf.subarray(0, 8).toString('hex');
    console.log(`Magic Bytes: ${hexHeader} (Expected: 89504e470d0a1a0a)`);
    console.log(`Is Valid PNG Magic: ${hexHeader === '89504e470d0a1a0a'}`);
    
    // Try to parse with sharp
    try {
      const meta = await sharp(buf).metadata();
      console.log(`Sharp Parse SUCCESS: format=${meta.format}, size=${meta.width}x${meta.height}, channels=${meta.channels}`);
    } catch (err) {
      console.log(`Sharp Parse FAILED: ${err.message}`);
    }
    
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    console.log(`SHA256: ${hash}`);
  }
}
check();
