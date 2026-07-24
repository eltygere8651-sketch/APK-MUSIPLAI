const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

code = code.replace(/<div className="bg-red-500\/10 p-3 rounded-2xl border border-red-500\/20 flex flex-col gap-1">\s*<span className="text-\[9px\] uppercase tracking-wider text-red-400 font-black">Bloqueados<\/span>\s*<span className=\{`text-lg font-black \$\{vipStats\.blocked \!== null \? 'text-white' : 'text-slate-500 text-xs'\}`\}>\{vipStats\.blocked \!== null \? vipStats\.blocked : "Sin datos"\}<\/span>\s*<\/div>/g, '');

code = code.replace(/<div className="bg-orange-500\/10 p-3 rounded-2xl border border-orange-500\/20 flex flex-col gap-1">\s*<span className="text-\[9px\] uppercase tracking-wider text-orange-400 font-black">Sospechosos<\/span>\s*<span className=\{`text-lg font-black \$\{vipStats\.suspicious \!== null \? 'text-white' : 'text-slate-500 text-xs'\}`\}>\{vipStats\.suspicious \!== null \? vipStats\.suspicious : "Sin datos"\}<\/span>\s*<\/div>/g, '');

// Also change grid-cols-3 to grid-cols-2 or 4 since we now have 4 items: Activadas, Activas Hoy, Caducadas, Conversiones
code = code.replace(/<div className="grid grid-cols-3 gap-3 mb-4">/, '<div className="grid grid-cols-2 gap-3 mb-4">');

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
