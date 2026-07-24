const fs = require('fs');
const path = require('path');

try {
  const sharp = require('sharp');
  
  async function generate() {
    const svgPath = path.join(process.cwd(), 'public', 'icon-512.svg');
    const publicDir = path.join(process.cwd(), 'public');
    
    if (!fs.existsSync(svgPath)) {
      console.log('No SVG found, skipping icon generation');
      return;
    }
    
    const svg = fs.readFileSync(svgPath);
    console.log('Generando PNGs opacos desde SVG para evadir corrupción de Git...');
    
    // Configuración base para opacidad estricta (RGB, sin alpha, fondo negro)
    const render = (size) => {
      return sharp(svg)
        .resize(size, size)
        .flatten({ background: { r: 8, g: 8, b: 9 } }) // #080809 (theme_color) para el fondo si el SVG es transparente
        .removeAlpha()
        .png();
    };

    // Apple Touch Icons
    const appleSizes = [152, 167, 180];
    for (const size of appleSizes) {
      await render(size).toFile(path.join(publicDir, `apple-touch-icon-${size}.png`));
    }
    await render(180).toFile(path.join(publicDir, 'apple-touch-icon.png'));
    await render(180).toFile(path.join(publicDir, 'apple-touch-icon-precomposed.png'));
    
    // Iconos Web App standard
    const sizes = [152, 167, 180, 192, 256, 384, 512, 1024];
    for (const size of sizes) {
      await render(size).toFile(path.join(publicDir, `icon-${size}.png`));
    }
    
    // Favicon
    await render(192).toFile(path.join(publicDir, 'favicon.png'));
    
    console.log('✅ Todos los iconos han sido regenerados en public/ en formato RGB Opaco.');
  }
  
  generate().catch(console.error);
} catch(e) {
  console.log('Sharp no está instalado. Omitiendo generación de iconos.', e);
}
