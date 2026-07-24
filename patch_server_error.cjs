const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  'res.status(500).json({ error: "Failed to generate DJ joke" });',
  'res.status(500).json({ error: err.message || "Failed to generate DJ joke" });'
);

code = code.replace(
  'res.status(500).json({ error: "Failed to generate test voice" });',
  'res.status(500).json({ error: err.message || "Failed to generate test voice" });'
);

fs.writeFileSync('server.ts', code);
