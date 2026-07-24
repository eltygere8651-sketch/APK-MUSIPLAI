const sharp = require('sharp');
const fs = require('fs');

async function generateIcons() {
  const svgBuffer = fs.readFileSync('public/icon-512.svg');
  
  const sizes = [152, 167, 180, 192, 256, 384, 512, 1024];
  
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(`public/icon-${size}.png`);
    console.log(`Generated icon-${size}.png`);
  }
  
  // Apple specific
  fs.copyFileSync('public/icon-180.png', 'public/apple-touch-icon.png');
  fs.copyFileSync('public/icon-180.png', 'public/apple-touch-icon-precomposed.png');
  
  // Favicon
  fs.copyFileSync('public/icon-192.png', 'public/favicon.png'); // Favicon as PNG is often icon-192 or we can make a favicon.ico
  
  console.log("All icons generated successfully.");
}

generateIcons().catch(console.error);
