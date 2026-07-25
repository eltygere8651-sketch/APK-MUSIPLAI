import { API_BASE_URL } from "../lib/constants";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactPlayer from "react-player";
import { 
  Mic, 
  Search, 
  Play, 
  Pause, 
  SkipForward, 
  Loader2, 
  Sliders, 
  X, 
  Music, 
  ListMusic, 
  Plus, 
  Trash2, 
  Flame, 
  Sparkles, 
  Volume2, 
  ChevronLeft,
  Library,
  Heart,
  ListPlus,
  PlaySquare
} from "lucide-react";

const createSilentAudioBlobURL = (): string => {
  if (typeof window === "undefined") return "";
  const sampleRate = 44100;
  const duration = 10;
  const numSamples = sampleRate * duration;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, 0, true);
  }

  const blob = new Blob([view], { type: "audio/wav" });
  return URL.createObjectURL(blob);
};

const silentAudioBlobSrc = createSilentAudioBlobURL();

export const FluxKaraoke = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lyrics, setLyrics] = useState<{time: number, text: string}[] | string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [lyricsState, setLyricsState] = useState<"loading" | "found" | "not_found">("loading");
  
  const [trackForPlaylist, setTrackForPlaylist] = useState<any>(null);
  
  const [karaokeQueue, setKaraokeQueue] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"genres" | "search" | "library" | "queue">("genres");

  // Library State
  const [recentTracks, setRecentTracks] = useState<any[]>(() => {
    try { const saved = localStorage.getItem('flux_karaoke_recent'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [favoriteTracks, setFavoriteTracks] = useState<any[]>(() => {
    try { const saved = localStorage.getItem('flux_karaoke_favorites'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [playlists, setPlaylists] = useState<{id: string, name: string, tracks: any[]}[]>(() => {
    try { const saved = localStorage.getItem('flux_karaoke_playlists'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  // Persist library changes
  useEffect(() => { localStorage.setItem('flux_karaoke_recent', JSON.stringify(recentTracks)); }, [recentTracks]);
  useEffect(() => { localStorage.setItem('flux_karaoke_favorites', JSON.stringify(favoriteTracks)); }, [favoriteTracks]);
  useEffect(() => { localStorage.setItem('flux_karaoke_playlists', JSON.stringify(playlists)); }, [playlists]);

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // Immersive player controls visibility states for mobile
  const [showMobileControls, setShowMobileControls] = useState(true);
  const controlsTimeoutRef = useRef<any>(null);

  const reactPlayerRef = useRef<any>(null);
  const fallbackSilentAudioRef = useRef<HTMLAudioElement | null>(null);
  const expectedPlayingRef = useRef(false);

  useEffect(() => {
    const handleFirstGesture = () => {
      if (fallbackSilentAudioRef.current) {
        fallbackSilentAudioRef.current.play().catch(() => {});
      }
      window.removeEventListener("click", handleFirstGesture);
      window.removeEventListener("touchstart", handleFirstGesture);
    };
    window.addEventListener("click", handleFirstGesture);
    window.addEventListener("touchstart", handleFirstGesture);
    return () => {
      window.removeEventListener("click", handleFirstGesture);
      window.removeEventListener("touchstart", handleFirstGesture);
    };
  }, []);

  const premiumPlaylists = [
    {
      group: "Artistas Leyenda",
      items: [
        { name: "Luis Miguel", color: "from-amber-600 to-yellow-900", query: "Luis Miguel karaoke" },
        { name: "Juan Gabriel", color: "from-pink-600 to-purple-900", query: "Juan Gabriel karaoke" },
        { name: "Rocío Dúrcal", color: "from-rose-500 to-red-900", query: "Rocio Durcal karaoke" },
        { name: "Vicente F.", color: "from-orange-600 to-red-900", query: "Vicente Fernandez karaoke" },
      ]
    },
    {
      group: "Clásicos Inolvidables",
      items: [
        { name: "Baladas de Oro", color: "from-blue-600 to-indigo-900", query: "baladas romanticas clasicas en español karaoke" },
        { name: "Rock en Español", color: "from-slate-700 to-black", query: "rock en español clasicos karaoke" },
        { name: "Pop Latino 2000s", color: "from-fuchsia-600 to-pink-900", query: "pop latino clasicos karaoke" },
        { name: "Salsa Romántica", color: "from-red-600 to-rose-950", query: "salsa romantica karaoke" },
      ]
    },
    {
      group: "Pop Romántico & Duetos",
      items: [
        { name: "Sin Bandera", color: "from-indigo-500 to-purple-900", query: "Sin Bandera karaoke" },
        { name: "Reik & Camila", color: "from-rose-500 to-pink-900", query: "Reik Camila karaoke" },
        { name: "Alejandro Sanz", color: "from-zinc-500 to-zinc-900", query: "Alejandro Sanz karaoke" },
        { name: "Duetos Favoritos", color: "from-purple-500 to-fuchsia-900", query: "duetos pop español karaoke" },
      ]
    },
    {
      group: "Divas del Pop",
      items: [
        { name: "Thalía", color: "from-pink-500 to-rose-900", query: "Thalia karaoke" },
        { name: "Gloria Trevi", color: "from-purple-600 to-black", query: "Gloria Trevi karaoke" },
        { name: "Laura Pausini", color: "from-blue-500 to-cyan-900", query: "Laura Pausini karaoke español" },
        { name: "Yuri", color: "from-amber-500 to-orange-900", query: "Yuri karaoke" },
      ]
    },
    {
      group: "Fiesta y Tropical",
      items: [
        { name: "Ángeles Azules", color: "from-cyan-500 to-blue-900", query: "Los Angeles Azules karaoke" },
        { name: "Celia Cruz", color: "from-orange-500 to-red-900", query: "Celia Cruz karaoke" },
        { name: "Marc Anthony", color: "from-red-500 to-rose-900", query: "Marc Anthony karaoke" },
        { name: "Bachata Hits", color: "from-indigo-600 to-purple-900", query: "Romeo Santos Aventura bachata karaoke" },
      ]
    },
    {
      group: "Urbano & Regional",
      items: [
        { name: "Reggaeton Old School", color: "from-emerald-500 to-teal-900", query: "reggaeton clasico old school karaoke" },
        { name: "Christian Nodal", color: "from-stone-600 to-stone-900", query: "Christian Nodal karaoke" },
        { name: "Banda MS", color: "from-yellow-600 to-amber-900", query: "Banda MS karaoke" },
        { name: "Éxitos Actuales", color: "from-violet-600 to-purple-900", query: "exitos español 2024 karaoke" },
      ]
    },
    {
      group: "Ídolos Latinos",
      items: [
        { name: "Shakira", color: "from-sky-500 to-blue-900", query: "Shakira karaoke" },
        { name: "Maná", color: "from-teal-600 to-emerald-900", query: "Mana karaoke" },
        { name: "Chayanne", color: "from-red-500 to-rose-900", query: "Chayanne karaoke" },
        { name: "Selena", color: "from-purple-500 to-indigo-900", query: "Selena quintanilla karaoke" },
      ]
    }
  ];

  const handlePlayTrack = (track: any) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    expectedPlayingRef.current = true;
    
    // Request fullscreen on mobile directly inside the user click handler to satisfy browser gesture requirements
    if (window.innerWidth < 768) {
      const el = document.documentElement as any;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch((err: any) => console.log("Fullscreen prevented", err));
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    }

    // Add to recents
    setRecentTracks(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      return [track, ...filtered].slice(0, 6);
    });
  };

  const toggleFavorite = (track: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteTracks(prev => {
      if (prev.some(t => t.id === track.id)) {
        return prev.filter(t => t.id !== track.id);
      }
      return [...prev, track];
    });
  };

  const createPlaylist = (name: string) => {
    if (!name.trim()) return;
    setPlaylists(prev => [...prev, { id: Date.now().toString(), name: name.trim(), tracks: [] }]);
  };

  const handleAddToQueue = (track: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setKaraokeQueue(prev => [...prev, track]);
    // Notify briefly or switch to queue tab
    setActiveTab("queue");
  };

  const handleRemoveFromQueue = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setKaraokeQueue(prev => {
      const newQ = [...prev];
      newQ.splice(index, 1);
      return newQ;
    });
  };

  const handlePlayNextInQueue = () => {
    if (karaokeQueue.length > 0) {
      const nextTrack = karaokeQueue[0];
      setKaraokeQueue(prev => prev.slice(1));
      setCurrentTrack(nextTrack);
      setIsPlaying(true);
      expectedPlayingRef.current = true;
    } else {
      setCurrentTrack(null);
    }
  };

  // Reset controls hide timer on mobile
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowMobileControls(false);
    }, 4000);
  };

  const handlePlayerScreenTouch = () => {
    setShowMobileControls(prev => !prev);
  };

  useEffect(() => {
    if (showMobileControls && isPlaying) {
      resetControlsTimeout();
    } else if (!isPlaying) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showMobileControls, isPlaying]);

  useEffect(() => {
    if (currentTrack) {
      setLyrics(null);
      setCurrentTime(0);
      setLyricsState("loading");
      // Set to true immediately to satisfy iOS autoplay user-gesture requirements
      setIsPlaying(true);
      setShowMobileControls(true);
      setIsPlayerReady(false);
      setIsBuffering(true);
      
      let query = currentTrack.title.replace(/karaoke|instrumental|cover|lyrics|letra|video oficial|official video/gi, '').trim();
      query = query.replace(/\[.*?\]|\(.*?\)/g, '').trim();
      
      if (!query) {
        setLyricsState("not_found");
        return;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds max

      fetch(`${API_BASE_URL}/api/lyrics/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(res => {
          clearTimeout(timeoutId);
          if (!res.ok) throw new Error(`Server returned ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data && data.length > 0) {
             const bestMatch = data.find((d: any) => d.syncedLyrics) || data[0];
             if (bestMatch.syncedLyrics) {
               const lines = bestMatch.syncedLyrics.split('\n');
               const parsed = [];
               const regex = /\[(\d{2}):(\d{2}\.\d{2,3})\](.*)/;
               for (const line of lines) {
                 const match = line.match(regex);
                 if (match) {
                   const min = parseInt(match[1]);
                   const sec = parseFloat(match[2]);
                   const text = match[3].trim();
                   if (text) parsed.push({ time: min * 60 + sec, text });
                 }
               }
               setLyrics(parsed);
               setLyricsState("found");
             } else if (bestMatch.plainLyrics) {
               setLyrics(bestMatch.plainLyrics);
               setLyricsState("found");
             } else {
               setLyricsState("not_found");
             }
          } else {
             setLyricsState("not_found");
          }
        }).catch(err => {
          clearTimeout(timeoutId);
          console.error("Lyrics fetch error:", err);
          setLyricsState("not_found");
        });
    }
  }, [currentTrack]);
    
  useEffect(() => {
    if (!currentTrack) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitFullscreenElement) {
        (document as any).webkitExitFullscreen();
      }
    }
  }, [currentTrack]);
    
  // Auto-play is now triggered immediately in the track selection to support iOS
  useEffect(() => {
    // Only used to ensure it stays playing if state changes
    if (currentTrack && (lyricsState === "found" || lyricsState === "not_found")) {
      setIsPlaying(true);
      expectedPlayingRef.current = true;
    }
  }, [lyricsState, currentTrack]);


  // Microphone & Audio Engine
  const [micEnabled, setMicEnabled] = useState(false);
  const [micVolume, setMicVolume] = useState(80);
  const [showSettings, setShowSettings] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const outputGainNodeRef = useRef<GainNode | null>(null);

  const initWebAudio = async () => {
    try {
      // Optimized for low latency (no solapado) and no dropouts (no entrecortado)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: true, // Vital to prevent feedback loops ("solapado") from speakers
        noiseSuppression: false, // Disable to prevent voice from cutting out ("entrecortado")
        autoGainControl: false, // Keep volume consistent
        channelCount: 2 // Prefer stereo if available
      } });
      mediaStreamRef.current = stream;

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext({ latencyHint: 'interactive' });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // Direct Output gain (optimized, no heavy processing)
      const output = ctx.createGain();
      output.gain.value = micVolume / 100;
      outputGainNodeRef.current = output;

      // Direct Routing
      source.connect(output);
      output.connect(ctx.destination);

      setMicEnabled(true);
      setMicPermissionError(false);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setMicPermissionError(true);
    }
  };

  const stopWebAudio = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setMicEnabled(false);
  };

  const toggleMic = () => {
    if (micEnabled) {
      stopWebAudio();
    } else {
      initWebAudio();
    }
  };

  useEffect(() => {
    if (outputGainNodeRef.current) {
      outputGainNodeRef.current.gain.value = micVolume / 100;
    }
  }, [micVolume]);

  useEffect(() => {
    return () => {
      stopWebAudio();
    };
  }, []);

  const performSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setSearchQuery(queryText);
    setIsSearching(true);
    setActiveTab("search");
    try {
      // Prioritize high-quality professional karaoke channels with synchronized lyrics
      const query = `${queryText} karaoke con letra`;
      const response = await fetch(`${API_BASE_URL}/api/youtube/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");
      const results = await response.json();
      
      // Filter out low quality and verify it's karaoke
      const validResults = results.filter((v: any) => {
        if (!v.id || !v.title) return false;
        const titleLower = v.title.toLowerCase();
        const authorLower = (v.author || '').toLowerCase();
        
        // Anti-patterns for low-quality or incorrect tracks
        if (titleLower.includes('8-bit') || titleLower.includes('8 bit') || titleLower.includes('midi') || titleLower.includes('parodia') || titleLower.includes('parody') || titleLower.includes('chipmunk') || titleLower.includes('live') || titleLower.includes('en vivo')) return false;

        // Force strictly karaoke or instrumental (not just lyrics)
        const isKaraoke = titleLower.includes('karaoke') || titleLower.includes('karafun') || titleLower.includes('sing king') || titleLower.includes('cantaokey') || titleLower.includes('instrumental') || titleLower.includes('pista') || authorLower.includes('karaoke') || authorLower.includes('karafun');
        
        if (!isKaraoke) {
          return false;
        }

        // Plan B guarantee: MUST be a karaoke track that likely has on-screen lyrics
        const hasLyrics = titleLower.includes('letra') || titleLower.includes('lyrics') || titleLower.includes('karaoke') || titleLower.includes('karafun') || titleLower.includes('sing king');
        if (!hasLyrics) {
          return false;
        }

        return true;
      });

      // Sort to prioritize known premium channels and assign a premium flag
      const queryLower = queryText.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
      
      const scoredResults = validResults.map((v: any, index: number) => {
        let score = (validResults.length - index) * 10; // YouTube relevance baseline
        let premiumScore = 0;
        const lower = v.title.toLowerCase();
        
        if (lower.includes(queryLower)) {
          score += 2000; // Huge boost for exact phrase match
        }
        
        let matchCount = 0;
        for (const word of queryWords) {
          if (lower.includes(word)) matchCount++;
        }
        
        if (queryWords.length > 0) {
          score += (matchCount / queryWords.length) * 1000;
          
          if (matchCount === 0) {
            score -= 1000; // Penalize results that don't match any query words
          }
        }

        if (lower.includes('karafun') || lower.includes('sing king') || lower.includes('cantaokey')) premiumScore += 500;
        if (lower.includes('karaoke version')) premiumScore += 150;
        if (lower.includes('con letra') || lower.includes('letra') || lower.includes('lyrics')) premiumScore += 300;
        
        // Penalize plain instrumentals without lyrics
        if (lower.includes('instrumental') && !lower.includes('karaoke') && !lower.includes('letra') && !lower.includes('lyrics')) {
          premiumScore -= 1000;
        }
        // Penalize original unless it's a karaoke version
        if (lower.includes('original') && !lower.includes('karaoke version')) {
          premiumScore -= 200;
        }
        
        if (lower.includes('oficial') || lower.includes('official')) premiumScore += 40;
        if (lower.includes('studio')) premiumScore += 30;
        if (lower.includes('acoustic') || lower.includes('acústico')) premiumScore += 20;
        
        return { ...v, score: score + premiumScore, isPremium: premiumScore >= 100 };
      });

      scoredResults.sort((a: any, b: any) => b.score - a.score);

      setSearchResults(scoredResults);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const getDynamicTheme = (title: string = "") => {
    const lower = (title || "").toLowerCase();
    if (lower.includes("reggaeton") || lower.includes("urbano") || lower.includes("latin") || lower.includes("salsa") || lower.includes("bachata") || lower.includes("regeton")) {
      return {
        base: "from-[#0c0512] via-[#050b14] to-[#120a05]",
        orb1: "bg-amber-500/25",
        orb2: "bg-emerald-500/30",
        orb3: "bg-pink-500/30",
        orb4: "bg-teal-500/25",
        overlay: "from-amber-950/15 via-black/85 to-black"
      };
    }
    if (lower.includes("rock") || lower.includes("metal") || lower.includes("clásicos") || lower.includes("classics") || lower.includes("fiesta")) {
      return {
        base: "from-[#0a0505] via-[#070707] to-[#140808]",
        orb1: "bg-red-600/30",
        orb2: "bg-orange-500/25",
        orb3: "bg-slate-700/40",
        orb4: "bg-rose-700/25",
        overlay: "from-red-950/15 via-black/85 to-black"
      };
    }
    if (lower.includes("balada") || lower.includes("love") || lower.includes("romantic") || lower.includes("romanticas") || lower.includes("duetos") || lower.includes("baladas")) {
      return {
        base: "from-[#050512] via-[#0b0514] to-[#0a050d]",
        orb1: "bg-pink-500/30",
        orb2: "bg-indigo-600/30",
        orb3: "bg-purple-500/25",
        orb4: "bg-rose-400/25",
        overlay: "from-purple-950/20 via-black/90 to-black"
      };
    }
    // Default/Pop
    return {
      base: "from-[#050a12] via-[#0a0514] to-[#05120d]",
      orb1: "bg-emerald-500/30",
      orb2: "bg-purple-600/30",
      orb3: "bg-cyan-500/30",
      orb4: "bg-fuchsia-500/25",
      overlay: "from-emerald-950/20 via-black/90 to-black"
    };
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] text-white select-none relative">
      {/* Global hidden audio for iOS unlock */}
      <audio
        ref={fallbackSilentAudioRef}
        src={silentAudioBlobSrc}
        playsInline
        loop
        className="hidden absolute w-0 h-0 pointer-events-none opacity-0"
      />
      {/* Header / Search (Always visible or styled for great navigation) */}
      <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-black/30">
        <div>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest flex items-center gap-2">
            <Mic className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" /> Flux Karaoke
          </h2>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 md:w-80">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (activeTab === "genres") {
                  setActiveTab("search");
                }
              }}
              placeholder="Busca artistas, canciones..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-9 pr-4 text-xs md:text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-slate-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 animate-spin" />}
          </form>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full transition-all shrink-0 ${showSettings ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 active:bg-white/10'}`}
            title="Configuración de Voz"
          >
            <Sliders className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        
        {/* Left/Player Container Placeholder */}
        {/* On mobile/tablets: full flex height if playing; hidden if not playing (discover view takes over sidebar area) */}
        <div className={`w-full lg:flex-1 flex-col border-b lg:border-b-0 lg:border-r border-white/5 relative ${!currentTrack ? "hidden lg:flex" : "flex flex-1 h-full bg-[#050505]"}`}>
          {/* Covered by the absolute overlay player */}
        </div>

        {/* Right Side / Sidebar: Unified Navigation for Mobile, Tablet & Desktop */}
        {/* On mobile/tablets: displayed if no song is active. Integrates Discover/Explore, Search and Queue */}
        <div className={`w-full lg:w-[380px] bg-black flex flex-col min-h-0 overflow-hidden shrink-0 ${currentTrack ? 'hidden lg:flex' : 'flex flex-1 h-full'}`}>
          
          {/* Top Segment Control / Tab Bar */}
          <div className="flex border-b border-white/5 bg-black/60 backdrop-blur-md sticky top-0 z-15 w-full overflow-x-auto custom-scrollbar no-scrollbar">
            <button 
              onClick={() => setActiveTab("genres")}
              className={`shrink-0 px-4 py-3.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 ${activeTab === 'genres' ? 'text-pink-400 border-b-2 border-pink-400 bg-gradient-to-t from-pink-500/10 to-transparent' : 'text-slate-400 active:text-slate-200'}`}
            >
              <Flame className="w-4 h-4 mb-0.5" /> Explorar
            </button>
            <button 
              onClick={() => setActiveTab("search")}
              className={`shrink-0 px-4 py-3.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 ${activeTab === 'search' ? 'text-purple-400 border-b-2 border-purple-400 bg-gradient-to-t from-purple-500/10 to-transparent' : 'text-slate-400 active:text-slate-200'}`}
            >
              <Search className="w-4 h-4 mb-0.5" /> Buscar
            </button>
            <button 
              onClick={() => setActiveTab("library")}
              className={`shrink-0 px-4 py-3.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 ${activeTab === 'library' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-gradient-to-t from-emerald-500/10 to-transparent' : 'text-slate-400 active:text-slate-200'}`}
            >
              <Library className="w-4 h-4 mb-0.5" /> Biblioteca
            </button>
            <button 
              onClick={() => setActiveTab("queue")}
              className={`shrink-0 px-4 py-3.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 relative ${activeTab === 'queue' ? 'text-blue-400 border-b-2 border-blue-400 bg-gradient-to-t from-blue-500/10 to-transparent' : 'text-slate-400 active:text-slate-200'}`}
            >
              <ListMusic className="w-4 h-4 mb-0.5" /> Cola
              {karaokeQueue.length > 0 && (
                <span className="absolute top-2 right-2 md:right-4 bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)] text-white font-black w-4 h-4 flex items-center justify-center rounded-full text-[9px]">
                  {karaokeQueue.length}
                </span>
              )}
            </button>
          </div>

          {/* Dynamic Content depending on Tab */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black relative">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
            <AnimatePresence mode="wait">
              {activeTab === "genres" && (
                <motion.div
                  key="genres-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 relative z-10"
                >
                  <div className="mb-4">
                     <h3 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2 mb-1">
                       <Sparkles className="w-4 h-4 text-emerald-400" /> Lista Flux
                     </h3>
                     <p className="text-[11px] text-slate-400">Selecciona una categoría curada para empezar a cantar.</p>
                  </div>
                  <div className="space-y-6 relative z-10">
                     {premiumPlaylists.map((section, idx) => (
                       <div key={idx} className="space-y-3 relative z-10">
                         <h4 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest pl-1">{section.group}</h4>
                         <div className="grid grid-cols-2 gap-2 md:gap-3">
                           {section.items.map(cat => (
                             <button 
                               key={cat.name}
                               onClick={() => performSearch(cat.query)}
                               className={`h-20 md:h-24 rounded-xl bg-gradient-to-br ${cat.color} p-3 md:p-4 flex flex-col justify-end items-start active:scale-[1.02] active:scale-95 transition-all shadow-md overflow-hidden relative group text-left border border-white/5 active:border-white/20`}
                             >
                               <div className="absolute inset-0 bg-black/30 group-active:bg-black/10 transition-colors" />
                               <span className="text-xs md:text-sm font-black text-white relative z-10 leading-tight drop-shadow-md">
                                 {cat.name}
                               </span>
                             </button>
                           ))}
                         </div>
                       </div>
                     ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "search" && (
                <motion.div
                  key="search-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3 relative z-10"
                >
                  {searchResults.length > 0 ? (
                    searchResults.map((track: any, index: number) => (
                      <div key={track.id} className={`w-full flex items-center gap-3 p-2 bg-white/5 active:bg-white/10 rounded-xl transition-all text-left group border ${track.isPremium && index === 0 ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-900/30 to-emerald-900/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-white/5 active:border-white/10'}`}>
                        <button
                          onClick={() => handlePlayTrack(track)}
                          className="w-12 h-12 rounded-lg overflow-hidden relative shrink-0"
                        >
                          <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity">
                            <Play className="w-5 h-5 text-white fill-current" />
                          </div>
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <button 
                            onClick={() => handlePlayTrack(track)}
                            className="w-full text-left focus:outline-none"
                          >
                            <p className="text-xs font-bold text-white line-clamp-2 leading-snug group-active:text-emerald-400 transition-colors">
                              {track.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[9px] text-slate-500">Pista Instrumental • Karaoke</p>
                              {track.isPremium && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">
                                  💎 Recomendado
                                </span>
                              )}
                            </div>
                          </button>
                        </div>

                        <button
                          onClick={(e) => toggleFavorite(track, e)}
                          className={`p-2 active:bg-white/10 rounded-lg transition-all shrink-0 active:scale-90 ${favoriteTracks.some(t => t.id === track.id) ? 'text-pink-500' : 'text-slate-400 active:text-white'}`}
                          title="Favorito"
                        >
                          <Heart className={`w-4 h-4 ${favoriteTracks.some(t => t.id === track.id) ? 'fill-current' : ''}`} />
                        </button>

                        <button 
                          onClick={(e) => { e.stopPropagation(); setTrackForPlaylist(track); }}
                          className="p-2 active:bg-white/10 rounded-lg text-slate-400 active:text-white transition-all shrink-0 active:scale-90"
                          title="Añadir a Playlist"
                        >
                          <ListPlus className="w-4 h-4" />
                        </button>

                        <button 
                          onClick={(e) => handleAddToQueue(track, e)}
                          className="p-2 bg-white/5 active:bg-emerald-500 active:text-black rounded-lg text-slate-300 transition-all shrink-0 active:scale-90"
                          title="Añadir a la cola"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                     <div className="text-center py-12 flex flex-col items-center justify-center opacity-50 space-y-3">
                       <Music className="w-10 h-10 text-slate-500 animate-pulse" />
                       <p className="text-xs font-semibold text-slate-400">
                         {searchQuery ? "No se encontraron pistas." : "Busca o explora categorías."}
                       </p>
                     </div>
                  )}
                </motion.div>
              )}

              {activeTab === "library" && (
                <motion.div
                  key="library-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 relative z-10"
                >
                  <div className="mb-2">
                     <h3 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2 mb-1">
                       <Library className="w-4 h-4 text-purple-500" /> Mi Biblioteca
                     </h3>
                     <p className="text-[11px] text-slate-400">Sesiones recientes y listas para cantar.</p>
                  </div>

                  {/* Playlists */}
                  <div className="space-y-3 relative z-10">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between pl-1">
                        <h4 className="text-[10px] md:text-xs font-black text-pink-500/80 uppercase tracking-widest">Mis Sesiones</h4>
                        <button 
                          onClick={() => {
                            setIsCreatingPlaylist(!isCreatingPlaylist);
                            if (isCreatingPlaylist) setNewPlaylistName("");
                          }}
                          className="text-[10px] text-pink-400 active:text-pink-300 uppercase font-black flex items-center gap-1"
                        >
                          {isCreatingPlaylist ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />} {isCreatingPlaylist ? 'Cancelar' : 'Crear'}
                        </button>
                      </div>
                      <AnimatePresence>
                        {isCreatingPlaylist && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-2 overflow-hidden"
                          >
                            <input
                              type="text"
                              value={newPlaylistName}
                              onChange={(e) => setNewPlaylistName(e.target.value)}
                              placeholder="Nombre de sesión..."
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500/50 transition-colors"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newPlaylistName.trim()) {
                                  createPlaylist(newPlaylistName);
                                  setIsCreatingPlaylist(false);
                                  setNewPlaylistName("");
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                if (newPlaylistName.trim()) {
                                  createPlaylist(newPlaylistName);
                                  setIsCreatingPlaylist(false);
                                  setNewPlaylistName("");
                                }
                              }}
                              disabled={!newPlaylistName.trim()}
                              className="px-3 py-2 bg-pink-600 active:bg-pink-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                              Guardar
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      {playlists.map(playlist => (
                        <button 
                          key={playlist.id}
                          onClick={() => {
                            if (playlist.tracks.length > 0) {
                              setKaraokeQueue(playlist.tracks);
                              setActiveTab("queue");
                              handlePlayTrack(playlist.tracks[0]);
                            }
                          }}
                          className="h-20 md:h-24 rounded-xl bg-gradient-to-br from-purple-900/40 to-pink-900/20 p-3 md:p-4 flex flex-col justify-end items-start active:scale-[1.02] active:scale-95 transition-all shadow-md overflow-hidden relative group text-left border border-pink-500/10 active:border-pink-500/30"
                        >
                          <div className="absolute inset-0 bg-black/40 group-active:bg-black/20 transition-colors" />
                          <span className="text-xs md:text-sm font-black text-white relative z-10 leading-tight drop-shadow-md">
                            {playlist.name}
                          </span>
                          <span className="text-[10px] text-pink-400 relative z-10 mt-1 font-bold">{playlist.tracks.length} pistas preparadas</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Favorites Inline */}
                  <div className="space-y-3 relative z-10">
                    <h4 className="text-[10px] md:text-xs font-black text-pink-500/80 uppercase tracking-widest pl-1 flex items-center gap-2">
                      <Heart className="w-3 h-3 fill-current" /> Pistas Favoritas
                    </h4>
                    {favoriteTracks.length > 0 ? (
                      <div className="space-y-2">
                        {favoriteTracks.map((track) => (
                          <div key={`fav-${track.id}`} className="w-full flex items-center gap-3 p-2 bg-white/5 active:bg-white/10 rounded-xl transition-all text-left group border border-transparent active:border-pink-500/20">
                            <button
                              onClick={() => handlePlayTrack(track)}
                              className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0"
                            >
                              <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity">
                                <Play className="w-4 h-4 text-white fill-current" />
                              </div>
                            </button>
                            
                            <div className="flex-1 min-w-0">
                              <button 
                                onClick={() => handlePlayTrack(track)}
                                className="w-full text-left focus:outline-none"
                              >
                                <p className="text-xs font-bold text-white line-clamp-1 leading-snug group-active:text-emerald-400 transition-colors">
                                  {track.title}
                                </p>
                              </button>
                            </div>

                            <button
                              onClick={(e) => toggleFavorite(track, e)}
                              className="p-2 active:bg-white/10 rounded-lg text-pink-500 transition-all shrink-0 active:scale-90"
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </button>
                            
                            <button 
                              onClick={(e) => { e.stopPropagation(); setTrackForPlaylist(track); }}
                              className="p-2 active:bg-white/10 rounded-lg text-slate-400 active:text-white transition-all shrink-0 active:scale-90"
                              title="Añadir a Playlist"
                            >
                              <ListPlus className="w-4 h-4" />
                            </button>
                            
                            <button 
                              onClick={(e) => handleAddToQueue(track, e)}
                              className="p-2 active:bg-emerald-500/20 rounded-lg text-slate-400 active:text-emerald-400 transition-all shrink-0 active:scale-90"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-white/5 rounded-xl border border-white/5">
                        <Heart className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 mb-2">Aún no tienes pistas favoritas para cantar</p>
                      </div>
                    )}
                  </div>

                  {/* Recents */}
                  {recentTracks.length > 0 && (
                    <div className="space-y-3 relative z-10">
                      <h4 className="text-[10px] md:text-xs font-black text-pink-500/80 uppercase tracking-widest pl-1">Cantado Recientemente</h4>
                      <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar no-scrollbar">
                        {recentTracks.map(track => (
                          <div key={`recent-${track.id}`} className="w-28 shrink-0 group">
                            <button 
                              onClick={() => handlePlayTrack(track)}
                              className="w-28 h-28 rounded-xl overflow-hidden relative mb-2 shadow-md border border-white/5 group-active:border-pink-500/30 transition-colors"
                            >
                              <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity">
                                <Mic className="w-8 h-8 text-pink-400 drop-shadow-lg" />
                              </div>
                            </button>
                            <p className="text-xs font-bold text-white line-clamp-2 leading-snug active:text-pink-400 cursor-pointer transition-colors" onClick={() => handlePlayTrack(track)}>
                              {track.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "queue" && (
                <motion.div
                  key="queue-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3 relative z-10"
                >
                  {karaokeQueue.length > 0 ? (
                    karaokeQueue.map((track, idx) => (
                      <div key={`${track.id}-${idx}`} className="w-full flex items-center gap-3 p-2.5 bg-white/5 active:bg-white/10 rounded-xl transition-all text-left group">
                        <div className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0">
                          <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center font-bold text-xs text-white">
                            #{idx + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white line-clamp-1">{track.title}</p>
                          <p className="text-[9px] text-emerald-400 font-semibold mt-0.5">Siguiente pista</p>
                        </div>
                        <button 
                          onClick={(e) => handleRemoveFromQueue(idx, e)}
                          className="p-2 active:bg-red-500/20 rounded-lg text-slate-400 active:text-red-400 transition-all shrink-0"
                          title="Eliminar de la cola"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 flex flex-col items-center justify-center opacity-50 space-y-3">
                       <ListMusic className="w-10 h-10 text-slate-500" />
                       <p className="text-xs font-semibold text-slate-400">La cola está vacía.</p>
                       <p className="text-[10px] text-slate-500">Busca canciones y agrégalas para cantar continuamente.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Track Selection for Playlist Modal */}
          <AnimatePresence>
            {trackForPlaylist && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => setTrackForPlaylist(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-[#09090b] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ListPlus className="w-4 h-4 text-emerald-400" /> Añadir a Playlist
                    </h3>
                    <button onClick={() => setTrackForPlaylist(null)} className="text-slate-400 active:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="p-4 max-h-60 overflow-y-auto custom-scrollbar">
                    {playlists.length > 0 ? (
                      <div className="space-y-2">
                        {playlists.map(p => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setPlaylists(prev => prev.map(list => {
                                if (list.id === p.id && !list.tracks.some((t: any) => t.id === trackForPlaylist.id)) {
                                  return { ...list, tracks: [...list.tracks, trackForPlaylist] };
                                }
                                return list;
                              }));
                              setTrackForPlaylist(null);
                            }}
                            className="w-full flex items-center justify-between p-3 rounded-xl active:bg-white/5 transition-all group"
                          >
                            <span className="text-sm font-bold text-white group-active:text-emerald-400 transition-colors">{p.name}</span>
                            <span className="text-xs text-slate-500">{p.tracks.length} pistas</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">No has creado ninguna playlist aún.</p>
                    )}
                  </div>
                  
                  <div className="p-4 border-t border-white/10 bg-black/20">
                    <AnimatePresence mode="wait">
                      {isCreatingPlaylist ? (
                        <motion.div
                          key="create-form"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-col gap-2 overflow-hidden"
                        >
                          <input
                            type="text"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            placeholder="Nombre de sesión..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500/50 transition-colors"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newPlaylistName.trim()) {
                                const newId = Date.now().toString();
                                setPlaylists(prev => [...prev, { id: newId, name: newPlaylistName.trim(), tracks: [trackForPlaylist] }]);
                                setTrackForPlaylist(null);
                                setIsCreatingPlaylist(false);
                                setNewPlaylistName("");
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setIsCreatingPlaylist(false);
                                setNewPlaylistName("");
                              }}
                              className="flex-1 px-3 py-2 bg-white/5 active:bg-white/10 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => {
                                if (newPlaylistName.trim()) {
                                  const newId = Date.now().toString();
                                  setPlaylists(prev => [...prev, { id: newId, name: newPlaylistName.trim(), tracks: [trackForPlaylist] }]);
                                  setTrackForPlaylist(null);
                                  setIsCreatingPlaylist(false);
                                  setNewPlaylistName("");
                                }
                              }}
                              disabled={!newPlaylistName.trim()}
                              className="flex-1 px-3 py-2 bg-pink-600 active:bg-pink-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                              Guardar
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.button 
                          key="create-btn"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => {
                            setIsCreatingPlaylist(true);
                            setNewPlaylistName("");
                          }}
                          className="w-full py-2.5 bg-pink-500/10 active:bg-pink-500/20 text-pink-400 font-bold text-xs rounded-xl transition-all"
                        >
                          + Crear nueva sesión
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

      {/* Voice Settings Panel (Floating Overlay at Root Level for complete z-index safety) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-20 right-4 lg:right-[396px] z-50 w-72 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                <Mic className="w-4 h-4" /> Configuración de Voz
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 active:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={toggleMic}
              className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all mb-4 ${micEnabled ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-white active:bg-white/10 border border-white/10'}`}
            >
              {micEnabled ? '🎤 MICRÓFONO ACTIVO' : '🎤 ACTIVAR MICRÓFONO'}
            </button>
            
            <div className={`space-y-4 transition-opacity ${micEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  <span>Volumen Mic</span>
                  <span>{micVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={micVolume}
                  onChange={(e) => setMicVolume(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Karaoke Player (Absolutely positioned over Header and Left Area, providing much more height!) */}
      <AnimatePresence>
        {currentTrack && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed inset-0 lg:absolute lg:inset-y-0 lg:left-0 lg:right-[380px] z-[99999] lg:z-30 flex flex-col overflow-hidden bg-black" 
            onClick={handlePlayerScreenTouch}
          >
            {/* CSS custom floating keyframes */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes orb-float-1 {
                0% { transform: translate(0px, 0px) scale(1); }
                33% { transform: translate(40px, -60px) scale(1.15); }
                66% { transform: translate(-30px, 30px) scale(0.9); }
                100% { transform: translate(0px, 0px) scale(1); }
              }
              @keyframes orb-float-2 {
                0% { transform: translate(0px, 0px) scale(1); }
                50% { transform: translate(-50px, 50px) scale(1.2); }
                100% { transform: translate(0px, 0px) scale(1); }
              }
              @keyframes orb-float-3 {
                0% { transform: translate(0px, 0px) scale(1.1); }
                50% { transform: translate(60px, -30px) scale(0.85); }
                100% { transform: translate(0px, 0px) scale(1.1); }
              }
              @keyframes orb-float-4 {
                0% { transform: translate(0px, 0px) scale(0.9); }
                50% { transform: translate(-30px, -40px) scale(1.15); }
                100% { transform: translate(0px, 0px) scale(0.9); }
              }
              .animate-orb-1 { animation: orb-float-1 22s infinite ease-in-out; }
              .animate-orb-2 { animation: orb-float-2 18s infinite ease-in-out; }
              .animate-orb-3 { animation: orb-float-3 20s infinite ease-in-out; }
              .animate-orb-4 { animation: orb-float-4 16s infinite ease-in-out; }
            `}} />

            {/* Dynamic theme elements */}
            {(() => {
              const theme = getDynamicTheme(currentTrack.title);
              return (
                <>
                  {/* Immersive animated background layer */}
                  <div className={`absolute inset-0 bg-gradient-to-tr ${theme.base} transition-all duration-1000 z-0 overflow-hidden ${lyricsState === 'not_found' ? 'opacity-40' : 'opacity-100'}`}>
                    {/* Floating liquid orbs of light (Apple Music/Singa style) */}
                    <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full ${theme.orb1} blur-[120px] animate-orb-1 pointer-events-none transition-all duration-1000`} />
                    <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full ${theme.orb2} blur-[120px] animate-orb-2 pointer-events-none transition-all duration-1000`} />
                    <div className={`absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full ${theme.orb3} blur-[120px] animate-orb-3 pointer-events-none transition-all duration-1000`} />
                    <div className={`absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] rounded-full ${theme.orb4} blur-[120px] animate-orb-4 pointer-events-none transition-all duration-1000`} />
                    
                    {/* Interactive scanning CRT scanline lines for cool retro vibes */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[length:100%_4px,_3px_100%] pointer-events-none opacity-40" />
                  </div>
                  {/* Ambient Glow Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-b ${theme.overlay} pointer-events-none z-10 ${lyricsState === 'not_found' ? 'opacity-50' : 'opacity-100'}`} />
                </>
              );
            })()}

            {/* Immersive Video/Lyrics container */}
            <div className="flex-1 relative w-full h-full overflow-hidden flex flex-col items-center justify-center z-20">
              
              {/* Background player (Visible if lyrics not found, invisible otherwise) */}
              <div className={`absolute inset-0 z-0 overflow-hidden bg-black transition-opacity duration-1000 ${lyricsState === 'not_found' ? 'opacity-100' : 'opacity-[0.01] pointer-events-none'}`}>
                {/* When lyrics are not found, we show the full video to not crop YouTube's built-in karaoke lyrics. Otherwise, we oversize it to hide YouTube branding. */}
                <div className={`absolute pointer-events-none transition-all duration-700 ${lyricsState === 'not_found' ? 'w-full h-full left-0 top-0' : 'w-[124%] h-[124%] left-[-12%] top-[-12%]'}`}>
                  <ReactPlayer
                    ref={reactPlayerRef}
                    url={`https://www.youtube.com/watch?v=${currentTrack.id}`}
                    playing={isPlaying}
                    onProgress={(p) => setCurrentTime(p.playedSeconds)}
                    onEnded={handlePlayNextInQueue}
                    onReady={() => { 
                      setIsPlayerReady(true); 
                      setIsBuffering(false); 
                      if (expectedPlayingRef.current && reactPlayerRef.current) {
                        try {
                          const intPlayer = reactPlayerRef.current.getInternalPlayer();
                          if (intPlayer && typeof intPlayer.playVideo === "function") {
                            intPlayer.playVideo();
                          }
                        } catch(e) {}
                      }
                    }}
                    onBuffer={() => setIsBuffering(true)}
                    onBufferEnd={() => {
                      setIsBuffering(false);
                      if (expectedPlayingRef.current && reactPlayerRef.current) {
                        try {
                          const intPlayer = reactPlayerRef.current.getInternalPlayer();
                          if (intPlayer && typeof intPlayer.playVideo === "function") {
                            intPlayer.playVideo();
                          }
                        } catch(e) {}
                      }
                    }}
                    controls={false}
                    width="100%"
                    height="100%"
                    style={{ pointerEvents: 'none' }}
                    config={{
                      youtube: {
                        playerVars: { 
                          modestbranding: 1, 
                          rel: 0, 
                          showinfo: 0, 
                          iv_load_policy: 3, 
                          fs: 0,
                          cc_load_policy: 0,
                          controls: 0,
                          disablekb: 1,
                          autohide: 1,
                          playsinline: 1
                        }
                      }
                    }}
                  />
                </div>
                
                {/* Top and Bottom solid black gradient masks to completely block any remaining watermark or overlays */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black via-black/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black via-black/95 to-transparent z-10 pointer-events-none" />
              </div>

              {/* Unified Premium Sincronización / Loading Glass Screen */}
              {lyricsState === "loading" && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-45 flex flex-col items-center justify-center p-6 text-center">
                  <div className="relative mb-6">
                    {/* Double pulsing neon circle loader representing sync alignment */}
                    <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping" />
                    <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin flex items-center justify-center">
                      <Mic className="w-6 h-6 text-emerald-400 animate-bounce" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 mb-2">Alineando Escenario</h3>
                  <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed mb-6">
                    Sincronizando pistas de karaoke y letras inteligentes...
                  </p>
                  <button 
                    onClick={() => setCurrentTrack(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 active:bg-white/20 active:scale-95 text-white text-xs font-bold rounded-full transition-all backdrop-blur-md"
                  >
                    <ChevronLeft className="w-4 h-4" /> Cancelar
                  </button>
                </div>
              )}

              {/* Immersive Overlay Screen controls (Responsive Touch-aware overlay like YouTube / Singa) */}
              <AnimatePresence>
                {showMobileControls && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 z-30 flex flex-col justify-between p-4 md:p-6"
                    onClick={(e) => e.stopPropagation() /* Prevent double toggle when clicking buttons */}
                  >
                    {/* Top Header Bar inside active player */}
                    <div className="flex items-center justify-between w-full">
                      <button 
                        onClick={() => setCurrentTrack(null)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 active:bg-white/20 active:scale-95 text-white text-xs font-bold rounded-full transition-all backdrop-blur-md"
                      >
                        <ChevronLeft className="w-4 h-4" /> Volver
                      </button>
                      
                      <div className="text-center max-w-[50%] truncate">
                        <p className="text-[10px] uppercase font-black tracking-widest text-emerald-400">Sonando Ahora</p>
                        <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                          className={`p-2 rounded-full transition-all shrink-0 ${showSettings ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white active:bg-white/25'}`}
                          title="Configuración de Voz"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleMic(); }}
                          className={`p-2 rounded-full transition-all ${micEnabled ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/10 text-white active:bg-white/25'}`}
                          title={micEnabled ? "Desactivar Mic" : "Activar Mic"}
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Large Center Play/Pause button */}
                    <div className="flex items-center justify-center gap-6">
                      <button 
                        onClick={() => { setIsPlaying(!isPlaying); expectedPlayingRef.current = !isPlaying; }}
                        className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-emerald-500 active:bg-emerald-400 active:scale-95 text-black rounded-full transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                      >
                        {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 ml-1 fill-current" />}
                      </button>

                      {karaokeQueue.length > 0 && (
                        <button 
                          onClick={handlePlayNextInQueue}
                          className="w-12 h-12 flex items-center justify-center bg-white/15 active:bg-white/25 active:scale-95 text-white rounded-full transition-all backdrop-blur-md"
                          title="Saltar pista"
                        >
                          <SkipForward className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Bottom Info & Stats Bar */}
                    <div className="flex items-center justify-between w-full text-slate-400 text-[10px] md:text-xs font-bold bg-white/5 p-2 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <Music className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pista Karaoke Directa</span>
                      </div>
                      {karaokeQueue.length > 0 ? (
                        <span className="text-emerald-400">Siguiente en cola: {karaokeQueue[0].title.substring(0, 20)}...</span>
                      ) : (
                        <span>Cola vacía</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Lyrics Layer (Guaranteed centered, safe from overlapping) */}
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none px-4 md:px-8 py-16">
                {lyricsState === "loading" && (
                  <div className="text-base md:text-xl font-bold text-white/70 animate-pulse bg-black/50 border border-white/5 px-6 py-3 rounded-full backdrop-blur-md">
                    Buscando letras inteligentes...
                  </div>
                )}
                {lyricsState === "found" && Array.isArray(lyrics) && (
                  <div className="w-full max-w-4xl flex flex-col items-center justify-center space-y-4 md:space-y-6">
                    
                    {(() => {
                      const activeIndex = lyrics.findIndex((l, i) => l.time <= currentTime && (!lyrics[i+1] || lyrics[i+1].time > currentTime));
                      return lyrics.map((line, idx) => {
                        const isActive = idx === activeIndex;
                        const isPast = idx < activeIndex;
                        
                        if (idx < activeIndex - 1 || idx > activeIndex + 2) return null;
                        return (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ 
                              opacity: isActive ? 1 : isPast ? 0.35 : 0.6, 
                              y: 0,
                              scale: isActive ? 1.05 : 0.98
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`w-full max-w-[95vw] text-center font-black transition-all duration-300 drop-shadow-2xl px-2 leading-tight break-words ${
                              isActive 
                                ? 'text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-emerald-400' 
                                : 'text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white/80'
                            }`}
                            style={{ 
                              textShadow: isActive 
                                ? '0 0 15px rgba(16,185,129,0.7), 0 2px 8px rgba(0,0,0,0.9)' 
                                : '0 2px 8px rgba(0,0,0,0.9)' 
                            }}
                          > 
                             {line.text}
                          </motion.div>
                        );
                      });
                    })()}
                  </div>
                )}
                {lyricsState === "found" && typeof lyrics === "string" && (
                  <div className="w-full max-w-2xl h-[55%] relative overflow-hidden bg-black/50 backdrop-blur-md rounded-2xl p-6 border border-white/10 pointer-events-auto">
                     <div className="absolute inset-0 overflow-y-auto p-4 text-center font-bold text-sm sm:text-base md:text-xl text-white/90 whitespace-pre-line leading-relaxed custom-scrollbar">
                        {lyrics}
                     </div>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Microphone Permission Modal */}
      <AnimatePresence>
        {micPermissionError && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl text-center overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setMicPermissionError(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 active:text-white bg-zinc-900/50 active:bg-zinc-900 transition-all border border-zinc-800/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div className="relative w-16 h-16 mx-auto mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                <Mic className="w-8 h-8 text-emerald-400 animate-pulse" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-black uppercase tracking-wider text-emerald-400 mb-4">
                Acceso al Micrófono
              </h3>

              {/* Description */}
              <p className="text-xs text-zinc-300 leading-relaxed mb-6 font-medium text-left md:text-center">
                Para cantar con micrófono y disfrutar del efecto de eco en tiempo real, el navegador requiere acceso de audio.
                <br /><br />
                Por privacidad y para evitar que el navegador te moleste con alertas automáticas al entrar, hemos desactivado la solicitud al cargar la app.
                <br /><br />
                Para activarlo ahora de forma segura y limpia, abre la app en una pestaña nueva, donde podrás conceder permiso únicamente en este momento.
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    window.open(window.location.href, "_blank");
                    setMicPermissionError(false);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 active:bg-emerald-400 text-black font-black uppercase tracking-wider text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-95 cursor-pointer"
                >
                  Abrir en pestaña nueva y cantar
                </button>
                <button
                  onClick={() => setMicPermissionError(false)}
                  className="w-full py-3 rounded-2xl bg-zinc-900 active:bg-zinc-800 border border-zinc-800 text-zinc-300 active:text-white font-bold uppercase tracking-wider text-xs transition-all cursor-pointer"
                >
                  Seguir escuchando música
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FluxKaraoke;
