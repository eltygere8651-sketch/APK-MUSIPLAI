const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const oldJoke = `    const prompt = \`Cuenta un chiste súper corto, gracioso y animado sobre la música, el gimnasio o el día a día. Actúa como si fueras la locutora de FAI-Radio, la mejor radio. Sé muy carismática.\`;`;

const newJoke = `    const styles = [
      "Cuenta un chiste corto y diferente sobre el gimnasio.",
      "Da un dato curioso muy breve sobre la música electrónica o pop.",
      "Anima a la audiencia a seguir entrenando duro con una frase motivadora rápida.",
      "Haz un comentario gracioso y breve sobre la vida diaria o la radio.",
      "Menciona que FAI-Radio es la mejor compañía para el entrenamiento de forma rápida y carismática."
    ];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const prompt = \`\${randomStyle} Eres la locutora estrella de FAI-Radio. No repitas chistes clásicos. Sé muy carismática, natural y breve (máximo 2 oraciones, no más de 15 segundos hablados).\`;`;

code = code.replace(oldJoke, newJoke);

fs.writeFileSync('server.ts', code);
