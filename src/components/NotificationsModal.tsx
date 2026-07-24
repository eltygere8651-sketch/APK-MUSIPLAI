import React, { useState, useEffect } from "react";
import { 
  X, 
  Bell, 
  AlertTriangle, 
  Info, 
  Sparkles, 
  Check, 
  Megaphone, 
  Clock, 
  Server,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, query, orderBy, limit, doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Incrementa este número cada vez que agregues una nueva actualización a COMPILED_UPDATES.
// Esto controla el punto rojo de notificaciones de forma global y eficiente.
import { APP_UPDATES_VERSION } from "../config/appVersion";

// Compiled App Updates to ensure update history is always populated
export const COMPILED_UPDATES: Announcement[] = [
  {
    id: "update-v1.9.0",
    title: "✨ Gran Actualización Flux v1.9.0 - Karaoke Beta y Nueva Exploración",
    category: "actualizacion",
    createdAt: new Date("2026-07-14T23:54:39.691Z"),
    content: "• Modo Karaoke Beta: Disfruta de la nueva integración del karaoke en modo beta, con letras dinámicas y vista a pantalla completa.\n• Explorador Reimaginado: Hemos rediseñado por completo el funcionamiento del explorador para que descubrir nueva música sea más rápido, inteligente y visual.\n• Rediseño de Pestañas: Hemos pulido y modernizado el diseño de las pestañas en toda la app (como la pestaña de Artistas) ofreciendo una navegación más fluida e intuitiva.\n• Estabilidad y Errores: Mejoras internas masivas de rendimiento (ECO), correcciones de múltiples errores de sincronización y mejor manejo de la radio infinita inteligente estilo Spotify."
  },
  {
    id: "update-v1.8.6",
    title: "✨ Actualización Flux v1.8.6 - Modo Karaoke ECO",
    category: "actualizacion",
    createdAt: new Date("2026-07-13T23:54:39.692Z"),
    content: "• Nueva Experiencia Inmersiva: Se ha añadido el nuevo 'Modo Karaoke ECO' al reproductor. Disfruta de una vista de pantalla completa con animaciones suaves, letras dinámicas y soporte nativo para efectos de eco de micrófono en tiempo real.\n• Arquitectura Desacoplada & ECO-Friendly: El karaoke funciona completamente aislado utilizando la Web Audio API del navegador de forma nativa sin consumir recursos de Firebase o servidores, garantizando un impacto cero en tu batería y rendimiento."
  },

  {
    id: "update-v1.8.4",
    title: "✨ Actualización Flux v1.8.4 - Rediseño del Botón de Ajustes",
    category: "actualizacion",
    createdAt: new Date("2026-07-12T23:54:39.692Z"),
    content: "• Ajustes Visibles y Llamativos: El botón de Configuración de Mezcla FLX ha sido rediseñado completamente. Ahora destaca con una estética vibrante y estructurada (color esmeralda con iluminación neón) que combina perfectamente con los acentos del reproductor principal, haciéndolo mucho más fácil de localizar y de usar."
  },

  {
    id: "update-v1.8.3",
    title: "✨ Actualización Flux v1.8.3 - Reparación Profunda: Algoritmo de Mezcla FLX y Descubrimiento Infinito",
    category: "actualizacion",
    createdAt: new Date("2026-07-11T23:54:39.692Z"),
    content: "• Solución del Algoritmo de Novedades: Reparado el fallo crítico en la sección 'Ajuste de Mezcla FLX' que causaba que la radio reprodujera las mismas 4 canciones repetidas o saltara canciones rotas cuando se aumentaba la barra de 'Descubrimiento nuevo' a más del 50%.\n• Descubrimiento Infinito Real: Ahora, cuando ajustas tu mezcla para priorizar el descubrimiento, el algoritmo de Flux Radio no se limita a una base local pequeña, sino que utiliza una inteligencia de búsqueda masiva hacia toda la red para ofrecer una cola de reproducción verdaderamente infinita, sin pistas rotas ni bucles repetitivos.\n• Integridad del Ecosistema: Los ajustes fueron inyectados quirúrgicamente solo en el motor de descubrimiento DJ, asegurando que ninguna otra funcionalidad de tu radio o tus demás controles se vea afectada. Las listas de la comunidad, búsqueda, favoritos y tus preferencias actuales siguen funcionando perfectamente."
  },

  {
    id: "update-v1.8.2",
    title: "✨ Actualización Flux v1.8.2 - Nueva Radio, Comunidad y Persistencia",
    category: "actualizacion",
    createdAt: new Date("2026-07-10T23:54:39.692Z"),
    content: "• Rebrand y Rediseño de Radio: Nueva estética inmersiva en la pestaña de radio eliminando etiquetas técnicas excesivas.\n• Experiencia de Radio Directa: Eliminamos las alocuciones forzadas de Sofía para priorizar la reproducción musical.\n• Mix de Sofía Libre: 'La mezcla de Sofia' ahora está disponible para todos los usuarios.\n• Memoria Inteligente: La app ahora guarda tu último género y canción escuchada en la radio para que retomes justo donde lo dejaste.\n• Visibilidad en Comunidad: Ahora los nombres de los creadores de playlists son claramente visibles incluso en pantallas de teléfonos móviles.\n• Correcciones generales: Mejoras de estabilidad, transiciones y rendimiento en toda la plataforma."
  },

  {
    id: "update-v1.8.1",
    title: "✨ Actualización Flux v1.8.1 - Nueva Radio Flux, Retorno de Sofia y Estado Persistente",
    category: "actualizacion",
    createdAt: new Date("2026-07-09T23:54:39.692Z"),
    content: "• Rebrand de la Radio: Mejoramos la estética del reproductor de la radio eliminando la etiqueta de 'FLUX AI ENGINE' para una vista más inmersiva e limpia.\n• Alocuciones Simplificadas: Removidas las interrupciones forzadas y alocuciones obligatorias de bienvenida para dar paso a una experiencia musical más directa.\n• La mezcla de Sofia para todos: El exclusivo mix de Sofia se ha habilitado para que todos los usuarios puedan seleccionarlo.\n• Estado de Radio Persistente: Ahora la aplicación recuerda automáticamente la última canción y el último género que estabas escuchando, retomándolo inmediatamente cuando vuelvas.\n• Correcciones Menores y UI: Numerosas mejoras de estabilidad, manejo de colas y consistencia visual en la pestaña de radio."
  },

  {
    id: "update-v1.8.0",
    title: "✨ Actualización Flux v1.8.0 - Sofía de Flux Radio y Frecuencia DJ",
    category: "actualizacion",
    createdAt: new Date("2026-07-08T23:54:39.692Z"),
    content: "• Sofía de Flux Radio: Renovada totalmente la voz y el estilo de nuestra DJ Inteligente. Sofía estrena identidad y habla como locutora real de radio FM.\n• Repertorio Ampliado: Añadidos más de 15 guiones de actualidad, chistes y comentarios frescos para evitar repeticiones.\n• Frecuencia DJ Protegida: Optimizamos la intervención de la DJ para que ocurra de forma natural solo después de al menos 15 canciones, evitando saturar tu reproducción en producción."
  },
  {
    id: "update-v1.7.0",
    title: "✨ Actualización Flux v1.7.0 - Mejoras en el Explorador y Novedades",
    category: "actualizacion",
    createdAt: new Date("2026-07-07T23:54:39.692Z"),
    content: "• Gestión Rápida de Listas: Ahora puedes reordenar listas simplemente arrastrando con el ratón, haciendo la organización mucho más fluida.\n• Edición en Vivo: Renombra categorías existentes fácilmente.\n• Limpieza Dinámica: Se pueden ocultar o eliminar listas de cualquier categoría para mantener el explorador siempre con música fresca.\n• Notificaciones Integradas: El sistema ahora cuenta con un mecanismo para resaltar y notificar de manera global los últimos lanzamientos musicales."
  },
  {
    id: "update-v1.6.6",
    title: "✨ Actualización Flux v1.6.6 - Reanudación Inteligente",
    category: "actualizacion",
    createdAt: new Date("2026-07-06T23:54:39.692Z"),
    content: "• Solución Definitiva y Real: Se ha implementado un sistema inteligente real. Al cerrar la app, guardamos tu minuto exacto. Al volver a abrirla, la canción continuará exáctamente donde la dejaste. Pero si cambias de canción con 'Siguiente' o haciendo click en tu biblioteca, la pista nueva siempre empezará a reproducirse limpiamente desde el segundo 00:00.\n• Ajuste sin engaños: Hemos reprogramado el bloqueador de micro-eventos que sobreescribía la reanudación desde 0, asegurando una fluidez nativa y respetando tu batería sin sacrificar la lógica de reinicio."
  },
  {
    id: "update-v1.6.5",
    title: "✨ Actualización Flux v1.6.5 - Autonomía Total de Reproducción de Cero",
    category: "actualizacion",
    createdAt: new Date("2026-07-05T23:54:39.692Z"),
    content: "• Reparación Definitiva Confirmada: Hemos ajustado la API interna del reproductor para forzar una política estricta. Si pulsas sobre cualquir nueva canción o cambias a la siguiente pista, el contador arranca SIEMPRE de cero. Ya no hereda el tiempo previo por error del sistema nativo.\n• Excepción de Reanudación Intacta: Esta lógica rigurosa no afecta a la función de reanudación. Si cierras la aplicación, al volver el reproductor seguirá reconociendo exactamente el minuto donde dejaste tu canción actual, comportándose inteligentemente según la situación."
  },
  {
    id: "update-v1.6.4",
    title: "✨ Actualización Flux v1.6.4 - Sincronía del Player Original Restaurada",
    category: "actualizacion",
    createdAt: new Date("2026-07-04T23:54:39.692Z"),
    content: "• Reparación Real del Reproductor: Hemos solucionado definitivamente el error masivo introducido en los ajustes de reanudación recientes. Cuando estabas en el segundo 40 de una canción y parabas a la siguiente, esa nueva canción saltaba automáticamente al minuto 40 en lugar de empezar por el principio.\n• Lógica Restaurada sin Impacto: Las nuevas canciones vuelven a iniciar limpiamente en 00:00 como deberia ser, sin sacrificar la reanudación del historial al arrancar la app ni afectar el consumo del uso de recursos eco-friendly."
  },
  {
    id: "update-v1.6.3",
    title: "✨ Actualización Flux v1.6.3 - Reloj de Reproducción Sincronizado",
    category: "actualizacion",
    createdAt: new Date("2026-07-03T23:54:39.692Z"),
    content: "• Sincronización Automática: Hemos corregido el desajuste que mantenía congelado el temporizador al cambiar de pista. Ahora, sin importar si pulsas siguiente, seleccionas a mano una canción, o buscas algo nuevo, el tiempo arranca en cero correctamente.\n• Modos Eco-Mantenidos: Esta fluidez fue lograda modificando el ciclo interno sin aumentar un milivatio extra del sistema. Reproduce al máximo y gasta al mínimo."
  },
  {
    id: "update-v1.6.2",
    title: "✨ Actualización Flux v1.6.2 - Corrección de Reanudación",
    category: "actualizacion",
    createdAt: new Date("2026-07-02T23:54:39.692Z"),
    content: "• Reanudación Instantánea: Hemos solucionado el problema que causaba que la música se quedara congelada o atascada un par de segundos al volver a abrir o recargar la aplicación e intentar continuar escuchando. Ahora la reproducción se reanuda desde el punto donde la dejaste de forma fluida, directa y sin tirones, manteniendo el rendimiento eco de la batería."
  },
  {
    id: "update-v1.6.1",
    title: "✨ Actualización Flux v1.6.1 - Fix Bluetooth iOS (Brave)",
    category: "actualizacion",
    createdAt: new Date("2026-07-01T23:54:39.692Z"),
    content: "• Solucionado un error crítico (Crash) en iOS al usar el navegador Brave conectado al coche vía Bluetooth. Ahora, al presionar 'Anterior' desde el volante, la canción simplemente se reiniciará (si lleva más de 3 segundos), previniendo que el reproductor interno se bloquee mediante cargas excesivas de red."
  },
  {
    id: "update-v1.6.0",
    title: "✨ Actualización Flux v1.6.0 - Eco-Watchdog y Solución a Cortes",
    category: "actualizacion",
    createdAt: new Date("2026-06-30T23:54:39.692Z"),
    content: "• Sistema Eco-Friendly: Hemos optimizado el detector interno de fallos (Watchdog) para consumir un ~0% de batería y CPU.\n• Reproducción Ininterrumpida: En sesiones largas (1+ horas), el audio ya no se detendrá bruscamente si el navegador lo congela. El sistema lo reanuda automáticamente manteniendo la temperatura de tu móvil siempre baja."
  },
  {
    id: "update-v1.5.9",
    title: "✨ Actualización Flux v1.5.9 - Filtro Estricto de Biblioteca Personal",
    category: "actualizacion",
    createdAt: new Date("2026-06-29T23:54:39.692Z"),
    content: "• Exclusividad de Playlists: Al añadir una canción a una playlist existente desde el modal de creación, ahora verás un filtro estricto que muestra exclusivamente tus propias playlists personales. Se solucionó el problema donde se mezclaban listas de la comunidad, garantizando una administración privada de tu biblioteca musical."
  },
  {
    id: "update-v1.5.8",
    title: "✨ Actualización Flux v1.5.8 - Sincronización Playlists y Mejoras Visuales",
    category: "actualizacion",
    createdAt: new Date("2026-06-28T23:54:39.692Z"),
    content: "• Sincronización Global: Las canciones añadidas a tus listas ahora se reflejan en tiempo real en todos los módulos de la interfaz, solucionando la discrepancia donde no se veían de inmediato.\n• Interfaz Móvil y Arrastre: Se perfeccionó y depuró la vista móvil ocultando controles inactivos como el botón de arrastre, garantizando un ecosistema táctil limpio sin romper las funciones de movimiento de listas."
  },
  {
    id: "update-v1.5.7",
    title: "✨ Actualización Flux v1.5.7 - Bloqueo de Pantalla Premium en Brave (iOS/Android)",
    category: "actualizacion",
    createdAt: new Date("2026-06-27T23:54:39.692Z"),
    content: "• Compatibilidad Extrema Móvil: Hemos logrado que la app siga reproduciendo la música con total fluidez y el volumen reactivado aún con la pantalla bloqueada desde navegadores restrictivos como Brave en iOS (iPhone) y Android.\n• Consumo Mínimo de Batería al 100%: Esta gran optimización interna se ha llevado a cabo de manera excepcionalmente eficiente manteniendo un consumo inigualable para que tu batería permanezca cuidada y no se sobrecargue."
  },
  {
    id: "update-v1.5.6",
    title: "✨ Actualización Flux v1.5.6 - Correcciones de Seguridad y Estabilidad",
    category: "actualizacion",
    createdAt: new Date("2026-06-15T14:30:00Z"),
    content: "• Estabilidad Continua: Hemos implementado mejoras internas en nuestra infraestructura de red para prevenir interrupciones inesperadas. Este ajuste optimiza la recepción de datos para asegurar que la reproducción se mantenga siempre fluida bajo cualquier circunstancia.\n• Despliegue Silencioso y Eficiente: Estas correcciones y optimizaciones de seguridad se ejecutan íntegramente en los servidores en la nube de Flux, garantizando un 0% de impacto en el consumo de batería o rendimiento de tu dispositivo."
  },
  {
    id: "update-v1.5.5",
    title: "✨ Actualización Flux v1.5.5 - Optimización de Cuotas y Salto de Silencios Inteligente",
    category: "actualizacion",
    createdAt: new Date("2026-06-15T12:00:00Z"),
    content: "• Salto de Silencios Inteligente Integrado: Se implementó de manera transparente la tecnología colaborativa SponsorBlock, que detecta silencios absolutos, videoclips intermedios o ruido de fondo, asegurando que la canción conecte fluidamente al terminar.\n• Reconfiguración de Lectura Global Gratuita: Optimizada la sincronización de Novedades y la base global mediante lectura limitada (Top 50 Novedades), logrando que el consumo de carga sea 10 veces más económico y eficiente, protegiendo totalmente la viabilidad gratuita sin renunciar a tu velocidad de respuesta."
  },
  {
    id: "update-v1.5.4",
    title: "✨ Actualización Flux v1.5.4 - Mejoras UI y Seguridad Multidispositivo",
    category: "actualizacion",
    createdAt: new Date("2026-06-26T23:54:39.692Z"),
    content: "• Prevención de Multiconexión: Implementado un sistema estricto de control de reproducciones simultáneas. Si tu cuenta cambia de dispositivo, se pausará automáticamente para garantizar el protocolo de cuenta única.\n• Correcciones de Botones: Ajuste premium al botón de cierre móvil y centrado absoluto del botón minimizar visor en Android.\n• Reparaciones de Telegram y Bluetooth: Refuerzo integral al sistema de MediaSession para coches y alertas push conectadas al asistente directo de Telegram administrativo."
  },
  {
    id: "update-v1.5.3",
    title: "✨ Actualización Flux v1.5.3 - Panel Admin & Telegram Inteligente",
    category: "actualizacion",
    createdAt: new Date("2026-06-13T16:30:00Z"),
    content: "• Notificaciones Push vía Telegram: Ahora el administrador recibe alertas inmediatas a través de Telegram cuando hay un nuevo registro de prueba de 7 días. ¡Cero fricción para gestionar aprobaciones!\n• Panel Admin Optimizado: Las nuevas peticiones de prueba aparecen ordenadas automáticamente al principio de la lista, ahorrándote la necesidad de buscar. Todo más fluido e intuitivo."
  },
  {
    id: "update-v1.5.2",
    title: "✨ Actualización Flux v1.5.2 - Recuperación y Control Bluetooth",
    category: "actualizacion",
    createdAt: new Date("2026-06-13T09:20:00Z"),
    content: "• Sistema de Recuperación de Contraseña: Se integró una recuperación de acceso de forma premium. Si has olvidado tu contraseña, usa el botón de recuperación fluido (¡No olvides revisar tu carpeta de correo no deseado/spam!).\n• Control Bluetooth Extremo en Coches: Mejorada radicalmente la respuesta inmediata al cambiar de pista desde el vehículo, logrando mayor fluidez sin incrementar ni un 1% el consumo de batería del móvil."
  },
  {
    id: "update-v1.5.1",
    title: "✨ Actualización Flux v1.5.1 - Optimización Batería, Bluetooth y Mix Descubrimiento",
    category: "actualizacion",
    createdAt: new Date("2026-06-12T03:30:00Z"),
    content: "• Mix Descubrimiento Mejorado: El algoritmo ahora analiza hasta 6 de tus artistas más escuchados simultáneamente, ofreciendo listas personalizadas mucho más certeras y afines a tus gustos sin depender de uno solo.\n• Ahorro de Datos y Batería: Optimizado de forma revolucionaria el consumo de red en segundo plano reduciendo al extremo la calidad de carga, evitando cortes si la conexión móvil falla.\n• Control Bluetooth en Coches: Reconstruido el sistema Media Session, asegurando que los comandos físicos (volante y coche) para Adelantar y Volver Atrás canciones funcionen siempre impecablemente."
  },
  {
    id: "update-v1.5.0",
    title: "✨ Actualización Flux v1.5.0 - Nuevas Playlists y Playlist 'Alborán/De Luna' Activadas",
    category: "actualizacion",
    createdAt: new Date("2026-06-11T16:00:00Z"),
    content: "• ¡Soporte Unificado de Playlists Resolucionado! Corregido el motor híbrido de carga que impedía ver ciertas playlists de YouTube o YouTube Music.\n• Playlist Añadida y Corregida: Integrada perfectamente la lista 'Pablo Alborán and Álvaro De Luna' (PLiomXdAuOA97jjwoT8YXFpbMF4ixQ22n4) con extracción automática de tracks, portadas y metadatos.\n• Solución a fallos de carga en listas vacías o restringidas: La app intentará automáticamente métodos secundarios silenciosos para que no pierdas tu música favorita."
  },
  {
    id: "update-v1.4.6",
    title: "✨ Actualización Flux v1.4.6 - Últimos Ajustes del Sistema",
    category: "actualizacion",
    createdAt: new Date("2026-06-08T23:45:00Z"),
    content: "• Ajustados finalmente los indicadores de alerta en la campana de notificaciones. Ya se marcan y sincronizan todas las actualizaciones directamente con tu sesión sin problemas.\n• Revisión global para garantizar el Historial Completo de actualizaciones para todos los usuarios."
  },
  {
    id: "update-v1.4.5",
    title: "✨ Actualización Flux v1.4.5 - Notificaciones e Historial",
    category: "actualizacion",
    createdAt: new Date("2026-06-08T23:35:00Z"),
    content: "• Reparado el indicador de alertas de Notificaciones (Campanita) para que detecte correctamente las actualizaciones sin leer, integrando todo el sistema global.\n• El historial ahora muestra la totalidad de las actualizaciones de forma continua."
  },
  {
    id: "update-v1.4.4",
    title: "✨ Actualización Flux v1.4.4 - Motor y Favoritos",
    category: "actualizacion",
    createdAt: new Date("2026-06-08T22:15:00Z"),
    content: "• Solución contundente al fallo de los Me Gusta (Favoritos) sin afectar visuales.\n• Corregidos los errores que causaban que la pista saltara temporalmente de estado al guardar un track en listas, manteniendo el flujo sin problemas.\n• Optimización de estado interno y estabilización de variables críticas (playingPlaylist, userPlaylists)."
  },
  {
    id: "update-v1.4.3",
    title: "⚡ Actualización Flux v1.4.3 - Estabilidad",
    category: "actualizacion",
    createdAt: new Date("2026-06-08T19:45:00Z"),
    content: "• Pulido del Ecosistema de control y re-renderizado React.\n• Evita el refresco no deseado de playlists enteras durante interacciones aisladas en la app."
  },
  {
    id: "update-v1.4.2",
    title: "✨ Actualización Flux v1.4.2",
    category: "actualizacion",
    createdAt: new Date("2026-06-08T13:25:00Z"),
    content: "• Ajustes de visibilidad de perfil personal: Hemos arreglado un comportamiento donde los administradores y ciertos perfiles no mostraban su nombre de perfil correctamente al crear playlists personalizadas. A partir de ahora el tag exclusivo #fluxmusicoficial sólo aplicará cuando se especifique así."
  },
  {
    id: "update-v1.4.1",
    title: "✨ Actualización Flux v1.4.1",
    category: "actualizacion",
    createdAt: new Date("2026-06-08T13:16:00Z"),
    content: "• Solución óptima aplicada al funcionamiento de Playlists: Restaurada y optimizada la visibilidad de tu biblioteca y canciones guardadas.\n• Corrección de autoría en canales de contenido: Etiquetas de 'Socio Premium' y validación especial '#fluxmusicoficial' para contenido curado por administradores.\n• Notificaciones en tiempo real integradas optimizadas sin afectar módulos dependientes."
  },
  {
    id: "update-v1.4.0",
    title: "✨ Actualización Flux v1.4.0",
    category: "actualizacion",
    createdAt: new Date("2026-06-08T11:00:00Z"),
    content: "• Rediseño premium de la cabecera e íconos a blanco puro con neón.\n• PDF Comercial optimizado: Detalles del ecosistema Flux, miles de playlists actualizadas y potente buscador global.\n• Experiencia de pantalla invertida con prevención automática de bloqueo del dispositivo.\n• Valores fundamentales del ecosistema destacados y depurados en el PDF."
  },
  {
    id: "update-v1.3.1",
    title: "⚡ Actualización Flux v1.3.1",
    category: "actualizacion",
    createdAt: new Date("2026-06-08T01:15:00Z"),
    content: "• ¡Hemos integrado de forma unificada el Centro de Notificaciones y Avisos Directos! Se han eliminado las ventanas emergentes (popups) molestas. Ahora el historial es continuo en tiempo real en español.",
  },
  {
    id: "update-v1.3.0",
    title: "✨ Actualización Flux v1.3.0 - Modo Eco y Lock Screen",
    category: "actualizacion",
    createdAt: new Date("2026-06-07T18:00:00Z"),
    content: "• Implementación del Sistema de Media Session: Ahora puedes controlar la música desde la pantalla de bloqueo (Lock Screen) de tu dispositivo móvil y auriculares.\n• Nuevo 'Modo Eco': Optimización extrema del perfil de rendimiento. Reduce el consumo de batería y datos ocultando visualizaciones complejas cuando buscas ahorro de energía.\n• Prevención de saltos de estado y sincronización mejorada del reproductor.",
  },
  {
    id: "update-v1.2.5",
    title: "✨ Actualización Flux v1.2.5 - Playlists del Ecosistema",
    category: "actualizacion",
    createdAt: new Date("2026-06-06T15:30:00Z"),
    content: "• Integración de Playlists Públicas de la Comunidad: Ahora puedes compartir tus playlists con todo el mundo y explorar las creaciones de otros usuarios.\n• Funcionalidad de 'Añadir a mi Biblioteca' para copiar canales públicos a tu colección personal.\n• Nuevo contador de listados (veces listado) en las playlists de la comunidad.",
  },
  {
    id: "update-v1.2.0",
    title: "✨ Actualización Flux v1.2.0 - Autenticación y Cuentas",
    category: "actualizacion",
    createdAt: new Date("2026-06-05T12:00:00Z"),
    content: "• Perfiles Integrados: Se añadió soporte completo de inicio de sesión de perfiles para sincronizar tu progreso y música guardada en la nube.\n• Playlist inteligente 'Favoritos' anclada en la parte superior para fácil acceso y guardado rápido (Corazón activo).\n• Gestión de cuentas de Administrador centralizada y validación estricta de códigos de seguridad.",
  },
  {
    id: "update-v1.1.0",
    title: "⚡ Actualización Flux v1.1.0 - El Nuevo Reproductor",
    category: "actualizacion",
    createdAt: new Date("2026-06-03T10:00:00Z"),
    content: "• Nuevo motor de reproducción ReactPlayer enlazado de forma oculta para lograr reproducción continua sin interrupciones.\n• Transiciones de desvanecimiento automáticas. Eliminación del iframe nativo en favor de un sistema de audio directo.\n• Panel lateral desplegable, búsqueda inteligente por canal, artistas o tracks de Base de Datos Base.",
  },
  {
    id: "update-v1.0.0",
    title: "🚀 Lanzamiento Oficial Flux Music v1.0",
    category: "noticia",
    createdAt: new Date("2026-06-01T08:00:00Z"),
    content: "• ¡Bienvenido a Flux Music! La plataforma definitiva de streaming musical y fitness centrada en diseño elitista, colores cósmicos e inmersión absoluta sin cortes.\n• Base de datos original musical añadida. Que disfrutes de esta nueva dimensión de sonido ininterrumpido.",
  }
];

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: "mantenimiento" | "noticia" | "actualizacion" | "urgente";
  createdAt: any;
  active?: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, isAdmin }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(20));
    
    import("firebase/firestore").then(({ getDocs }) => {
      getDocs(q).then((querySnap) => {
        const firebaseList: Announcement[] = [];
        querySnap.forEach((docSnap) => {
          const data = docSnap.data();
          const ca = data.createdAt;
          const parsedDate = ca ? (typeof ca.toDate === 'function' ? ca.toDate() : new Date(ca)) : new Date();
          firebaseList.push({
            id: docSnap.id,
            title: data.title || "Aviso",
            content: data.content || "",
            category: data.category || "noticia",
            createdAt: parsedDate
          });
        });

        // Merge realtime database announcements with compiled app updates
        const combined = [...firebaseList, ...COMPILED_UPDATES];
        combined.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
          const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        setAnnouncements(combined);
        if (isOpen && firebaseList.length > 0) {
          const newestDbId = firebaseList[0].id;
          const prevSeenAnn = localStorage.getItem("flux_last_seen_announcement_id");
          if (prevSeenAnn !== newestDbId) {
            localStorage.setItem("flux_last_seen_announcement_id", newestDbId);
            window.dispatchEvent(new Event("notifications-read"));
          }
        }
        setLoading(false);
      }).catch((err) => {
        console.error("Error al cargar comunicados:", err);
        setAnnouncements(COMPILED_UPDATES);
        setLoading(false);
      });
    });

  }, [isOpen]);

  // Handle marking as read whenever the modal is open and we have announcements
  useEffect(() => {
    if (isOpen) {
      const currentVersionStr = APP_UPDATES_VERSION.toString();
      const seenVersion = localStorage.getItem("flux_updates_version_seen");
      const installedVersion = localStorage.getItem("flux_app_installed_version");
      
      let changed = false;
      
      if (seenVersion !== currentVersionStr) {
        localStorage.setItem("flux_updates_version_seen", currentVersionStr);
        changed = true;
      }
      
      if (installedVersion !== currentVersionStr) {
        localStorage.setItem("flux_app_installed_version", currentVersionStr);
      }
      
      if (changed) {
        window.dispatchEvent(new Event("notifications-read"));
      }
    }
  }, [isOpen]);

  const handleDeleteAnnouncement = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que deseas eliminar este anuncio permanentemente?")) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
      window.dispatchEvent(new Event("notifications-read"));
    } catch (err) {
      alert("No se pudo eliminar el anuncio: " + err);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "urgente":
        return "bg-rose-500/10 text-rose-400 border-rose-500/25";
      case "mantenimiento":
        return "bg-amber-500/10 text-amber-400 border-amber-500/25";
      case "actualizacion":
        return "bg-[#1ED760]/10 text-[#1ED760] border-[#1ED760]/20";
      default:
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/25";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "urgente":
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case "mantenimiento":
        return <Server className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case "actualizacion":
        return <Sparkles className="w-3.5 h-3.5 text-[#1ED760] shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <div className="absolute inset-0 z-0" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          className="relative w-full max-w-sm bg-[#0a0a0c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col z-10 max-h-[85vh]"
        >
          <div className="absolute top-0 inset-x-0 h-[2px] bg-[#1ED760]" />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 active:bg-white/10 text-slate-400 active:text-white rounded-full transition-all cursor-pointer z-20"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-4 border-b border-white/5 bg-gradient-to-b from-[#1ED760]/5 to-transparent text-left">
            <h2 className="text-white text-[15px] font-black tracking-tight flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#1ED760]" />
              <span>Historial y Novedades</span>
            </h2>
            <p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mt-1">
              Actualizaciones Generales de Flux
            </p>
          </div>

          <div className="p-3 overflow-y-auto premium-scrollbar flex-1 space-y-2.5 max-h-[50vh] text-left">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500 font-semibold animate-pulse">
                Sincronizando Firebase...
              </div>
            ) : announcements.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-semibold">
                Sin novedades recientes.
              </div>
            ) : (
              announcements.map((item) => {
                const isSelected = selectedNoticeId === item.id;
                const formattedTime = item.createdAt instanceof Date 
                  ? item.createdAt.toLocaleDateString("es-ES", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) 
                  : "";

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedNoticeId(isSelected ? null : item.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col ${
                      isSelected 
                        ? "bg-[#111114] border-[#1ED760]/30 shadow-lg" 
                        : "bg-white/[0.02] active:bg-white/[0.05] border-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {getCategoryIcon(item.category)}
                        <span className={`text-[8.5px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded border ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[8.5px] text-slate-500 font-bold whitespace-nowrap">
                          {formattedTime}
                        </span>
                        {isAdmin && !item.id.startsWith("update-") && (
                          <button
                            onClick={(e) => handleDeleteAnnouncement(item.id, e)}
                            className="text-slate-500 active:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="text-white text-[11px] font-bold tracking-tight leading-snug group-active:text-[#1ED760] transition-colors line-clamp-1 pr-6">
                      {item.title}
                    </h4>

                    {isSelected && (
                      <div className="text-[10px] leading-relaxed text-slate-300 font-medium mt-2 pt-2 border-t border-white/5 whitespace-pre-wrap">
                        {item.content}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

