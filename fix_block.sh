sed -i '1674,1716c\
          {activeTab === "subscriptions" && (\
            <>\
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">\
                <div className="flex items-center gap-3">\
                  <h3 className="text-white font-black text-xs sm:text-sm uppercase tracking-widest flex items-center gap-2">\
                    <Shield className="w-4 h-4 text-purple-400" /> Control de Acceso (Pág {usersPage})\
                  </h3>\
                </div>\
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">\
                  <input type="text" placeholder="Buscar por email, nombre o ID..." value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 flex-1 sm:w-64 focus:outline-none focus:border-[#1ED760]/50" />\
                  <div className="flex items-center gap-2 shrink-0">\
                    <select \
                      value={usersPageSize}\
                      onChange={(e) => {\
                        setUsersPageSize(Number(e.target.value));\
                        setUsersPage(0);\
                        setHasMoreUsers(true);\
                        fetchUsers(0, null, true);\
                      }}\
                      className="bg-black/40 border border-white/10 text-white text-[10px] p-1 rounded-md cursor-pointer outline-none"\
                    >\
                      <option value={10}>10 por pág</option>\
                      <option value={50}>50 por pág</option>\
                      <option value={100}>100 por pág</option>\
                    </select>\
                    <button \
                      onClick={() => fetchUsers(usersPage - 2)}\
                      disabled={usersPage <= 1}\
                      className="p-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-md cursor-pointer"\
                    >\
                      <ChevronLeft className="w-4 h-4 text-white" />\
                    </button>\
                    <button \
                      onClick={() => fetchUsers(usersPage)}\
                      disabled={!hasMoreUsers}\
                      className="p-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-md cursor-pointer"\
                    >\
                      <ChevronRight className="w-4 h-4 text-white" />\
                    </button>\
                  </div>\
                </div>\
              </div>\
' src/components/UserManagementAdmin.tsx
