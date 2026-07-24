const fs = require('fs');
let code = fs.readFileSync('src/components/ExploreView.tsx', 'utf8');

const oldBtn = '<div className="w-4 h-4 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 shadow-xl">';
const newBtn = '<div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 shadow-[0_0_15px_rgba(16,185,129,0.5)]">';

code = code.replace(oldBtn, newBtn);
code = code.replace('<Pause className="w-2 h-2 text-black fill-black" />', '<Pause className="w-5 h-5 text-black fill-black" />');
code = code.replace('<Play className="w-2 h-2 text-black fill-black ml-0.5" />', '<Play className="w-5 h-5 text-black fill-black ml-0.5" />');

fs.writeFileSync('src/components/ExploreView.tsx', code);
