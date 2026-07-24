const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

// 1. Remove Resumen de Actividad Global "Hrs Reproducción" and "Tiempo Total (Hrs)"
code = code.replace(/<div className="bg-white\/\[0\.02\] p-3 rounded-2xl border border-white\/5 flex flex-col gap-1">\s*<span className="text-\[9px\] uppercase tracking-wider text-slate-500 font-black">Hrs Reproducción<\/span>[\s\S]*?<\/div>\s*<div className="bg-white\/\[0\.02\] p-3 rounded-2xl border border-white\/5 flex flex-col gap-1">\s*<span className="text-\[9px\] uppercase tracking-wider text-slate-500 font-black">Tiempo Total \(Hrs\)<\/span>[\s\S]*?<\/div>/g, '');

// 2. Remove "Uso de Funciones" section completely
code = code.replace(/\{\/\* Uso de Funciones \*\/\}\s*<div className="bg-\[\#121214\] border border-white\/5 rounded-3xl p-5 space-y-4">\s*<h4 className="text-\[10px\] font-black uppercase tracking-wider text-slate-400">Interacciones Clave<\/h4>\s*<div className="space-y-3">[\s\S]*?<\/div>\s*<\/div>/g, '');

// 3. Remove "Top Canciones" completely
code = code.replace(/\{\/\* Top Canciones \*\/\}\s*<div className="bg-\[\#121214\] border border-white\/5 rounded-3xl p-5 space-y-4 md:col-span-2">[\s\S]*?<\/div>\s*\{\/\* Top Searches & Genres \*\/\}/g, '{/* Top Searches & Genres */}');

// 4. Remove "Top Searches & Genres" completely
code = code.replace(/\{\/\* Top Searches & Genres \*\/\}\s*<div className="bg-\[\#121214\] border border-white\/5 rounded-3xl p-5 space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">[\s\S]*?<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*\)\}/g, '</div>\n              )}\n            </div>\n          )}');

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
