const fs = require('fs');
let code = fs.readFileSync('src/components/FullScreenPlayerModal.tsx', 'utf8');

const oldLayout1 = `<div className="relative z-10 flex-1 flex flex-col items-center justify-between max-w-[420px] mx-auto w-full pb-2 md:pb-8">`;
const newLayout1 = `<div className="relative z-10 flex-1 flex flex-col lg:flex-row lg:max-w-5xl lg:gap-24 items-center justify-between max-w-[420px] mx-auto w-full pb-2 md:pb-8 lg:px-12">`;

const oldLayout2 = `<div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center mb-4 mt-1">`;
const newLayout2 = `<div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center mb-4 mt-1 lg:mb-0 lg:w-1/2 lg:flex-none">`;

const oldLayout3 = `<div className="h-full w-full max-w-[360px] max-h-[50vh] min-h-[200px] aspect-square rounded-2xl md:rounded-[32px] bg-neutral-900 overflow-hidden shadow-2xl relative group">`;
const newLayout3 = `<div className="h-full w-full max-w-[360px] lg:max-w-[480px] lg:max-h-[480px] max-h-[50vh] min-h-[200px] aspect-square rounded-2xl md:rounded-[32px] bg-neutral-900 overflow-hidden shadow-2xl relative group">`;

const oldLayout4 = `<div className="w-full shrink-0">`;
const newLayout4 = `<div className="w-full shrink-0 lg:w-1/2 lg:flex-none lg:flex lg:flex-col lg:justify-center lg:px-4">`;

code = code.replace(oldLayout1, newLayout1);
code = code.replace(oldLayout2, newLayout2);
code = code.replace(oldLayout3, newLayout3);
code = code.replace(oldLayout4, newLayout4);

fs.writeFileSync('src/components/FullScreenPlayerModal.tsx', code);
console.log("Patched layout");
