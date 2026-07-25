import { API_BASE_URL } from "../lib/constants";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  Settings2, 
  Heart,
  Plus,
  Share2,
  Volume2,
  RotateCcw,
  Radio,
  Users,
  Music,
  Tv,
  Sparkles,
  MoreHorizontal,
  X,
  Compass,
  ChevronRight
} from "lucide-react";
import { MusicTrack } from "../types";
import { selectNextDJTrack, FLUX_PAYOLA, DJ_GENRES, isReasonableTrack } from "../lib/djLogic";

interface FAIViewProps {
  favorites: MusicTrack[];
  topTracks: MusicTrack[];
  allTracks: MusicTrack[];
  onPlayTrack: (track: MusicTrack) => void;
  onTogglePlay: () => void;
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  onToggleFavorite?: (track: MusicTrack, e: React.MouseEvent) => void;
  volume?: number;
  onVolumeChange?: (val: number) => void;
  position?: number;
  duration?: number;
  triggerAiDj?: (context: string, force?: boolean) => void;
  isAdmin?: boolean;
}

const cleanTrackTitle = (title: string) => {
  return title.replace(/\[.*?\]|\(.*?\)|\- mix|mix \-|Mix|MIX|Audio Oficial|Official Video|Video Oficial|Lyric Video|Lyrics/gi, "").trim();
};

const extractArtist = (title: string, defaultArtist: string, d?: any) => {
  if (d && d.artist && !d.artist.includes("YouTube") && !d.artist.includes("Variado") && d.artist !== "Music") {
    return d.artist;
  }
  if (title.includes(" - ")) {
    return title.split(" - ")[0].trim();
  }
  if (d && d.channelTitle && !d.channelTitle.includes("YouTube")) {
    return d.channelTitle;
  }
  // Try to parse out anything before a hyphen or just use the title
  const parts = title.split("-");
  if (parts.length > 1) return parts[0].trim();

  // If we can't extract, we'll try to just return the clean title so at least they see something.
  return defaultArtist === "Variado" || defaultArtist === "La mezcla de Sofia" ? extractCleanTitle(title) : defaultArtist;
};

const extractCleanTitle = (title: string) => {
  let cleaned = cleanTrackTitle(title);
  
  // Remove "Mix" words so the user just sees the song/artist, preventing "Mix de Fulano"
  cleaned = cleaned.replace(/mix de\s+/gi, "");
  cleaned = cleaned.replace(/mix:\s+/gi, "");
  cleaned = cleaned.replace(/\bmix\b/gi, "");
  
  if (cleaned.includes(" - ")) {
    cleaned = cleaned.split(" - ").slice(1).join(" - ").trim();
  }
  return cleaned.trim() || title;
};

const cachedWelcomeText = "¡Qué pasa chavales! 🔥 Aquí Sofía DJ al mando de los platos. Os traigo un set que es puro fuego, ¡así que subid el volumen al máximo y que empiece el desmadre! ⚡️";


export const FAIView: React.FC<FAIViewProps> = ({
  favorites,
  topTracks,
  allTracks,
  onPlayTrack,
  onTogglePlay,
  currentTrack,
  isPlaying,
  onToggleFavorite,
  volume = 100,
  onVolumeChange,
  position = 0,
  duration = 0,
  triggerAiDj,
  isAdmin,
}) => {
  const [topRatio, setTopRatio] = useState(() => {
    const saved = localStorage.getItem("fai_top_ratio");
    return saved !== null ? parseInt(saved, 10) : 32;
  });
  const [favRatio, setFavRatio] = useState(() => {
    const saved = localStorage.getItem("fai_fav_ratio");
    return saved !== null ? parseInt(saved, 10) : 18;
  });
  const [discRatio, setDiscRatio] = useState(() => {
    const saved = localStorage.getItem("fai_disc_ratio");
    return saved !== null ? parseInt(saved, 10) : 50;
  });

  const [discoveryLevel, setDiscoveryLevel] = useState(() => {
    const saved = localStorage.getItem("fai_discovery_level");
    return saved ? parseInt(saved, 10) : 50;
  });
  const [genreExploration, setGenreExploration] = useState(() => {
    const saved = localStorage.getItem("fai_genre_exploration");
    return saved === null ? true : saved === "true";
  });
  const [selectedGenre, setSelectedGenre] = useState<string>(() => {
    return localStorage.getItem("fai_selected_genre") || "La mezcla de Sofia";
  });
  const [customGenre, setCustomGenre] = useState("");

  const [djMessage, setDjMessage] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showGenres, setShowGenres] = useState(false);
  const [isRadioActive, setIsRadioActive] = useState(false);
  const [genreBuffer, setGenreBuffer] = useState<MusicTrack[]>([]);
  const [triggerPlay, setTriggerPlay] = useState(false);

  // Auto-start welcome on mount if not yet played in session - DISABLED as per user request to play only on Play click
  /*
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!welcomePlayed && !isRadioActive) {
        handleStartWelcome();
      }
    }, 500); 
    return () => clearTimeout(timer);
  }, [welcomePlayed, isRadioActive]);
  */
  const [welcomePlayed, setWelcomePlayed] = useState(() => {
    return sessionStorage.getItem("flux_radio_welcome_played_session") === "true";
  });

  const [welcomeStep, setWelcomeStep] = useState<"idle" | "loading" | "speaking">("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeakingPaused, setIsSpeakingPaused] = useState(false);
  const [welcomePosition, setWelcomePosition] = useState(0);
  const [welcomeDuration, setWelcomeDuration] = useState(0);
  const [welcomeText, setWelcomeText] = useState(cachedWelcomeText);

  const isSpeakingRef = useRef(false);
  const isSearchingRef = useRef(false);
  const welcomeAudioRef = useRef<HTMLAudioElement | null>(null);
  const handleNextTrackRef = useRef<((isManualParam?: boolean, forceGenre?: string) => Promise<void>) | null>(null);
  const handleEndWelcomeRef = useRef<(() => void) | null>(null);
  const speechStartTimeRef = useRef<number>(0);
  const welcomeRequestIdRef = useRef<number>(0);

  const setSpeaking = (val: boolean) => {
    setIsSpeaking(val);
    isSpeakingRef.current = val;
  };

  useEffect(() => {
    return () => {
      welcomeRequestIdRef.current++;
      if (welcomeAudioRef.current) {
        welcomeAudioRef.current.pause();
        welcomeAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("fai_top_ratio", topRatio.toString());
  }, [topRatio]);

  useEffect(() => {
    localStorage.setItem("fai_fav_ratio", favRatio.toString());
  }, [favRatio]);

  useEffect(() => {
    localStorage.setItem("fai_disc_ratio", discRatio.toString());
    setDiscoveryLevel(discRatio);
  }, [discRatio]);

  useEffect(() => {
    localStorage.setItem("fai_discovery_level", discoveryLevel.toString());
  }, [discoveryLevel]);

  useEffect(() => {
    localStorage.setItem("fai_genre_exploration", genreExploration.toString());
  }, [genreExploration]);

  useEffect(() => {
    localStorage.setItem("fai_selected_genre", selectedGenre);
  }, [selectedGenre]);

  useEffect(() => {
    setGenreBuffer([]);
  }, [selectedGenre, genreExploration]);

  const showDJMessage = useCallback((message: string) => {
    // Visual message display is disabled to optimize resources as requested by the user.
  }, []);

  useEffect(() => {
    const handleDjMessage = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        showDJMessage(customEvent.detail);
      }
    };
    window.addEventListener("dj_message_received", handleDjMessage);
    return () => {
      window.removeEventListener("dj_message_received", handleDjMessage);
    };
  }, [showDJMessage]);

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    setGenreExploration(true);
    setShowGenres(false);
    setGenreBuffer([]);
    setTriggerPlay(true);
  };

  const handleNextTrack = useCallback(async (isManualParam = false, forceGenre?: string) => {
    if (isSpeakingRef.current || isSearchingRef.current) {
      if (isSpeakingRef.current) handleEndWelcomeRef.current?.();
      return;
    }
    isSearchingRef.current = true;
    const isManual = isManualParam === true;
    let next: MusicTrack | null = null;

    try {
      const activeGenre = forceGenre || selectedGenre;
      if (genreExploration && activeGenre !== "Variado Mix" && activeGenre !== "La mezcla de Sofia") {
      if (genreBuffer.length > 0) {
        next = genreBuffer[0];
        setGenreBuffer(prev => prev.slice(1));
      } else {
        // Fetch new buffer from YouTube Search for the genre to ensure real variety
        try {
          
          // Add random freshness modifier to make the genre query infinite and varied
          const freshnessModifiers = ["2024 playlist", "novedades", "exitos mix", "actual", "top hits", "tendencia", "mejores", "mix oficial"];
          const randomModifier = freshnessModifiers[Math.floor(Math.random() * freshnessModifiers.length)];
          const resp = await fetch(`${API_BASE_URL}/api/youtube/search?q=${encodeURIComponent(activeGenre + " " + randomModifier)}`);

          if (resp.ok) {
            const data = await resp.json();
            if (data && data.length > 0) {
              const playlists = data.filter((d: any) => d.isPlaylist).sort(() => Math.random() - 0.5);
              let foundTracks: MusicTrack[] = [];
              
              if (playlists.length > 0) {
                // Try up to 2 playlists to find tracks
                for (let i = 0; i < Math.min(2, playlists.length); i++) {
                  const pl = playlists[i];
                  const plResp = await fetch(`${API_BASE_URL}/api/youtube/playlist?id=${pl.id}`);
                  if (plResp.ok) {
                    const plData = await plResp.json();
                    const tracksArray = Array.isArray(plData) ? plData : (plData.tracks || []);
                    if (tracksArray && tracksArray.length > 0) {
                      foundTracks = tracksArray.map((d: any) => ({
                        id: d.id,
                        title: extractCleanTitle(d.title),
                        artist: extractArtist(d.title, activeGenre, d),
                        url: d.url || `https://www.youtube.com/watch?v=${d.id}`,
                        thumbnail_url: d.thumbnail || d.thumbnail_url || `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`,
                        duration: d.duration || "N/A"
                      })).filter((t: any) => isReasonableTrack(t.duration, t.title));
                      if (foundTracks.length > 0) break;
                    }
                  }
                }
              }

              if (foundTracks.length === 0) {
                // fallback to videos
                const validData = data.filter((d: any) => !d.isPlaylist && d.id && isReasonableTrack(d.duration, d.title));
                if (validData.length > 0) {
                   foundTracks = validData.map((d: any) => ({
                    id: d.id,
                    title: extractCleanTitle(d.title),
                    artist: extractArtist(d.title, activeGenre, d),
                    url: d.url || `https://www.youtube.com/watch?v=${d.id}`,
                    thumbnail_url: d.thumbnail || d.thumbnail_url || `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`,
                    duration: d.duration || "N/A"
                  }));
                }
              }

              if (foundTracks.length > 0) {
                // Filter out current track to ensure variety
                const filteredTracks = foundTracks.filter(t => t.id !== currentTrack?.id);
                const pool = filteredTracks.length > 0 ? filteredTracks : foundTracks;
                const shuffled = pool.sort(() => Math.random() - 0.5);
                next = shuffled[0];
                setGenreBuffer(shuffled.slice(1));
              }
            }
          }
        } catch(e) {
          console.error("FAI Genre search failed", e);
        }
      }
    } else if (activeGenre === "Variado Mix" || activeGenre === "La mezcla de Sofia") {
      if (genreBuffer.length > 0) {
          next = genreBuffer[0];
          setGenreBuffer(prev => prev.slice(1));
        } else {
          // Fetch new buffer from YouTube Search for trendy, non-repetitive variety focusing on top young hits
          const TOP_HITS_QUERIES = [
            "reggaeton actual 2024 exitos audio oficial",
            "top canciones españa tendencia hoy hits official music video",
            "house super top 2024 ibiza club hits audio",
            "musica urbana españa 2024 official audio",
            "exitos reggaeton nuevo 2024 bizarrap quevedo rauw official video",
            "deep house vocal mix 2024 official music video",
            "techno house super top 2024 tomorrowland sets official",
            "los 40 principales españa 2024 hoy official audio"
          ];
          // Select a random query from the pool to avoid repeating the same lists!
          const randomQuery = TOP_HITS_QUERIES[Math.floor(Math.random() * TOP_HITS_QUERIES.length)];
          try {
            const resp = await fetch(`${API_BASE_URL}/api/youtube/search?q=${encodeURIComponent(randomQuery)}`);
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.length > 0) {
              const playlists = data.filter((d: any) => d.isPlaylist).sort(() => Math.random() - 0.5);
              let foundTracks: MusicTrack[] = [];

              if (playlists.length > 0) {
                // Try up to 3 playlists to merge tracks and get huge variety
                for (let i = 0; i < Math.min(3, playlists.length); i++) {
                  const pl = playlists[i];
                  const plResp = await fetch(`${API_BASE_URL}/api/youtube/playlist?id=${pl.id}`);
                  if (plResp.ok) {
                    const plData = await plResp.json();
                    const tracksArray2 = Array.isArray(plData) ? plData : (plData.tracks || []);
                    if (tracksArray2 && tracksArray2.length > 0) {
                      const plTracks = tracksArray2.map((d: any) => ({
                        id: d.id,
                        title: extractCleanTitle(d.title),
                        artist: extractArtist(d.title, "Variado", d),
                        url: d.url || `https://www.youtube.com/watch?v=${d.id}`,
                        thumbnail_url: d.thumbnail || d.thumbnail_url || `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`,
                        duration: d.duration || "N/A"
                      })).filter((t: any) => isReasonableTrack(t.duration, t.title));
                      foundTracks = [...foundTracks, ...plTracks];
                    }
                  }
                }
              }

              if (foundTracks.length === 0) {
                // Fallback to videos
                const validData = data.filter((d: any) => !d.isPlaylist && d.id && isReasonableTrack(d.duration, d.title));
                if (validData.length > 0) {
                  foundTracks = validData.map((d: any) => ({
                    id: d.id,
                    title: extractCleanTitle(d.title),
                    artist: extractArtist(d.title, "Variado", d),
                    url: d.url || `https://www.youtube.com/watch?v=${d.id}`,
                    thumbnail_url: d.thumbnail || d.thumbnail_url || `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`,
                    duration: d.duration || "N/A"
                  }));
                }
              }

              if (foundTracks.length > 0) {
                // Filter out current track to ensure variety
                const filteredTracks = foundTracks.filter(t => t.id !== currentTrack?.id);
                const pool = filteredTracks.length > 0 ? filteredTracks : foundTracks;
                const shuffled = pool.sort(() => Math.random() - 0.5);
                next = shuffled[0];
                setGenreBuffer(shuffled.slice(1));
              }
            }
          }
        } catch (e) {
          console.error("FAI Varied Mix search failed", e);
        }
      }
    }

    if (!next) {
      const total = topRatio + favRatio + discRatio;
      const wDisc = total > 0 ? discRatio / total : 0.50;
      const rand = Math.random();

      if (rand < wDisc) {
        if (genreBuffer.length > 0) {
          next = genreBuffer[0];
          setGenreBuffer(prev => prev.slice(1));
        } else {
          const TOP_HITS_QUERIES = [
            "novedades musicales 2024",
            "exitos actuales 2024 oficial",
            "top canciones mundiales tendencia 2024",
            "musica nueva top hits 2024",
            "los 40 principales españa 2024 novedades",
            "mejores exitos pop urbana 2024 oficial"
          ];
          const randomQuery = TOP_HITS_QUERIES[Math.floor(Math.random() * TOP_HITS_QUERIES.length)];
          try {
            const resp = await fetch(`${API_BASE_URL}/api/youtube/search?q=${encodeURIComponent(randomQuery)}`);
            if (resp.ok) {
              const data = await resp.json();
              if (data && data.length > 0) {
                const playlists = data.filter((d: any) => d.isPlaylist).sort(() => Math.random() - 0.5);
                let foundTracks: MusicTrack[] = [];
                if (playlists.length > 0) {
                  for (let i = 0; i < Math.min(3, playlists.length); i++) {
                    const pl = playlists[i];
                    const plResp = await fetch(`${API_BASE_URL}/api/youtube/playlist?id=${pl.id}`);
                    if (plResp.ok) {
                      const plData = await plResp.json();
                      const tracksArray = Array.isArray(plData) ? plData : (plData.tracks || []);
                      if (tracksArray && tracksArray.length > 0) {
                        const plTracks = tracksArray.map((d: any) => ({
                          id: d.id,
                          title: extractCleanTitle(d.title),
                          artist: extractArtist(d.title, "Novedades", d),
                          url: d.url || `https://www.youtube.com/watch?v=${d.id}`,
                          thumbnail_url: d.thumbnail || d.thumbnail_url || `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`,
                          duration: d.duration || "N/A"
                        })).filter((t: any) => isReasonableTrack(t.duration, t.title));
                        foundTracks = [...foundTracks, ...plTracks];
                      }
                    }
                  }
                }
                if (foundTracks.length === 0) {
                  const validData = data.filter((d: any) => !d.isPlaylist && d.id && isReasonableTrack(d.duration, d.title));
                  if (validData.length > 0) {
                    foundTracks = validData.map((d: any) => ({
                      id: d.id,
                      title: extractCleanTitle(d.title),
                      artist: extractArtist(d.title, "Novedades", d),
                      url: d.url || `https://www.youtube.com/watch?v=${d.id}`,
                      thumbnail_url: d.thumbnail || d.thumbnail_url || `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`,
                      duration: d.duration || "N/A"
                    }));
                  }
                }
                if (foundTracks.length > 0) {
                  const filteredTracks = foundTracks.filter(t => t.id !== currentTrack?.id);
                  const pool = filteredTracks.length > 0 ? filteredTracks : foundTracks;
                  const shuffled = pool.sort(() => Math.random() - 0.5);
                  next = shuffled[0];
                  setGenreBuffer(shuffled.slice(1));
                }
              }
            }
          } catch (e) {
            console.error("FAI Algoritmo Discovery search failed", e);
          }
        }
      }

      if (!next) {
        next = selectNextDJTrack(topTracks, favorites, allTracks, { 
          discoveryLevel,
          genreMode: false,
          topRatio,
          favRatio,
          discRatio: 0 
        });
      }
    }
    
    if (next) {
      onPlayTrack(next);
      setIsRadioActive(true);
    }
    } catch (e) {
      console.error("FAI handleNextTrack failed", e);
    } finally {
      isSearchingRef.current = false;
    }
  }, [topTracks, favorites, allTracks, discoveryLevel, topRatio, favRatio, discRatio, genreExploration, selectedGenre, onPlayTrack, showDJMessage, genreBuffer, triggerAiDj]);

  useEffect(() => {
    const onFaiNext = () => {
      console.log("[FAI] External next track requested");
      handleNextTrack();
    };
    window.addEventListener("fai_next_track", onFaiNext);
    return () => window.removeEventListener("fai_next_track", onFaiNext);
  }, [handleNextTrack]);

  useEffect(() => {
    handleNextTrackRef.current = handleNextTrack;
  }, [handleNextTrack]);

  useEffect(() => {
    if (triggerPlay) {
      setTriggerPlay(false);
      handleNextTrack();
    }
  }, [triggerPlay, handleNextTrack]);



  
    const handleStartWelcome = async () => {
    setGenreExploration(true);
    localStorage.setItem("fai_genre_exploration", "true");
    setGenreBuffer([]);

    setSpeaking(false);
    setIsSpeakingPaused(false);
    setIsRadioActive(true);
    setWelcomePlayed(true);
    sessionStorage.setItem("flux_radio_welcome_played_session", "true");
    
    if (handleNextTrackRef.current) {
      if (!currentTrack) {
        handleNextTrackRef.current(false, selectedGenre);
      } else {
        if (!isPlaying) onTogglePlay();
      }
    }
  };

  /* Auto-start removed */
  
  

  const handleRatioChange = (type: 'top' | 'fav' | 'disc', value: number) => {
    const target = Math.max(0, Math.min(100, value));
    
    if (type === 'top') {
      const remaining = 100 - target;
      const sumOthers = favRatio + discRatio;
      if (sumOthers > 0) {
        const newFav = Math.round(remaining * (favRatio / sumOthers));
        const newDisc = 100 - target - newFav;
        setTopRatio(target);
        setFavRatio(Math.max(0, newFav));
        setDiscRatio(Math.max(0, newDisc));
      } else {
        const newFav = Math.round(remaining / 2);
        const newDisc = 100 - target - newFav;
        setTopRatio(target);
        setFavRatio(Math.max(0, newFav));
        setDiscRatio(Math.max(0, newDisc));
      }
    } else if (type === 'fav') {
      const remaining = 100 - target;
      const sumOthers = topRatio + discRatio;
      if (sumOthers > 0) {
        const newTop = Math.round(remaining * (topRatio / sumOthers));
        const newDisc = 100 - target - newTop;
        setFavRatio(target);
        setTopRatio(Math.max(0, newTop));
        setDiscRatio(Math.max(0, newDisc));
      } else {
        const newTop = Math.round(remaining / 2);
        const newDisc = 100 - target - newTop;
        setFavRatio(target);
        setTopRatio(Math.max(0, newTop));
        setDiscRatio(Math.max(0, newDisc));
      }
    } else if (type === 'disc') {
      const remaining = 100 - target;
      const sumOthers = topRatio + favRatio;
      if (sumOthers > 0) {
        const newTop = Math.round(remaining * (topRatio / sumOthers));
        const newFav = 100 - target - newTop;
        setDiscRatio(target);
        setTopRatio(Math.max(0, newTop));
        setFavRatio(Math.max(0, newFav));
      } else {
        const newTop = Math.round(remaining / 2);
        const newFav = 100 - target - newTop;
        setDiscRatio(target);
        setTopRatio(Math.max(0, newTop));
        setFavRatio(Math.max(0, newFav));
      }
    }
  };

  const toggleRadio = () => {
    if (!isRadioActive) {
      // Start radio session
      if (!welcomePlayed) {
        handleStartWelcome();
      } else {
        setIsRadioActive(true);
        if (!isPlaying) onTogglePlay();
        if (!currentTrack) handleNextTrack();
      }
    } else {
      // Radio already active
      if (isSpeaking) {
        if (welcomeAudioRef.current) {
          if (welcomeAudioRef.current.paused) {
            welcomeAudioRef.current.play().catch(e => console.error("Audio resume error", e));
            setIsSpeakingPaused(false);
          } else {
            welcomeAudioRef.current.pause();
            setIsSpeakingPaused(true);
          }
        } else {
          // fallback tts pause/resume
          if (isSpeakingPaused) {
            window.speechSynthesis.resume();
            setIsSpeakingPaused(false);
          } else {
            window.speechSynthesis.pause();
            setIsSpeakingPaused(true);
          }
        }
      } else {
        onTogglePlay();
      }
    }
  };

  const albumArt = currentTrack?.url?.includes('youtube.com') || currentTrack?.url?.includes('youtu.be')
    ? `https://img.youtube.com/vi/${currentTrack.url.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg`
    : (currentTrack?.thumbnail_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop");

  const handleVolumePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onVolumeChange) return;
    const container = e.currentTarget;
    
    const updateVolume = (clientX: number) => {
      const rect = container.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const width = rect.width;
      if (width > 0) {
        const pct = Math.max(0, Math.min(1, clickX / width));
        onVolumeChange(Math.round(pct * 100));
      }
    };

    updateVolume(e.clientX);
    container.setPointerCapture(e.pointerId);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const clickX = moveEvent.clientX - rect.left;
      const width = rect.width;
      if (width > 0) {
        const pct = Math.max(0, Math.min(1, clickX / width));
        onVolumeChange(Math.round(pct * 100));
      }
    };

    const handlePointerUp = () => {
      container.releasePointerCapture(e.pointerId);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerUp);
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", handlePointerUp);
  };

  const displayPosition = position || 0;
  const displayDuration = duration || 0;
  const actualProgress = displayDuration > 0 ? (displayPosition / displayDuration) * 100 : 0;
  const showPauseIcon = isPlaying && isRadioActive;
  
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0b] text-white relative overflow-hidden font-sans w-full max-w-full overflow-x-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60%] bg-gradient-to-b from-fuchsia-600/10 via-cyan-600/5 to-transparent blur-[120px] rounded-full pointer-events-none" />
      
      {/* Main Viewport */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 pt-4 pb-4 sm:pt-6 sm:pb-6 z-10 max-w-lg mx-auto w-full overflow-y-auto overflow-x-hidden premium-scrollbar relative">
        <div className="w-full flex flex-col items-center justify-center min-h-min py-8 sm:py-12 overflow-x-hidden">
        {/* Top Controls / Settings */}
        <div className="w-full flex justify-center shrink-0 relative z-20 mb-6 px-2 mt-2">
          <button
            onClick={() => setShowConfig(true)}
            className="group relative overflow-hidden h-14 sm:h-16 px-5 sm:px-8 rounded-2xl sm:rounded-full flex items-center justify-between gap-3 transition-all active:scale-[1.02] active:scale-95 bg-gradient-to-b from-[#1a1c23]/90 to-black/80 backdrop-blur-2xl border border-white/10 active:border-[#17d1a5]/50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] active:shadow-[0_8px_40px_rgba(23,209,165,0.2)] w-full max-w-md mx-auto"
            title="Elige tu música"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-[#17d1a5]/10 to-transparent opacity-0 group-active:opacity-100 transition-opacity duration-700" />
            
            <div className="relative z-10 flex items-center gap-3 sm:gap-4 overflow-hidden">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center border border-white/10 group-active:border-[#17d1a5]/50 transition-all shadow-inner shrink-0">
                {genreExploration ? (
                  <Music className="w-5 h-5 sm:w-6 sm:h-6 text-white/80 group-active:text-[#17d1a5] transition-colors" />
                ) : (
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white/80 group-active:text-[#17d1a5] transition-colors" />
                )}
              </div>
              
              <div className="flex flex-col items-start text-left truncate">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#17d1a5] drop-shadow-[0_0_8px_rgba(23,209,165,0.5)] mb-0.5">
                  {genreExploration ? "Escuchando" : "Mezcla Algorítmica"}
                </span>
                <span className="text-sm sm:text-lg font-black text-white group-active:text-transparent group-active:bg-clip-text group-active:bg-gradient-to-r group-active:from-white group-active:via-[#17d1a5] group-active:to-cyan-300 transition-all truncate w-full">
                  {genreExploration ? selectedGenre : "Mix Inteligente FLX"}
                </span>
              </div>
            </div>

            <div className="relative z-10 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-active:bg-[#17d1a5]/10 group-active:border-[#17d1a5]/30 transition-all shrink-0">
              <Settings2 className="w-4 h-4 text-white/50 group-active:text-[#17d1a5] group-active:animate-spin-slow" />
            </div>
          </button>
        </div>
        <div className="w-full flex justify-center items-center shrink-0 mb-4 sm:mb-8 px-2 relative">
          
          {/* Album Art Card */}
          <motion.div 
            className="relative w-[180px] sm:w-[240px] shrink-0 aspect-square group z-10"
          >
          <div className="absolute inset-0 bg-fuchsia-500/10 blur-3xl rounded-[2rem] opacity-50 pointer-events-none" />
          
          
            <div className="relative w-full h-full group">
              <motion.img
                key={currentTrack?.id || "empty"}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={albumArt}
                className="w-full h-full object-cover rounded-[1.2rem] sm:rounded-[1.5rem] shadow-2xl border border-[#17d1a5]/20 relative z-10"
                alt="Now Playing"
              />
              <div className="absolute inset-0 rounded-[1.2rem] sm:rounded-[1.5rem] bg-gradient-to-t from-[#070b1a]/90 via-[#070b1a]/20 to-transparent z-10 pointer-events-none" />
              
            </div>

          </motion.div>
        </div>

        <div className="w-full flex flex-col shrink-0">
        {/* Track Metadata Section */}
        <div className="w-full mb-6 sm:mb-8 mt-2 flex flex-col items-center">
          <div className="flex flex-col items-center justify-center relative w-full overflow-hidden">
            <motion.h2 
              key={(currentTrack?.title) + "-title"}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-2xl font-black tracking-widest uppercase text-white truncate px-4 text-center w-full drop-shadow-md"
            >
              {currentTrack?.title || "Cargando..."}
            </motion.h2>
            <motion.p
              key={(currentTrack?.artist) + "-artist"}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase text-emerald-400 mt-1.5 sm:mt-2 truncate px-4 text-center w-full"
            >
              {currentTrack?.artist || "GENERATING MIX..."}
            </motion.p>
          </div>
        </div>

        {/* Progress Bar & Time */}
        <div className="w-full mb-6 sm:mb-8">
          <div className="relative h-1 bg-white/10 rounded-full mb-2.5">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-white rounded-full"
              style={{ width: `${actualProgress}%` }}
            />
            <motion.div 
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full shadow-[0_0_15px_white] z-20"
              style={{ left: `${actualProgress}%`, marginLeft: '-5px' }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] sm:text-xs sm:text-lg sm:text-xl font-black tracking-[0.15em] text-white/30">
            <span>{formatTime(displayPosition)} / {formatTime(displayDuration)}</span>
          </div>
        </div>

        {/* Main Playback Controls */}
        <div className="flex items-center justify-between w-full px-4 sm:px-8 max-w-lg mb-8 sm:mb-12 mt-auto pb-4">
          {/* Favorite button on the left */}
          <div className="flex justify-start items-center gap-1 sm:gap-3 w-full pl-1 sm:pl-2">
            <button 
              onClick={(e) => {
                if (currentTrack && onToggleFavorite ) {
                  onToggleFavorite(currentTrack, e);
                }
              }}
              className={`p-1 sm:p-2 transition-all transform active:scale-90 flex-shrink-0  ${currentTrack && favorites.some(t => t.id === currentTrack.id || t.url === currentTrack.url) ? 'text-[#1ED760] active:text-[#17b54e]' : 'text-white/40 active:text-white'}`}
            >
              <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${currentTrack && favorites.some(t => t.id === currentTrack.id || t.url === currentTrack.url) ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Center Play Controls */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 flex-shrink-0 min-w-max mx-2 sm:mx-0">
            <button 
              onClick={() => {}}
              className="p-1 sm:p-2 text-white/40 active:text-white transition-all transform active:scale-90 flex-shrink-0"
              
            >
              <SkipBack className="fill-current w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={toggleRadio}
              className="rounded-full w-12 h-12 sm:w-16 sm:h-16 bg-white text-black flex items-center justify-center transition-all duration-350 shadow-xl flex-shrink-0"
            >
              {showPauseIcon ? <Pause className="fill-current text-black w-5 h-5 sm:w-7 sm:h-7" /> : <Play className="fill-current text-black w-5 h-5 sm:w-7 sm:h-7 ml-0.5 sm:ml-1" />}
            </motion.button>
            
            <button 
              onClick={() => handleNextTrack(true)}
              className="p-1 sm:p-2 text-white active:text-emerald-400 transition-all transform active:scale-90 flex-shrink-0"
            >
              <SkipForward className="fill-current w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          </div>

          {/* Volume Adjuster */}
          <div className="flex justify-end items-center gap-1.5 sm:gap-3 w-full pr-1 sm:pr-2">
            <div className="flex items-center justify-end gap-1 sm:gap-1.5 group/vol w-[65px] sm:w-[100px]">
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover/vol:text-white transition-colors shrink-0" />
              <div
                onPointerDown={handleVolumePointerDown}
                className="w-full h-1 bg-white/20 rounded-full relative cursor-pointer group-hover/vol:h-1.5 transition-all touch-none flex items-center"
              >
                <div
                  className="absolute left-0 h-full rounded-full bg-slate-300 group-hover/vol:bg-white pointer-events-none transition-colors"
                  style={{ width: `${volume}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full shadow opacity-100 transition-opacity translate-x-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
        </div>
      </div>

      {/* Settings Modal Overlay */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showConfig && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col justify-center items-center"
              onClick={() => setShowConfig(false)}
            >
              <motion.div 
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-[100dvh] max-w-4xl bg-gradient-to-b from-[#0a1128] to-[#070b1a] rounded-none pt-16 sm:pt-12 pb-12 px-6 sm:px-12 flex flex-col gap-6 sm:gap-8 overflow-hidden relative shadow-2xl border-x border-white/5"
              >              
              <div className="flex items-center justify-center relative sm:mt-2 mb-2 shrink-0">
                <h3 className="text-base font-black text-white uppercase tracking-wider">Configuración FLX Radio</h3>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="absolute right-0 w-8 h-8 flex items-center justify-center bg-white/10 active:bg-white/20 rounded-full transition-all"
                >
                  <X className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </button>
              </div>

              {/* Mode Toggle inside Config */}
              <div className="bg-black/40 border border-white/10 p-1.5 rounded-2xl flex items-center relative w-full mb-1 shrink-0">
                <button 
                   onClick={() => {
                     setGenreExploration(true);
                   }}
                   className={`flex-1 py-3 rounded-xl text-sm sm:text-base font-bold transition-all z-10 flex items-center justify-center gap-2 ${genreExploration ? "text-black bg-[#17d1a5] shadow-[0_0_20px_rgba(23,209,165,0.4)]" : "text-white/50 active:text-white"}`}
                >
                  <Music className="w-6 h-6 sm:w-8 sm:h-8" />
                  GÉNEROS
                </button>
                <button 
                  onClick={() => {
                     if (genreExploration) {
                        setGenreExploration(false);
                        setTriggerPlay(true);
                     }
                  }}
                  className={`flex-1 py-3 rounded-xl text-sm sm:text-base font-bold transition-all z-10 flex items-center justify-center gap-2 ${!genreExploration ? "text-black bg-[#17d1a5] shadow-[0_0_20px_rgba(23,209,165,0.4)]" : "text-white/50 active:text-white"}`}
                >
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
                  ALGORITMO
                </button>
              </div>

              {/* Configuration Panel Content */}
              <div className="bg-[#1a1c23]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 relative overflow-y-auto premium-scrollbar shadow-inner flex-1 min-h-0">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                 
                 {!genreExploration ? (
                   <>
                     <div className="flex items-center justify-between z-10 mb-2 shrink-0">
                        <div>
                          <h4 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                             <Settings2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#17d1a5]" />
                             Ajuste de Mezcla FLX
                          </h4>
                          <p className="text-sm sm:text-base text-white/50 mt-1.5">Configura el balance del algoritmo inteligente.</p>
                        </div>
                     </div>
                     
                     <div className="flex flex-col gap-5 z-10 mt-2">
                       {/* Top Canciones Slider */}
                       <div className="flex flex-col gap-1.5">
                         <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
                           <span className="text-white/80">Top canciones</span>
                           <span className="text-[#17d1a5] text-sm sm:text-base font-black">{topRatio}%</span>
                         </div>
                         <div className="relative group">
                           <input
                             type="range"
                             min="0"
                             max="100"
                             value={topRatio}
                             onChange={(e) => handleRatioChange('top', parseInt(e.target.value))}
                             className="w-full h-2 bg-[#142259] rounded-full appearance-none cursor-pointer accent-[#17d1a5] relative z-10"
                           />
                         </div>
                       </div>

                       {/* Canciones Favoritas Slider */}
                       <div className="flex flex-col gap-1.5">
                         <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
                           <span className="text-white/80">Canciones favoritas</span>
                           <span className="text-[#17d1a5] text-sm sm:text-base font-black">{favRatio}%</span>
                         </div>
                         <div className="relative group">
                           <input
                             type="range"
                             min="0"
                             max="100"
                             value={favRatio}
                             onChange={(e) => handleRatioChange('fav', parseInt(e.target.value))}
                             className="w-full h-2 bg-[#142259] rounded-full appearance-none cursor-pointer accent-[#17d1a5] relative z-10"
                           />
                         </div>
                       </div>

                       {/* Descubrimiento Slider */}
                       <div className="flex flex-col gap-1.5">
                         <div className="flex justify-between items-center text-xs sm:text-sm font-bold">
                           <span className="text-white/80">Descubrimiento nuevo</span>
                           <span className="text-[#17d1a5] text-sm sm:text-base font-black">{discRatio}%</span>
                         </div>
                         <div className="relative group">
                           <input
                             type="range"
                             min="0"
                             max="100"
                             value={discRatio}
                             onChange={(e) => handleRatioChange('disc', parseInt(e.target.value))}
                             className="w-full h-2 bg-[#142259] rounded-full appearance-none cursor-pointer accent-[#17d1a5] relative z-10"
                           />
                         </div>
                       </div>
                     </div>
                     
                     <div className="bg-[#243c94]/40 border border-[#243c94]/60 rounded-xl p-4 flex flex-col gap-3 shadow-inner z-10 shrink-0 mt-auto">
                       <h4 className="text-sm sm:text-base font-bold text-white mb-1 uppercase tracking-wider">Distribución de bloques:</h4>
                       <p className="text-[11px] text-white/70 flex justify-between items-center font-medium"><span>Top canciones:</span> <span className="text-[#17d1a5] font-bold text-sm sm:text-base">{topRatio}%</span></p>
                       <p className="text-[11px] text-white/70 flex justify-between items-center font-medium"><span>Canciones favoritas:</span> <span className="text-[#17d1a5] font-bold text-sm sm:text-base">{favRatio}%</span></p>
                       <p className="text-[11px] text-white/70 flex justify-between items-center font-medium"><span>Descubrimiento nuevo:</span> <span className="text-[#17d1a5] font-bold text-sm sm:text-base">{discRatio}%</span></p>
                     </div>
                   </>
                 ) : (
                   <div className="flex flex-col gap-2 z-10 flex-1">
                     <div className="flex flex-col gap-2 shrink-0 mb-2">
                       <input
                         type="text"
                         placeholder="Ej: Synthwave, K-Pop..."
                         value={customGenre}
                         onChange={(e) => setCustomGenre(e.target.value)}
                         onKeyDown={(e) => {
                           if (e.key === "Enter" && customGenre.trim()) {
                             handleGenreSelect(customGenre.trim());
                             setCustomGenre("");
                             setShowConfig(false);
                           }
                         }}
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#17d1a5] focus:ring-1 focus:ring-[#17d1a5] transition-all font-medium shadow-inner"
                       />
                       {customGenre.trim() && (
                         <button 
                           onClick={() => {
                             handleGenreSelect(customGenre.trim());
                             setCustomGenre("");
                             setShowConfig(false);
                           }}
                           className="w-full py-3 bg-[#17d1a5] active:bg-[#14b892] text-black font-black uppercase text-sm sm:text-base tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(23,209,165,0.3)]"
                         >
                           Reproducir: {customGenre.trim()}
                         </button>
                       )}
                     </div>
                     <div className="flex-1 flex flex-col gap-2 pb-4">
                       {DJ_GENRES.map((genre) => (
                         <button
                           key={genre}
                           onClick={() => {
                             handleGenreSelect(genre);
                             setShowConfig(false);
                           }}
                           className={`p-4 rounded-xl flex items-center justify-between transition-all shrink-0 border ${
                             genreExploration && selectedGenre === genre
                               ? "bg-[#17d1a5]/10 border-[#17d1a5]/50 text-[#17d1a5]"
                               : "bg-white/5 border-transparent text-white/70 active:bg-white/10 active:text-white"
                           }`}
                         >
                           <span className="font-bold text-[13px] tracking-wide">{genre}</span>
                           {genreExploration && selectedGenre === genre && <Radio className="w-6 h-6 sm:w-8 sm:h-8 text-[#17d1a5]" />}
                         </button>
                       ))}
                     </div>
                   </div>
                 )}

              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
