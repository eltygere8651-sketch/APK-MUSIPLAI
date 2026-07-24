const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

// Replace desktop button
const desktopBtn = `                      {/* Locutora */}
                      <button
                        onClick={() => setShowAiDjModal(true)}
                        className={\`flex items-center justify-center p-2 rounded-full transition-colors shrink-0 \${
                          aiDjEnabled ? "text-[#17d1a5]" : "text-slate-400 hover:text-white"
                        }\`}
                        title="Locutora AI"
                      >
                        <Bot className="w-5 h-5" />
                      </button>`;
const newDesktopBtn = `                      {/* Locutora */}
                      {trackListTab === "radio-fai" && (
                        <button
                          onClick={() => setShowAiDjModal(true)}
                          className={\`flex items-center justify-center p-2 rounded-full transition-colors shrink-0 \${
                            aiDjEnabled ? "text-[#17d1a5]" : "text-slate-400 hover:text-white"
                          }\`}
                          title="Locutora AI"
                        >
                          <Bot className="w-5 h-5" />
                        </button>
                      )}`;
code = code.replace(desktopBtn, newDesktopBtn);

// Replace mobile button
const mobileBtn = `        {/* Locutora */}
        <button
          onClick={() => setShowAiDjModal(true)}
          className={\`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all \${
            showAiDjModal
              ? "text-[#17d1a5] font-bold"
              : "text-slate-500 hover:text-[#17d1a5]"
          }\`}
        >
          <Bot className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase tracking-widest">
            Locutora
          </span>
        </button>`;

const newMobileBtn = `        {/* Locutora */}
        {trackListTab === "radio-fai" && (
          <button
            onClick={() => setShowAiDjModal(true)}
            className={\`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all \${
              showAiDjModal
                ? "text-[#17d1a5] font-bold"
                : "text-slate-500 hover:text-[#17d1a5]"
            }\`}
          >
            <Bot className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-widest">
              Locutora
            </span>
          </button>
        )}`;

code = code.replace(mobileBtn, newMobileBtn);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
