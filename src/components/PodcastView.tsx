import React, { useState, useEffect, useRef } from 'react';
import { Mic, Search, Play, Pause, Loader2, ChevronLeft, ChevronDown, Headphones, Radio, Heart, Bookmark, Library, Clock, CheckCircle } from 'lucide-react';
import { useFirebase } from "./FirebaseProvider";
import { getDoc, setDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface Podcast {
  id: number;
  name: string;
  artist: string;
  imageUrl: string;
  feedUrl: string;
  genres: string[];
  episodeCount?: number;
}

interface Episode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration?: string;
  pubDate?: string;
  imageUrl?: string;
}

interface LikedEpisode {
  episode: Episode;
  podcastContext: { name: string; artist: string; imageUrl: string; feedUrl: string };
  likedAt: number;
}

const CATEGORIES = [
  "Fitness y Entrenamiento",
  "Salud y Bienestar",
  "Motivación Diaria",
  "Correr y Running",
  "Nutrición",
  "Mindfulness",
  "Emprendimiento",
  "Comedia y Entretenimiento"
];

export const PodcastView = ({ isVisible, pauseBackgroundMusic }: { isVisible: boolean, pauseBackgroundMusic: () => void }) => {
  const [activeTab, setActiveTab] = useState<"explore" | "library" | "liked">("explore");
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [activeCategory, setActiveCategory] = useState("Fitness y Entrenamiento");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  // Persistence State
  const [savedPodcasts, setSavedPodcasts] = useState<Podcast[]>([]);
  const [likedEpisodes, setLikedEpisodes] = useState<LikedEpisode[]>([]);
  const [episodeProgress, setEpisodeProgress] = useState<Record<string, number>>({});
  const [completedEpisodes, setCompletedEpisodes] = useState<string[]>([]);

  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getDurationSeconds = (durationStr?: string | number) => {
    if (!durationStr) return 0;
    let totalSeconds = 0;
    if (typeof durationStr === 'number') {
      totalSeconds = durationStr;
    } else if (typeof durationStr === 'string') {
       if (durationStr.includes(':')) {
           const parts = durationStr.split(':').map(Number);
           if (parts.length === 3) {
               totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
           } else if (parts.length === 2) {
               totalSeconds = parts[0] * 60 + parts[1];
           }
       } else {
           totalSeconds = parseInt(durationStr, 10);
       }
    }
    return isNaN(totalSeconds) ? 0 : totalSeconds;
  };

  const formatDuration = (durationStr?: string | number) => {
    const totalSeconds = getDurationSeconds(durationStr);
    if (totalSeconds <= 0) return durationStr || "";
    
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    
    if (h > 0) {
      return `${h} h ${m} min`;
    }
    return `${m} min`;
  };

  // Audio player state
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { user } = useFirebase();
  const currentEpisodeRef = useRef(currentEpisode);
  useEffect(() => { currentEpisodeRef.current = currentEpisode; }, [currentEpisode]);
  const activePodcastRef = useRef(selectedPodcast);
  useEffect(() => { activePodcastRef.current = selectedPodcast; }, [selectedPodcast]);

  useEffect(() => {
    if (isVisible && !selectedPodcast && activeTab === "explore") {
      searchPodcasts(activeCategory);
    }
  }, [isVisible, activeCategory, activeTab]);

  // Cloud Sync (Cross-Device) for Podcasts
  useEffect(() => {
    if (!user) return;

    const fetchCloudPodcastState = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.podcastState) {
            const localTs = parseInt(localStorage.getItem("gymapp_podcast_timestamp") || "0", 10);
            const cloudTs = data.podcastState.timestamp || 0;
            if (cloudTs > localTs) {
               localStorage.setItem("gymapp_podcast_timestamp", cloudTs.toString());
               if (data.podcastState.episode) {
                  localStorage.setItem("gymapp_podcast_current_episode", JSON.stringify(data.podcastState.episode));
                  setCurrentEpisode(data.podcastState.episode);
               }
               if (data.podcastState.podcastContext) {
                  localStorage.setItem("gymapp_podcast_current_context", JSON.stringify(data.podcastState.podcastContext));
                  setSelectedPodcast(data.podcastState.podcastContext);
               }
               if (data.podcastState.currentTime) {
                  setEpisodeProgress(prev => {
                     const updated = { ...prev, [data.podcastState.episode.id]: data.podcastState.currentTime };
                     localStorage.setItem("gymapp_podcast_progress", JSON.stringify(updated));
                     return updated;
                  });
                  // If audio initialized, force time update
                  if (audioRef.current) {
                    audioRef.current.currentTime = data.podcastState.currentTime;
                  }
               }
            }
          }
        }
      } catch (e) {}
    };
    fetchCloudPodcastState();

    const savePodcastCloudState = async () => {
       const ep = currentEpisodeRef.current;
       if (!ep) return;
       const now = Date.now();
       localStorage.setItem("gymapp_podcast_timestamp", now.toString());
       try {
         await updateDoc(doc(db, "users", user.uid), {
            podcastState: {
               episode: ep,
               podcastContext: activePodcastRef.current,
               currentTime: audioRef.current?.currentTime || 0,
               timestamp: now
            }
         });
       } catch(e) {}
    };

    const handleVisibility = () => {
       if (document.hidden) savePodcastCloudState();
    };

    window.addEventListener("beforeunload", savePodcastCloudState);
    document.addEventListener("visibilitychange", handleVisibility);
    
    return () => {
       window.removeEventListener("beforeunload", savePodcastCloudState);
       document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user]);

  useEffect(() => {
    // Load persisted data
    try {
      const sp = localStorage.getItem("gymapp_podcast_library");
      if (sp) setSavedPodcasts(JSON.parse(sp));
      
      const le = localStorage.getItem("gymapp_podcast_liked");
      if (le) setLikedEpisodes(JSON.parse(le));
      
      const ep = localStorage.getItem("gymapp_podcast_progress");
      if (ep) setEpisodeProgress(JSON.parse(ep));

      const ce = localStorage.getItem("gymapp_podcast_completed");
      if (ce) setCompletedEpisodes(JSON.parse(ce));

      const savedCurEp = localStorage.getItem("gymapp_podcast_current_episode");
      if (savedCurEp) setCurrentEpisode(JSON.parse(savedCurEp));

      const savedCurCtx = localStorage.getItem("gymapp_podcast_current_context");
      if (savedCurCtx) setSelectedPodcast(JSON.parse(savedCurCtx));

    } catch(e) {}

    // Ensure we have an audio element
    if (!audioRef.current) {
      const audio = new Audio();
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('ended', () => setIsPlaying(false));
      
      let lastSave = 0;
      audio.addEventListener('timeupdate', () => {
        const current = audio.currentTime;
        const duration = audio.duration || 0;
        setAudioCurrentTime(current);
        setAudioDuration(duration);
        if (current - lastSave > 5) {
          lastSave = current;
          const currentEpId = audioRef.current?.getAttribute('data-episode-id');
          if (currentEpId) {
             setEpisodeProgress(prev => {
                const updated = { ...prev, [currentEpId]: current };
                localStorage.setItem("gymapp_podcast_progress", JSON.stringify(updated));
                return updated;
             });

             // Auto-mark as completed if > 90% of actual audio duration
             if (duration > 0 && current >= duration * 0.9) {
                setCompletedEpisodes(prevce => {
                  if (!prevce.includes(currentEpId)) {
                    const updated = [...prevce, currentEpId];
                    localStorage.setItem("gymapp_podcast_completed", JSON.stringify(updated));
                    return updated;
                  }
                  return prevce;
                });
             }
          }
        }
      });
      audio.addEventListener('loadedmetadata', () => {
        setAudioDuration(audio.duration || 0);
      });

      audioRef.current = audio;
    }
    // Note: Do not pause and unmount audio globally here because PodcastView stays mounted inside GymMusicPlayer (just hidden) 
    // unless really destroyed. Actually keeping it playing in background is fine, GymMusicPlayer handles muting.
  }, []);

  // Update audio src if currentEpisode changes and isn't loaded yet
  useEffect(() => {
     if (currentEpisode && audioRef.current) {
        if (audioRef.current.getAttribute('data-episode-id') !== currentEpisode.id) {
           audioRef.current.setAttribute('data-episode-id', currentEpisode.id);
           audioRef.current.src = currentEpisode.audioUrl;
           
           // Restore progress from local storage instantly
           let progress = episodeProgress[currentEpisode.id];
           if (!progress) {
             try {
               const saved = localStorage.getItem("gymapp_podcast_progress");
               if (saved) {
                 const parsed = JSON.parse(saved);
                 progress = parsed[currentEpisode.id];
               }
             } catch(e){}
           }
           
           if (progress) {
             const setTimeAndRemoveListener = () => {
                 if (audioRef.current && Number.isFinite(progress)) {
                     audioRef.current.currentTime = progress;
                 }
                 audioRef.current?.removeEventListener('loadedmetadata', setTimeAndRemoveListener);
             };
             audioRef.current.addEventListener('loadedmetadata', setTimeAndRemoveListener);
           }
        }
     }
  }, [currentEpisode]);

  const searchPodcasts = async (query: string) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/podcasts/search?term=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Error en la búsqueda");
      const data = await res.json();
      setPodcasts(data);
    } catch (err: any) {
      setError("No pudimos cargar los podcasts. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveCategory("");
      searchPodcasts(searchQuery);
    }
  };

  const loadEpisodes = async (podcast: Podcast) => {
    setSelectedPodcast(podcast);
    setIsLoadingEpisodes(true);
    setEpisodes([]);
    setError("");
    try {
      const res = await fetch(`/api/podcasts/episodes?feedUrl=${encodeURIComponent(podcast.feedUrl)}`);
      if (!res.ok) throw new Error("Error obteniendo los episodios");
      const data = await res.json();
      setEpisodes(Array.isArray(data) ? data.slice().reverse() : []);
    } catch (err: any) {
      setError("No pudimos cargar los episodios.");
    } finally {
      setIsLoadingEpisodes(false);
    }
  };

  const playEpisode = (episode: Episode, forcePodcastCtx?: Podcast | null) => {
    if (currentEpisode?.id === episode.id) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        pauseBackgroundMusic();
        audioRef.current?.play();
      }
      return;
    }

    pauseBackgroundMusic();
    setCurrentEpisode(episode);
    if (audioRef.current) {
      audioRef.current.setAttribute('data-episode-id', episode.id);
      audioRef.current.src = episode.audioUrl;
      
      // Restore progress if explicitly tracked
      setEpisodeProgress(prev => {
        const progress = prev[episode.id];
        if (progress && audioRef.current) {
          audioRef.current.currentTime = progress;
        }
        return prev;
      });

      audioRef.current.play();
    }
  };

  const toggleSavePodcast = (podcast: Podcast, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedPodcasts(prev => {
      const isSaved = prev.some(p => p.feedUrl === podcast.feedUrl);
      const updated = isSaved ? prev.filter(p => p.feedUrl !== podcast.feedUrl) : [podcast, ...prev];
      localStorage.setItem("gymapp_podcast_library", JSON.stringify(updated));
      return updated;
    });
  };

  const toggleLikeEpisode = (episode: Episode, ctxPodcast: Podcast | null | {name: string, artist: string, imageUrl: string, feedUrl: string}, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedEpisodes(prev => {
      const isLiked = prev.some(l => l.episode.id === episode.id);
      let updated;
      if (isLiked) {
         updated = prev.filter(l => l.episode.id !== episode.id);
      } else {
         const pctx = ctxPodcast || { name: "Podcast", artist: "Unknown", imageUrl: episode.imageUrl || "", feedUrl: "" };
         updated = [{ episode, podcastContext: pctx, likedAt: Date.now() }, ...prev];
      }
      localStorage.setItem("gymapp_podcast_liked", JSON.stringify(updated));
      return updated;
    });
  };

  const toggleEpisodeCompleted = (episodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedEpisodes(prev => {
      let updated;
      if (prev.includes(episodeId)) {
        updated = prev.filter(id => id !== episodeId);
      } else {
        updated = [...prev, episodeId];
      }
      localStorage.setItem("gymapp_podcast_completed", JSON.stringify(updated));
      return updated;
    });
  };

  if (!isVisible) return null;

  return (
    <div className="w-full h-full bg-[#050505] relative flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto premium-scrollbar pb-[150px] flex flex-col">
      {!selectedPodcast ? (
        <div className="flex flex-col gap-6 p-4 pt-6 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col items-start px-2 mb-2">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight flex items-center gap-3 mb-4">
              Podcasts <Radio className="w-6 h-6 text-emerald-400" />
            </h1>
            
            {/* Tabs */}
            <div className="flex gap-4 md:gap-6 border-b border-white/10 w-full mb-2 overflow-x-auto premium-scrollbar justify-start md:justify-start snap-x">
              <button 
                onClick={() => setActiveTab("explore")}
                className={`snap-start shrink-0 pb-3 text-sm md:text-base font-bold border-b-2 transition-all flex items-center gap-1.5 md:gap-2 ${activeTab === "explore" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-500 active:text-white"}`}
              >
                <Search className="w-4 h-4" /> Explorar
              </button>
              <button 
                onClick={() => setActiveTab("library")}
                className={`snap-start shrink-0 pb-3 text-sm md:text-base font-bold border-b-2 transition-all flex items-center gap-1.5 md:gap-2 ${activeTab === "library" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-500 active:text-white"}`}
              >
                <Library className="w-4 h-4" /> Biblioteca
              </button>
              <button 
                onClick={() => setActiveTab("liked")}
                className={`snap-start shrink-0 pb-3 text-sm md:text-base font-bold border-b-2 transition-all flex items-center gap-1.5 md:gap-2 ${activeTab === "liked" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-500 active:text-white"}`}
              >
                <Heart className="w-4 h-4" /> Favoritos
              </button>
            </div>
          </div>

          {activeTab === "explore" && (
            <>
              {/* Controls Container (Search + Categories) */}
              <div className="flex flex-col md:flex-row gap-3 px-2 mb-4">
                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="flex-1">
                  <div className="relative h-full">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar podcasts..."
                      className="w-full h-full bg-[#111113] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors shadow-sm"
                    />
                  </div>
                </form>

                {/* Categories Dropdown */}
                <div className="relative w-full md:w-[280px] shrink-0">
                  <select
                    value={activeCategory}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setSearchQuery("");
                      setActiveCategory(cat);
                      searchPodcasts(cat);
                    }}
                    className="w-full h-full appearance-none bg-[#111113] border border-white/5 rounded-2xl py-3.5 pl-4 pr-10 text-white font-bold focus:outline-none focus:border-emerald-500/50 transition-colors shadow-sm text-sm"
                  >
                    <option disabled value="">Explorar categorías...</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Podcast Grid */}
              <div className="px-2 mt-2">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  </div>
                ) : error ? (
                  <p className="text-red-400 text-center py-10 font-bold">{error}</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pb-20">
                    {podcasts.map(podcast => {
                      const isSaved = savedPodcasts.some(p => p.feedUrl === podcast.feedUrl);
                      return (
                      <div
                        key={podcast.id}
                        onClick={() => loadEpisodes(podcast)}
                        className="group bg-[#0b0b0d] border border-white/5 rounded-2xl p-3 cursor-pointer active:bg-[#151518] active:border-emerald-500/30 transition-all flex flex-col relative"
                      >
                        <button 
                          onClick={(e) => toggleSavePodcast(podcast, e)}
                          className={`absolute top-4 right-4 p-1.5 rounded-full z-10 transition-all ${isSaved ? "bg-emerald-500 text-white shadow-lg" : "bg-black/50 text-white active:bg-black/80"}`}
                        >
                          <Bookmark className={`w-3 h-3 ${isSaved ? "fill-current" : ""}`} />
                        </button>
                        <div className="relative">
                          <img
                            src={podcast.imageUrl}
                            alt={podcast.name}
                            className="w-full aspect-square rounded-xl object-cover mb-3 shadow-md group-active:scale-[1.02] transition-transform"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          {!!podcast.episodeCount && (
                            <span className="absolute bottom-5 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-300 pointer-events-none group-active:scale-[1.02] transition-transform">
                              {podcast.episodeCount} ePs.
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight mb-1 group-active:text-emerald-400 transition-colors">
                          {podcast.name}
                        </h3>
                        <p className="text-slate-500 text-xs line-clamp-1">{podcast.artist}</p>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "library" && (
            <div className="px-2 mt-2">
              {savedPodcasts.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center">
                  <Library className="w-12 h-12 text-slate-700 mb-4" />
                  <p className="text-slate-400 font-medium text-lg">Tu biblioteca está vacía.</p>
                  <p className="text-slate-500 text-sm mt-2">Guarda podcasts para acceder a ellos rápidamente.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pb-20">
                  {savedPodcasts.map(podcast => {
                    const isSaved = true;
                    return (
                    <div
                      key={podcast.feedUrl}
                      onClick={() => loadEpisodes(podcast)}
                      className="group bg-[#0b0b0d] border border-white/5 rounded-2xl p-3 cursor-pointer active:bg-[#151518] active:border-emerald-500/30 transition-all flex flex-col relative"
                    >
                      <button 
                        onClick={(e) => toggleSavePodcast(podcast, e)}
                        className={`absolute top-4 right-4 p-1.5 rounded-full z-10 transition-all ${isSaved ? "bg-emerald-500 text-white shadow-lg" : "bg-black/50 text-white active:bg-black/80"}`}
                      >
                        <Bookmark className={`w-3 h-3 ${isSaved ? "fill-current" : ""}`} />
                      </button>
                      <div className="relative">
                        <img
                          src={podcast.imageUrl}
                          alt={podcast.name}
                          className="w-full aspect-square rounded-xl object-cover mb-3 shadow-md group-active:scale-[1.02] transition-transform"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        {!!podcast.episodeCount && (
                          <span className="absolute bottom-5 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-300 pointer-events-none group-active:scale-[1.02] transition-transform">
                            {podcast.episodeCount} ePs.
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight mb-1 group-active:text-emerald-400 transition-colors">
                        {podcast.name}
                      </h3>
                      <p className="text-slate-500 text-xs line-clamp-1">{podcast.artist}</p>
                    </div>
                  )})}
                </div>
              )}
            </div>
          )}

          {activeTab === "liked" && (
            <div className="px-2 mt-2">
              {likedEpisodes.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center">
                  <Heart className="w-12 h-12 text-slate-700 mb-4" />
                  <p className="text-slate-400 font-medium text-lg">No tienes episodios guardados.</p>
                  <p className="text-slate-500 text-sm mt-2">Dale me gusta a episodios para escucharlos más tarde.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pb-20">
                  {likedEpisodes.map(({episode, podcastContext}) => {
                    const isThisPlaying = currentEpisode?.id === episode.id && isPlaying;
                    const progress = episodeProgress[episode.id];
                    const isLiked = true;
                    const durationSeconds = getDurationSeconds(episode.duration);
                    const isFinished = completedEpisodes.includes(episode.id) || (progress > 0 && durationSeconds > 0 && progress >= durationSeconds * 0.9);
                    return (
                      <div
                        key={episode.id}
                        className={`flex flex-col gap-2 p-3 md:p-4 rounded-2xl border transition-all ${
                          currentEpisode?.id === episode.id 
                            ? "bg-emerald-500/10 border-emerald-500/30" 
                            : isFinished
                              ? "bg-[#0b0b0d]/50 border-transparent active:border-emerald-500/20 opacity-60 active:opacity-100"
                              : "bg-[#0b0b0d] border-transparent active:border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0 cursor-pointer" onClick={() => playEpisode(episode, podcastContext as any)}>
                            <img 
                              src={episode.imageUrl || podcastContext.imageUrl} 
                              className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover shadow-sm bg-black/50" 
                              alt="" 
                              referrerPolicy="no-referrer"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            {isThisPlaying && (
                               <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                                  <Pause className="w-6 h-6 text-white" />
                               </div>
                            )}
                            {currentEpisode?.id === episode.id && !isPlaying && (
                               <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                                  <Play className="w-6 h-6 text-white ml-1" />
                               </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => playEpisode(episode, podcastContext as any)}>
                            <h4 className={`font-bold text-[13px] md:text-sm leading-tight line-clamp-2 mb-1 ${currentEpisode?.id === episode.id ? "text-emerald-400" : "text-white"}`}>
                              {episode.title}
                            </h4>
                            <p className="text-slate-400 text-xs mb-1 line-clamp-1">{podcastContext.name}</p>
                            <div className="flex items-center gap-2 text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                               {episode.pubDate && <span>{new Date(episode.pubDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</span>}
                               {episode.duration && <span>• {formatDuration(episode.duration)}</span>}
                               {progress > 0 && !isFinished && <span className="text-emerald-500 flex items-center gap-1"><Clock className="w-3 h-3"/></span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => toggleEpisodeCompleted(episode.id, e)}
                              className={`p-2.5 rounded-full transition-all shrink-0 ${isFinished ? "text-emerald-400 bg-emerald-500/10" : "text-slate-500 active:text-emerald-400"}`}
                              title={isFinished ? "Marcar como no escuchado" : "Marcar como escuchado"}
                            >
                              <CheckCircle className={`w-5 h-5 ${isFinished ? "fill-current" : ""}`} />
                            </button>
                            <button
                              onClick={(e) => toggleLikeEpisode(episode, podcastContext, e)}
                              className={`p-2.5 rounded-full transition-all shrink-0 ${isLiked ? "text-emerald-400 bg-emerald-500/10" : "text-slate-500 active:text-white"}`}
                            >
                              <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-slate-400 text-xs line-clamp-2 md:line-clamp-1 flex-1 pr-3" dangerouslySetInnerHTML={{ __html: episode.description }} />
                            <button
                              onClick={() => playEpisode(episode, podcastContext as any)}
                              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                                isThisPlaying
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-white/5 text-white active:bg-white/10"
                              }`}
                            >
                              {isThisPlaying ? <><Pause className="w-3 h-3" /> Pausar</> : <><Play className="w-3 h-3" /> Escuchar</>}
                            </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col p-4 pt-4 md:pt-6 max-w-4xl mx-auto w-full pb-20">
          <button
            onClick={() => setSelectedPodcast(null)}
            className="self-start flex items-center gap-2 text-slate-400 active:text-white transition-colors mb-4 md:mb-6 text-sm font-bold uppercase tracking-wider"
          >
            <ChevronLeft className="w-5 h-5" /> Volver
          </button>

          <div className="flex flex-row gap-4 md:gap-6 mb-4 items-center text-left bg-[#111113]/80 p-4 md:p-6 rounded-3xl border border-white/5 relative overflow-hidden">
             <div 
               className="absolute inset-0 opacity-20 blur-3xl rounded-3xl" 
               style={{ backgroundImage: `url(${selectedPodcast.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
             />
            <img
              src={selectedPodcast.imageUrl}
              alt={selectedPodcast.name}
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-36 md:h-36 rounded-2xl shadow-xl object-cover shrink-0 relative z-10"
              referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="flex-1 flex flex-col justify-center min-w-0 relative z-10">
              <h2 className="text-lg md:text-3xl font-black text-white mb-0.5 md:mb-2 line-clamp-2 leading-tight">{selectedPodcast.name}</h2>
              <p className="text-emerald-400 font-bold text-xs md:text-base mb-2 md:mb-4 line-clamp-1">{selectedPodcast.artist}</p>
              <div className="hidden sm:flex flex-wrap items-center gap-2 justify-start">
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-emerald-400">
                  {episodes.length} episodios
                </span>
                {selectedPodcast.genres.slice(0, 3).map(g => (
                  <span key={g} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-slate-300">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6 px-1">
             <button
                onClick={(e) => toggleSavePodcast(selectedPodcast, e)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all flex-1 md:flex-none justify-center ${
                   savedPodcasts.some(p => p.feedUrl === selectedPodcast.feedUrl)
                     ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                     : "bg-white/10 text-white active:bg-white/20"
                }`}
             >
                <Library className={`w-4 h-4 ${savedPodcasts.some(p => p.feedUrl === selectedPodcast.feedUrl) ? "fill-current" : ""}`} />
                {savedPodcasts.some(p => p.feedUrl === selectedPodcast.feedUrl) ? "En tu biblioteca" : "Guardar en biblioteca"}
             </button>
          </div>

          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 px-1">
            <Radio className="w-5 h-5 text-emerald-400" /> Episodios
          </h3>

          {isLoadingEpisodes ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : error ? (
             <p className="text-red-400 text-center py-10 font-bold">{error}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {episodes.map((episode, index) => {
                const isThisPlaying = currentEpisode?.id === episode.id && isPlaying;
                const progress = episodeProgress[episode.id];
                const isLiked = likedEpisodes.some(l => l.episode.id === episode.id);
                // Episodes are now sorted oldest to newest (1, 2, 3...)
                const episodeNumber = index + 1;
                const durationSeconds = getDurationSeconds(episode.duration);
                const isFinished = completedEpisodes.includes(episode.id) || (progress > 0 && durationSeconds > 0 && progress >= durationSeconds * 0.9);

                return (
                  <div
                    key={episode.id}
                    className={`flex flex-col gap-2 p-3 md:p-4 rounded-2xl border transition-all ${
                      currentEpisode?.id === episode.id 
                        ? "bg-emerald-500/10 border-emerald-500/30" 
                        : isFinished
                          ? "bg-[#0b0b0d]/50 border-transparent active:border-emerald-500/20 opacity-60 active:opacity-100"
                          : "bg-[#0b0b0d] border-transparent active:border-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-slate-500 font-black text-lg w-6 text-center shrink-0 hidden sm:block">
                        {episodeNumber}
                      </div>
                      <div className="relative shrink-0 cursor-pointer" onClick={() => playEpisode(episode, selectedPodcast)}>
                        <img 
                          src={episode.imageUrl || selectedPodcast.imageUrl} 
                          className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover shadow-sm bg-black/50" 
                          alt="" 
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        {isThisPlaying && (
                           <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                              <Pause className="w-6 h-6 text-white" />
                           </div>
                        )}
                        {currentEpisode?.id === episode.id && !isPlaying && (
                           <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                              <Play className="w-6 h-6 text-white ml-1" />
                           </div>
                        )}
                        <span className="absolute -top-2 -left-2 bg-slate-800 text-slate-300 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-slate-700 sm:hidden">
                          {episodeNumber}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => playEpisode(episode, selectedPodcast)}>
                        <h4 className={`font-bold text-[13px] md:text-sm leading-tight line-clamp-2 mb-1 ${currentEpisode?.id === episode.id ? "text-emerald-400" : "text-white"}`}>
                          {episode.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                           {episode.pubDate && <span>{new Date(episode.pubDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</span>}
                           {episode.duration && <span>• {formatDuration(episode.duration)}</span>}
                           {progress > 0 && !isFinished && <span className="text-emerald-500 flex items-center gap-1"><Clock className="w-3 h-3"/></span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => toggleEpisodeCompleted(episode.id, e)}
                          className={`p-2.5 rounded-full transition-all shrink-0 ${isFinished ? "text-emerald-400 bg-emerald-500/10" : "text-slate-500 active:text-emerald-400"}`}
                          title={isFinished ? "Marcar como no escuchado" : "Marcar como escuchado"}
                        >
                          <CheckCircle className={`w-5 h-5 ${isFinished ? "fill-current" : ""}`} />
                        </button>
                        <button
                          onClick={(e) => toggleLikeEpisode(episode, selectedPodcast, e)}
                          className={`p-2.5 rounded-full transition-all shrink-0 ${isLiked ? "text-emerald-400 bg-emerald-500/10" : "text-slate-500 active:text-white"}`}
                        >
                          <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-slate-400 text-xs line-clamp-2 md:line-clamp-1 flex-1 pr-3" dangerouslySetInnerHTML={{ __html: episode.description }} />
                        <button
                          onClick={() => playEpisode(episode, selectedPodcast)}
                          className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                            isThisPlaying
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-white/5 text-white active:bg-white/10"
                          }`}
                        >
                          {isThisPlaying ? <><Pause className="w-3 h-3" /> Pausar</> : <><Play className="w-3 h-3" /> Escuchar</>}
                        </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>

      {/* Mini Player Absolute at bottom inside this view */}
      {currentEpisode && (
        <div className="absolute bottom-0 left-0 right-0 bg-[#111113]/98 backdrop-blur-xl border-t border-white/5 p-2 flex flex-col z-[55] shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
          {/* Top Progress Bar for Compactness */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 group overflow-hidden">
             <div className="absolute top-0 left-0 bottom-0 bg-emerald-500 transition-all pointer-events-none" style={{ width: `${(audioCurrentTime / (audioDuration || 1)) * 100}%` }} />
             <input 
                 type="range" 
                 min="0" 
                 max={audioDuration || 100} 
                 value={audioCurrentTime} 
                 onChange={(e) => {
                   if (audioRef.current) {
                     audioRef.current.currentTime = Number(e.target.value);
                     setAudioCurrentTime(Number(e.target.value));
                   }
                 }}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
          </div>
          
          <div className="flex items-center gap-3 w-full px-2 pt-1.5 pb-0.5">
            {currentEpisode.imageUrl && (
              <img src={currentEpisode.imageUrl} className="w-10 h-10 rounded-md object-cover shadow-lg shrink-0" alt="" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Escuchando Ahora</p>
              <p className="text-white font-bold text-[13px] truncate leading-tight">{currentEpisode.title}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 font-mono hidden sm:block">
                {formatTime(audioCurrentTime)} / {formatTime(audioDuration)}
              </span>
              <button
                onClick={() => {
                  if (isPlaying) audioRef.current?.pause();
                  else audioRef.current?.play();
                }}
                className="w-10 h-10 bg-emerald-500 active:bg-emerald-400 rounded-full flex items-center justify-center text-white transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0 active:scale-95"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-1" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
