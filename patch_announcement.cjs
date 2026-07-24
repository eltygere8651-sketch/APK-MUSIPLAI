const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationsModal.tsx', 'utf8');

const target = `export const COMPILED_UPDATES: Announcement[] = [`;
const replacement = `export const COMPILED_UPDATES: Announcement[] = [
  {
    id: "update-v1.9.0",
    title: "✨ Gran Actualización Flux v1.9.0 - Karaoke Beta y Nueva Exploración",
    category: "actualizacion",
    createdAt: new Date(),
    content: "• Modo Karaoke Beta: Disfruta de la nueva integración del karaoke en modo beta, con letras dinámicas y vista a pantalla completa.\\n• Explorador Reimaginado: Hemos rediseñado por completo el funcionamiento del explorador para que descubrir nueva música sea más rápido, inteligente y visual.\\n• Rediseño de Pestañas: Hemos pulido y modernizado el diseño de las pestañas en toda la app (como la pestaña de Artistas) ofreciendo una navegación más fluida e intuitiva.\\n• Estabilidad y Errores: Mejoras internas masivas de rendimiento (ECO), correcciones de múltiples errores de sincronización y mejor manejo de la radio infinita inteligente estilo Spotify."
  },`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/NotificationsModal.tsx', code);
