const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

code = code.replace(
  '{accessData.plan === "none" && !accessData.trialStart\n                    ? "Acceso Restringido"\n                    : "Gracias por probar Flux Music."}',
  '{accessData.plan === "none" && !accessData.trialStart\n                    ? "Acceso Restringido"\n                    : accessData.plan !== "none" && accessData.plan !== "free"\n                    ? "Suscripción Finalizada"\n                    : "Gracias por probar Flux Music."}'
);

code = code.replace(
  '{accessData.plan === "none" && !accessData.trialStart\n                    ? "Para garantizar máxima estabilidad y baja latencia, controlamos manualmente el aforo. Adquiere o solicita tu prueba."\n                    : "Tu prueba gratuita ya finalizó. Continúa escuchando sin anuncios por solo 5 €/mes."}',
  '{accessData.plan === "none" && !accessData.trialStart\n                    ? "Para garantizar máxima estabilidad y baja latencia, controlamos manualmente el aforo. Adquiere o solicita tu prueba."\n                    : accessData.plan !== "none" && accessData.plan !== "free"\n                    ? "Tu suscripción ya finalizó. Continúa escuchando sin anuncios por solo 5 €/mes."\n                    : "Tu prueba gratuita ya finalizó. Continúa escuchando sin anuncios por solo 5 €/mes."}'
);

code = code.replace(
  '{(accessData.plan === "free" || accessData.plan === "none") && accessData.trialStart ? (',
  '{((accessData.plan === "free" || accessData.plan === "none") && accessData.trialStart) || (accessData.plan !== "none" && accessData.plan !== "free") ? ('
);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log("Replaced individual strings");
