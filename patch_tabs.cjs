const fs = require('fs');
let file = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

const targetTabs = `<button
            onClick={() => setActiveTab("users")}
            className={\`shrink-0 flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none \${
              activeTab === "users"
                ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }\`}
          >
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Usuarios <span className="hidden sm:inline">y Solicitudes</span></span>
            {requests.filter(r => r.status === "pending").length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                {requests.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>`;

const newTabs = `<button
            onClick={() => setActiveTab("requests")}
            className={\`shrink-0 flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none \${
              activeTab === "requests"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }\`}
          >
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Solicitudes</span>
            {requests.filter(r => r.status === "pending").length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                {requests.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={\`shrink-0 flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none \${
              activeTab === "subscriptions"
                ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }\`}
          >
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Suscripciones</span>
          </button>`;

file = file.replace(targetTabs, newTabs);
fs.writeFileSync('src/components/UserManagementAdmin.tsx', file);
