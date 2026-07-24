const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

code = code.replace(
  `                              <div className="flex justify-between items-start">\n                                <div className="space-y-1">\n                                  <p className="text-white font-bold text-sm">\n                                    {u.displayName || "Sin Nombre"}\n                                  </p>\n                                  <p className="text-slate-400 text-xs">\n                                    {u.email}\n                                  </p>\n                                  <p className="text-[10px] text-slate-500 mt-1">\n                                    ID: {u.id}\n                                  </p>`,
  `                              <div className="flex justify-between items-start gap-2">\n                                <div className="space-y-1 min-w-0 flex-1">\n                                  <p className="text-white font-bold text-sm truncate">\n                                    {u.displayName || "Sin Nombre"}\n                                  </p>\n                                  <p className="text-slate-400 text-xs truncate">\n                                    {u.email}\n                                  </p>\n                                  <p className="text-[10px] text-slate-500 mt-1 truncate">\n                                    ID: {u.id}\n                                  </p>`
);

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
