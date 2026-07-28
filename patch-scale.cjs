const fs = require('fs');
let code = fs.readFileSync('src/components/FullScreenPlayerModal.tsx', 'utf8');

const badScale = `<div className="flex-1 min-h-0 w-full flex items-center justify-center mb-6 mt-2">
            <div className="w-full max-w-[420px] max-h-full aspect-square rounded-2xl md:rounded-[32px] bg-neutral-900 overflow-hidden shadow-2xl relative group">`;

const goodScale = `<div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center mb-6 mt-2">
            <div className="h-full max-w-[420px] max-h-[420px] aspect-square rounded-2xl md:rounded-[32px] bg-neutral-900 overflow-hidden shadow-2xl relative group">`;

code = code.replace(badScale, goodScale);
fs.writeFileSync('src/components/FullScreenPlayerModal.tsx', code);
console.log("Patched scale");
