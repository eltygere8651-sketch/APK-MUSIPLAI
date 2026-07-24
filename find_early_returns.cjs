const fs = require('fs');

function checkFile(filename) {
    const code = fs.readFileSync(filename, 'utf8');
    const lines = code.split('\n');
    let depth = 0;
    let inComponent = false;
    let componentDepth = 0;
    let earlyReturnLine = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Count braces
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        
        if (depth === 0 && line.match(/(export\s+(const|function)\s+[A-Z]\w*|export\s+default\s+(function|const)\s+[A-Z]\w*)/)) {
            inComponent = true;
            componentDepth = depth + openBraces - closeBraces;
            earlyReturnLine = -1;
        }

        if (inComponent && depth === componentDepth) {
            if (line.match(/^\s*if\s*\(.*?\)\s*return\s+/) || line.match(/^\s*return\s+[a-z0-9]/i) && !line.match(/^\s*return\s*\(/)) {
                earlyReturnLine = i + 1;
            } else if (line.match(/^\s*use(State|Effect|Memo|Callback|Ref|Context)\(/)) {
                if (earlyReturnLine !== -1) {
                    console.log(`Hook after early return in ${filename}:${i + 1} (Return at line ${earlyReturnLine})`);
                }
            }
        }

        depth += openBraces - closeBraces;
        if (depth === 0) {
            inComponent = false;
            earlyReturnLine = -1;
        }
    }
}

const glob = require('fs').readdirSync('src/components').filter(f => f.endsWith('.tsx'));
for (const file of glob) {
    checkFile('src/components/' + file);
}
