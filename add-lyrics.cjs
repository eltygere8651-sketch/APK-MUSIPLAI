const fs = require('fs');

let code = fs.readFileSync('src/components/FullScreenPlayerModal.tsx', 'utf8');

const importStr = "import { PlaybackState, Track } from '../domain/types';";
const lyricsComponent = `
const LyricsView = ({ track }: { track: Track }) => {
  const [lyrics, setLyrics] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setLyrics(null);
    
    const loadLyrics = async () => {
      try {
        const cleanTitle = track.title.replace(/\\(.*?\\)|\\[.*?\\]/g, '').trim();
        const cleanArtist = track.artist ? track.artist.replace(/\\(.*?\\)|\\[.*?\\]/g, '').trim() : '';
        
        let res = await fetch(\`https://lrclib.net/api/get?artist_name=\${encodeURIComponent(cleanArtist)}&track_name=\${encodeURIComponent(cleanTitle)}\`);
        if (res.ok) {
          const data = await res.json();
          if (active) setLyrics(data.plainLyrics || data.syncedLyrics || "Letras no disponibles.");
        } else {
          const searchRes = await fetch(\`https://lrclib.net/api/search?q=\${encodeURIComponent(cleanArtist + ' ' + cleanTitle)}\`);
          if (searchRes.ok) {
            const data = await searchRes.json();
            if (data && data.length > 0) {
              if (active) setLyrics(data[0].plainLyrics || data[0].syncedLyrics || "Letras no disponibles.");
            } else {
              if (active) setLyrics("No se encontraron letras para esta canción.");
            }
          } else {
            if (active) setLyrics("No se pudieron cargar las letras.");
          }
        }
      } catch (e) {
        if (active) setLyrics("Error al cargar las letras.");
      } finally {
        if (active) setLoading(false);
      }
    };
    
    loadLyrics();
    return () => { active = false; };
  }, [track.id, track.title, track.artist]);

  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-start max-w-2xl mx-auto w-full px-4 overflow-hidden h-full">
      <div className="w-full text-center mb-6 shrink-0 mt-4">
        <h3 className="text-xl font-bold text-white truncate">{track.title}</h3>
        <p className="text-sm text-neutral-400">{track.artist}</p>
      </div>
      <div className="flex-1 w-full overflow-y-auto pb-12 scrollbar-hide text-center px-2">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <p className="text-lg md:text-xl font-medium text-neutral-200 leading-relaxed whitespace-pre-wrap pb-10">
            {lyrics}
          </p>
        )}
      </div>
    </div>
  );
};
`;

code = code.replace(importStr, importStr + "\n" + lyricsComponent);

// Change activeTab state
code = code.replace(
  "const [activeTab, setActiveTab] = React.useState<'player' | 'queue' | 'video'>('player');",
  "const [activeTab, setActiveTab] = React.useState<'player' | 'queue' | 'lyrics'>('player');"
);

// Remove YoutubeVideoContainer definition
code = code.replace(/const YoutubeVideoContainer = \(\) => \{[\s\S]*?\};\n/, '');

// Replace tabs
const oldTabs = `{youtubeId && (
            <button
              onClick={() => setActiveTab('video')}
              className={\`px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 \${
                activeTab === 'video' ? 'bg-white text-black shadow-md' : 'text-neutral-300 hover:text-white'
              }\`}
            >
              Video
            </button>
          )}`;

const newTabs = `<button
              onClick={() => setActiveTab('lyrics')}
              className={\`px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 \${
                activeTab === 'lyrics' ? 'bg-white text-black shadow-md' : 'text-neutral-300 hover:text-white'
              }\`}
            >
              Letras
            </button>`;

code = code.replace(oldTabs, newTabs);

// Replace views
const videoViewRegex = /\) : activeTab === 'video' && youtubeId \? \([\s\S]*?\) : \(/;
const lyricsView = `) : activeTab === 'lyrics' ? (
        <LyricsView track={currentTrack} />
      ) : (`;

code = code.replace(videoViewRegex, lyricsView);

fs.writeFileSync('src/components/FullScreenPlayerModal.tsx', code);
console.log("Patched tabs");
