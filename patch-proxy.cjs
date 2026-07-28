const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const proxy = await getWorkingProxy();",
  "const proxy = null; // Disable proxy for search"
);

code = code.replace(
  "const proxy = await getWorkingProxy();",
  "const proxy = attempt === 0 ? null : await getWorkingProxy();"
);

fs.writeFileSync('server.ts', code);
