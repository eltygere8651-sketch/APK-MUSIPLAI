const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  'console.error("DJ AI Joke Error:", err);',
  'console.error("DJ AI Joke Error:", err?.message || "Rate limit or generation error");'
);

code = code.replace(
  'console.error("DJ AI Test Voice Error:", err);',
  'console.error("DJ AI Test Voice Error:", err?.message || "Rate limit or generation error");'
);

fs.writeFileSync('server.ts', code);
