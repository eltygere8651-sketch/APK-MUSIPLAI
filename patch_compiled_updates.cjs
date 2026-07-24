const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationsModal.tsx', 'utf-8');

const targetCompiledUpdates = `// Compiled App Updates to ensure update history is always populated
export const COMPILED_UPDATES: Announcement[] = [
  {
    id: "update-v1.9.0",
    title: "✨ Gran Actualización Flux v1.9.0 - Karaoke Beta y Nueva Exploración",
    category: "actualizacion",
    createdAt: new Date(),
    content: "• Modo Karaoke Beta: Disfruta de la nueva integración del karaoke en modo beta, con letras dinámicas y vista a pantalla completa.\n• Explorador Reimaginado: Hemos rediseñado por completo el funcionamiento del explorador para que descubrir nueva música sea más rápido, inteligente y visual.\n• Rediseño de Pestañas: Hemos pulido y modernizado el diseño de las pestañas en toda la app (como la pestaña de Artistas) ofreciendo una navegación más fluida e intuitiva.\n• Estabilidad y Errores: Mejoras internas masivas de rendimiento (ECO), correcciones de múltiples errores de sincronización y mejor manejo de la radio infinita inteligente estilo Spotify."
  },
  {
    id: "update-v1.8.6",
    title: "✨ Actualización Flux v1.8.6 - Modo Karaoke ECO",
    category: "actualizacion",
    createdAt: new Date(),
    content: "• Nueva Experiencia Inmersiva: Se ha añadido el nuevo 'Modo Karaoke ECO' al reproductor. Disfruta de una vista de pantalla completa con animaciones suaves, letras dinámicas y soporte nativo para efectos de eco de micrófono en tiempo real.\n• Arquitectura Desacoplada & ECO-Friendly: El karaoke funciona completamente aislado utilizando la Web Audio API del navegador de forma nativa sin consumir recursos de Firebase o servidores, garantizando un impacto cero en tu batería y rendimiento."
  },
  {
    id: "update-v1.8.4",
    title: "✨ Actualización Flux v1.8.4 - Rediseño del Botón de Ajustes",
    category: "actualizacion",
    createdAt: new Date(),
    content: "• Ajustes Visibles y Llamativos: El botón de Configuración de Mezcla FLX ha sido rediseñado completamente. Ahora destaca con una estética vibrante y estructurada (color esmeralda con iluminación neón) que combina perfectamente con los acentos del reproductor principal, haciéndolo mucho más fácil de localizar y de usar."
  },
  {
    id: "update-v1.8.0",
    title: "✨ Actualización Flux v1.8.0 - Gran Remodelación de Diseño",
    category: "actualizacion",
    createdAt: new Date(),
    content: "• Interfaz Rediseñada: Disfruta de una barra de navegación más compacta y estilizada con acentos en colores neón y esquinas más suaves.\n• Efectos Visuales Mejorados: Sombras de neón dinámicas, reflejos en tarjetas de artistas, y botones rediseñados para una estética super-premium.\n• Reproductor Integrado: Mejoras visuales en el reproductor de música, con barras de progreso brillantes, control de volumen refinado y carátulas flotantes.\n• Modo Full-Screen App: Soporte para 'Add to Home Screen' (PWA) optimizado con iconos de alta resolución y colores base nativos en iOS y Android."
  },
  {
    id: "update-v1.7.0",
    title: "✨ Actualización Flux v1.7.0 - Perfil de Usuario y Mejoras de Audio",
    category: "actualizacion",
    createdAt: new Date(),
    content: "• Nuevo Perfil de Usuario: Visualiza tu información de cuenta, plan activo, estado de suscripción y tiempo restante directamente desde el menú principal.\n• Mejoras de Audio: Se ha pulido el sistema 'Zero-Gap' y los crossfades para una experiencia auditiva sin ningún corte, mejorando la mezcla continua."
  },
  {
    id: "update-v1.6.0",
    title: "✨ Actualización Flux v1.6.0 - Lanzamiento Oficial",
    category: "noticia",
    createdAt: new Date(),
    content: "• ¡Bienvenido a Flux Music! La plataforma definitiva de streaming musical y fitness centrada en diseño elitista, colores cósmicos e inmersión absoluta sin cortes.\n• Base de datos original musical añadida. Que disfrutes de esta nueva dimensión de sonido ininterrumpido.",
  }
];`;

const replacementCompiledUpdates = `// Compiled App Updates to ensure update history is always populated
export const COMPILED_UPDATES: Announcement[] = [
  {
    id: "update-v1.9.0",
    title: "✨ Gran Actualización Flux v1.9.0 - Karaoke Beta y Nueva Exploración",
    category: "actualizacion",
    createdAt: new Date("2024-07-15T00:00:00Z"),
    content: "• Modo Karaoke Beta: Disfruta de la nueva integración del karaoke en modo beta, con letras dinámicas y vista a pantalla completa.\n• Explorador Reimaginado: Hemos rediseñado por completo el funcionamiento del explorador para que descubrir nueva música sea más rápido, inteligente y visual.\n• Rediseño de Pestañas: Hemos pulido y modernizado el diseño de las pestañas en toda la app (como la pestaña de Artistas) ofreciendo una navegación más fluida e intuitiva.\n• Estabilidad y Errores: Mejoras internas masivas de rendimiento (ECO), correcciones de múltiples errores de sincronización y mejor manejo de la radio infinita inteligente estilo Spotify."
  },
  {
    id: "update-v1.8.6",
    title: "✨ Actualización Flux v1.8.6 - Modo Karaoke ECO",
    category: "actualizacion",
    createdAt: new Date("2024-07-14T00:00:00Z"),
    content: "• Nueva Experiencia Inmersiva: Se ha añadido el nuevo 'Modo Karaoke ECO' al reproductor. Disfruta de una vista de pantalla completa con animaciones suaves, letras dinámicas y soporte nativo para efectos de eco de micrófono en tiempo real.\n• Arquitectura Desacoplada & ECO-Friendly: El karaoke funciona completamente aislado utilizando la Web Audio API del navegador de forma nativa sin consumir recursos de Firebase o servidores, garantizando un impacto cero en tu batería y rendimiento."
  },
  {
    id: "update-v1.8.4",
    title: "✨ Actualización Flux v1.8.4 - Rediseño del Botón de Ajustes",
    category: "actualizacion",
    createdAt: new Date("2024-07-13T00:00:00Z"),
    content: "• Ajustes Visibles y Llamativos: El botón de Configuración de Mezcla FLX ha sido rediseñado completamente. Ahora destaca con una estética vibrante y estructurada (color esmeralda con iluminación neón) que combina perfectamente con los acentos del reproductor principal, haciéndolo mucho más fácil de localizar y de usar."
  },
  {
    id: "update-v1.8.0",
    title: "✨ Actualización Flux v1.8.0 - Gran Remodelación de Diseño",
    category: "actualizacion",
    createdAt: new Date("2024-07-10T00:00:00Z"),
    content: "• Interfaz Rediseñada: Disfruta de una barra de navegación más compacta y estilizada con acentos en colores neón y esquinas más suaves.\n• Efectos Visuales Mejorados: Sombras de neón dinámicas, reflejos en tarjetas de artistas, y botones rediseñados para una estética super-premium.\n• Reproductor Integrado: Mejoras visuales en el reproductor de música, con barras de progreso brillantes, control de volumen refinado y carátulas flotantes.\n• Modo Full-Screen App: Soporte para 'Add to Home Screen' (PWA) optimizado con iconos de alta resolución y colores base nativos en iOS y Android."
  },
  {
    id: "update-v1.7.0",
    title: "✨ Actualización Flux v1.7.0 - Perfil de Usuario y Mejoras de Audio",
    category: "actualizacion",
    createdAt: new Date("2024-07-05T00:00:00Z"),
    content: "• Nuevo Perfil de Usuario: Visualiza tu información de cuenta, plan activo, estado de suscripción y tiempo restante directamente desde el menú principal.\n• Mejoras de Audio: Se ha pulido el sistema 'Zero-Gap' y los crossfades para una experiencia auditiva sin ningún corte, mejorando la mezcla continua."
  },
  {
    id: "update-v1.6.0",
    title: "✨ Actualización Flux v1.6.0 - Lanzamiento Oficial",
    category: "noticia",
    createdAt: new Date("2024-07-01T00:00:00Z"),
    content: "• ¡Bienvenido a Flux Music! La plataforma definitiva de streaming musical y fitness centrada en diseño elitista, colores cósmicos e inmersión absoluta sin cortes.\n• Base de datos original musical añadida. Que disfrutes de esta nueva dimensión de sonido ininterrumpido.",
  }
];`;

code = code.replace(targetCompiledUpdates, replacementCompiledUpdates);
fs.writeFileSync('src/components/NotificationsModal.tsx', code);
console.log('Fixed COMPILED_UPDATES');
