const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const botDesktop = `
                      {/* Locutora */}
                      <button
                        onClick={() => setShowAiDjModal(true)}
                        className={\`flex items-center justify-center p-2 rounded-full transition-colors shrink-0 \${
                          aiDjEnabled ? "text-[#17d1a5]" : "text-slate-400 hover:text-white"
                        }\`}
                        title="Locutora AI"
                      >
                        <Bot className="w-5 h-5" />
                      </button>
`;

code = code.replace('{/* Volume Adjuster */}', botDesktop + '\n                      {/* Volume Adjuster */}');

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
