const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const target = 'onClick={() => setShowSupportChoice(true)}';
const replacement = "onClick={() => window.dispatchEvent(new CustomEvent('open-support', { detail: { message: 'Hola.\\n\\nHe utilizado mi prueba gratuita de Flux Music y quiero activar la suscripción Premium de 5 €/mes.\\n\\nQuedo pendiente.' } }))}";
code = code.replace(target, replacement);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
