sed -i '1683,1684c\
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">\
              <div className="flex items-center gap-3">\
                <h3 className="text-white font-black text-xs sm:text-sm uppercase tracking-widest flex items-center gap-2">\
                  <Shield className="w-4 h-4 text-purple-400" /> Control de Acceso\
                </h3>\
              </div>\
              <div className="flex items-center gap-3 w-full sm:w-auto">\
                <input type="text" placeholder="Buscar por email, nombre o ID..." value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 flex-1 sm:w-64 focus:outline-none focus:border-[#1ED760]/50" />\
                <div className="flex items-center gap-2 shrink-0">\
                   <select \
                     value={usersPageSize}\
' src/components/UserManagementAdmin.tsx
