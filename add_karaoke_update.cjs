const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationsModal.tsx', 'utf8');

const newUpdate = `  {
    id: "update-v1.8.6",
    title: "✨ Actualización Flux v1.8.6 - Modo Karaoke ECO",
    category: "actualizacion",
    createdAt: new Date(),
    content: "• Nueva Experiencia Inmersiva: Se ha añadido el nuevo 'Modo Karaoke ECO' al reproductor. Disfruta de una vista de pantalla completa con animaciones suaves, letras dinámicas y soporte nativo para efectos de eco de micrófono en tiempo real.\\n• Arquitectura Desacoplada & ECO-Friendly: El karaoke funciona completamente aislado utilizando la Web Audio API del navegador de forma nativa sin consumir recursos de Firebase o servidores, garantizando un impacto cero en tu batería y rendimiento."
  },
`;

code = code.replace(
  'export const COMPILED_UPDATES: Announcement[] = [',
  'export const COMPILED_UPDATES: Announcement[] = [\n' + newUpdate
);

fs.writeFileSync('src/components/NotificationsModal.tsx', code);
console.log("Updated NotificationsModal.tsx with Karaoke Update");
