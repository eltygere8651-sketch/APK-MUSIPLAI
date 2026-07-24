sed -i '10130,10138c\
                  {user && (\
                    <button\
                      onClick={() => user.isAnonymous ? setAuthModalOpen(true) : signOut(auth)}\
                      className="mt-4 text-white/40 hover:text-white/80 transition-colors text-[9px] uppercase font-bold tracking-widest flex items-center justify-center gap-1 w-full"\
                    >\
                      {user.isAnonymous ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}\
                      {user.isAnonymous ? "Iniciar Sesión / Registro" : "Cerrar Sesión"}\
                    </button>\
                  )}\
' src/components/GymMusicPlayer.tsx
