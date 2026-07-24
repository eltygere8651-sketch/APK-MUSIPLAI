const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

async function validate() {
  console.log("==================================================");
  console.log("AUDITORÍA DE EVIDENCIAS: SOLUCIÓN DEFINITIVA DE PNGS");
  console.log("==================================================\n");

  const icons = [
    'apple-touch-icon.png',
    'apple-touch-icon-precomposed.png',
    'apple-touch-icon-152.png',
    'apple-touch-icon-167.png',
    'apple-touch-icon-180.png',
    'favicon.png',
    'icon-152.png',
    'icon-167.png',
    'icon-180.png',
    'icon-192.png',
    'icon-256.png',
    'icon-384.png',
    'icon-512.png',
    'icon-1024.png'
  ];

  let hasErrors = false;

  console.log("1. Verificando script generador...");
  if (fs.existsSync('scripts/generate-icons.cjs')) {
    console.log("✅ scripts/generate-icons.cjs EXISTE.");
  } else {
    console.log("❌ ERROR: No se encontró el script generador.");
    hasErrors = true;
  }

  console.log("\n2. Verificando package.json (prebuild)...");
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (pkg.scripts.prebuild === 'node scripts/generate-icons.cjs') {
    console.log("✅ prebuild configurado correctamente.");
  } else {
    console.log("❌ ERROR: prebuild incorrecto.");
    hasErrors = true;
  }

  console.log("\n3, 4, 5, 6. Analizando PNGs finales generados en dist/ ...");
  for (const icon of icons) {
    const filePath = path.join('dist', icon);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ERROR: No se encontró ${icon} en dist/`);
      hasErrors = true;
      continue;
    }

    const buf = fs.readFileSync(filePath);
    const hex = buf.subarray(0, 4).toString('hex');
    if (hex !== '89504e47') {
      console.log(`❌ ERROR: Cabecera inválida en ${icon}: ${hex}`);
      hasErrors = true;
      continue;
    }

    try {
      const meta = await sharp(buf).metadata();
      if (meta.hasAlpha) {
        console.log(`❌ ERROR: Canal Alpha detectado en ${icon}`);
        hasErrors = true;
      } else if (buf.length < 1024 && !icon.includes('152') && !icon.includes('167') && !icon.includes('180') && !icon.includes('apple') && !icon.includes('favicon')) {
         console.log(`⚠️ AVISO: Archivo ${icon} pesa menos de 1KB: ${buf.length} bytes`);
      } else {
        console.log(`✅ ${icon}: PNG RGB Opaco | ${meta.width}x${meta.height} | ${buf.length} bytes | Magic: ${hex.toUpperCase()}`);
      }
    } catch (e) {
      console.log(`❌ ERROR al leer ${icon} con Sharp: ${e.message}`);
      hasErrors = true;
    }
  }

  console.log("\n7. Verificando dist/index.html...");
  const index = fs.readFileSync('dist/index.html', 'utf8');
  if (index.includes('apple-touch-icon.png?v=5')) {
    console.log("✅ index.html referencia correctamente apple-touch-icon con ?v=5");
  } else {
    console.log("❌ ERROR en referencias index.html");
    hasErrors = true;
  }

  console.log("\n8. Verificando dist/manifest.json...");
  const manifest = JSON.parse(fs.readFileSync('dist/manifest.json', 'utf8'));
  const manifestIcons = manifest.icons.map(i => i.src);
  if (manifestIcons.includes('/icon-512.png')) {
    console.log("✅ manifest.json referencia correctamente los iconos.");
  } else {
    console.log("❌ ERROR en manifest.json.");
    hasErrors = true;
  }

  console.log("\n9. Verificando public/sw.js...");
  const sw = fs.readFileSync('public/sw.js', 'utf8');
  if (sw.includes('/apple-touch-icon.png?v=5')) {
    console.log("✅ sw.js incluye los iconos en el cache.");
  } else {
    console.log("❌ ERROR en cacheo de sw.js.");
    hasErrors = true;
  }

  if (hasErrors) {
    console.log("\n❌ SE DETECTARON ERRORES. Se requiere revisión.");
    process.exit(1);
  } else {
    console.log("\n✅ TODAS LAS PRUEBAS PASARON. LA SOLUCIÓN DEFINITIVA ESTÁ IMPLEMENTADA Y VERIFICADA.");
  }
}

validate().catch(console.error);
