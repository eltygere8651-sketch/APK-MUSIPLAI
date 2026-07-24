const fs = require('fs');
let code = fs.readFileSync('src/components/VIPLandingView.tsx', 'utf-8');

const target = `            <><MessageSquare className="w-5 h-5" /> CONTACTAR PARA ACTIVAR PREMIUM</>
          )}
        </button>`;

const replace = `            <><MessageSquare className="w-5 h-5" /> CONTACTAR PARA ACTIVAR PREMIUM</>
          )}
        </button>
        {auth.currentUser && (
          <button
            onClick={() => {
              signOut(auth);
              window.location.reload();
            }}
            className="mt-6 text-white/40 hover:text-white/80 transition-colors text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1 z-10"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        )}`;

if (code.includes(target)) {
  code = code.replace(target, replace);
  fs.writeFileSync('src/components/VIPLandingView.tsx', code);
  console.log("Patched VIPLandingView button");
} else {
  console.log("Could not find target in VIPLandingView");
}
