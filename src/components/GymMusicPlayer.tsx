import { API_BASE_URL } from "../lib/constants";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Carousel } from "./Carousel";
import { MediaSession } from '@jofr/capacitor-media-session';
import { Capacitor } from '@capacitor/core';
import ReactPlayer from "react-player";
import { motion, AnimatePresence } from "motion/react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Play,
  Pause,
  SkipForward,
  SkipBack,
  Music,
  ListMusic,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  Disc,
  Plus,
  Minus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Bug,
  Radio,
  Send,
  MessageSquare,
  MessageCircle,
  Shuffle,
  Repeat,
  Shield,
  ShieldAlert,
  LogOut,
  Heart,
  Star,
  LogIn,
  Headphones,
  Save,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  ListPlus,
  Compass,
  PlusCircle,
  LayoutGrid,
  FolderPlus,
  FolderMinus,
  Folder,
  ChevronRight,
  Check,
  BadgeCheck,
  Bookmark,
  Trophy,
  Download,
  Users,
  User,
  UserPlus,
  Library,
  FileText,
  Tv,
  GripVertical,
  Globe,
Mic, Bot } from "lucide-react";
import { DEFAULT_MUSIC_COVER } from "../lib/constants";
import { FAIView } from "./FAIView";
import { selectNextDJTrack, isReasonableTrack } from "../lib/djLogic";

const fetchWithCache = async (cacheKey, ttl, fetcher, forceRefresh = false) => {
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < ttl) {
           return parsed.data;
        }
      }
    } catch (e) {}
  }
  const data = await fetcher();
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
  } catch(e) {}
  return data;
};

import { collection,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  collectionGroup,
  getDocs,
  getDoc,
  where,
  setDoc,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db, loginWithGoogle, logout } from "../lib/firebase";
import { useFirebase } from "./FirebaseProvider";
import { MusicPlaylist, MusicTrack } from "../types";
import { recordTrackPlay,
  recordTrackSkip,
  getTasteDiagnostics,
  getMusicRecommendations,
  getPlayHistory,
  TasteDiagnostics,
  RecommendedTrack,
} from "../lib/recommendationEngine";
const LazyExploreView = React.lazy(() =>
  import("./ExploreView").then((m) => ({ default: m.ExploreView })),
);
const LazyPodcastView = React.lazy(() =>
  import("./PodcastView").then((m) => ({ default: m.PodcastView })),
);
const LazyFluxKaraoke = React.lazy(() => import("./FluxKaraoke"));
const LazyUserManagementAdmin = React.lazy(() =>
  import("./UserManagementAdmin").then((m) => ({
    default: m.UserManagementAdmin,
  })),
);
const LazyUserProfileModal = React.lazy(() =>
  import("./UserProfileModal").then((m) => ({ default: m.UserProfileModal })),
);

const COVER_THEMES = [
  {
    name: "Cyberpunk Pulse",
    bgStart: "#0a0519",
    bgEnd: "#140a28",
    glowColor: "#ff007f",
    accentColor: "#00ffff",
    grid: true,
    radial: true,
    rings: "concentric",
  },
  {
    name: "Golden Retro",
    bgStart: "#140f05",
    bgEnd: "#2d1e0a",
    glowColor: "#ffaa00",
    accentColor: "#ff3300",
    grid: false,
    radial: true,
    rings: "solar",
  },
  {
    name: "Emerald Synthwave",
    bgStart: "#050f0a",
    bgEnd: "#0f1914",
    glowColor: "#1ED760",
    accentColor: "#00f5ff",
    grid: true,
    radial: false,
    rings: "waves",
  },
  {
    name: "Electric Chill",
    bgStart: "#060b1e",
    bgEnd: "#121b3a",
    glowColor: "#3b82f6",
    accentColor: "#8b5cf6",
    grid: true,
    radial: true,
    rings: "spherical",
  },
  {
    name: "Crimson Brutalist",
    bgStart: "#1a0505",
    bgEnd: "#2c0c0c",
    glowColor: "#ef4444",
    accentColor: "#f97316",
    grid: false,
    radial: false,
    rings: "brutalist",
  },
];

const generateSVGDataURI = (title: string, themeIndex: number) => {
  const theme = COVER_THEMES[themeIndex % COVER_THEMES.length];
  const cleanedTitle = (title || "").trim();
  let initials = "MX";
  if (cleanedTitle) {
    const words = cleanedTitle.split(/\s+/);
    if (words.length >= 2) {
      initials = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words[0] && words[0].length >= 2) {
      initials = words[0].substring(0, 2).toUpperCase();
    } else if (words[0]) {
      initials = words[0][0].toUpperCase() + "X";
    }
  }

  const gridLine = theme.grid
    ? `
    <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="0.7"/>
    </pattern>
    <rect width="100%" height="100%" fill="url(#grid)" />
  `
    : "";

  let ringsGraphic = "";
  if (theme.rings === "concentric") {
    ringsGraphic = `
      <circle cx="200" cy="200" r="140" fill="none" stroke="${theme.glowColor}" stroke-dasharray="4,8" stroke-width="1" opacity="0.4"/>
      <circle cx="200" cy="200" r="110" fill="none" stroke="${theme.accentColor}" stroke-dasharray="1,5" stroke-width="2" opacity="0.6"/>
      <circle cx="200" cy="200" r="80" fill="none" stroke="${theme.glowColor}" stroke-width="1.5" opacity="0.3"/>
    `;
  } else if (theme.rings === "solar") {
    ringsGraphic = `
      <circle cx="200" cy="200" r="120" fill="none" stroke="${theme.glowColor}" stroke-width="4" opacity="0.15"/>
      <circle cx="200" cy="240" r="90" fill="none" stroke="${theme.accentColor}" stroke-width="3" opacity="0.3"/>
      <line x1="80" y1="200" x2="320" y2="200" stroke="${theme.glowColor}" stroke-width="2" opacity="0.4"/>
      <line x1="80" y1="220" x2="320" y2="220" stroke="${theme.accentColor}" stroke-width="1" opacity="0.3"/>
    `;
  } else if (theme.rings === "waves") {
    ringsGraphic = `
      <path d="M 60 200 Q 130 140 200 200 T 340 200" fill="none" stroke="${theme.glowColor}" stroke-width="2" opacity="0.5"/>
      <path d="M 60 220 Q 130 160 200 220 T 340 220" fill="none" stroke="${theme.accentColor}" stroke-width="1.5" opacity="0.4"/>
      <path d="M 60 180 Q 130 120 200 180 T 340 180" fill="none" stroke="${theme.accentColor}" stroke-width="1" opacity="0.3"/>
    `;
  } else if (theme.rings === "spherical") {
    ringsGraphic = `
      <circle cx="200" cy="200" r="90" fill="none" stroke="${theme.glowColor}" stroke-width="1" opacity="0.5"/>
      <ellipse cx="200" cy="200" rx="90" ry="30" fill="none" stroke="${theme.accentColor}" stroke-width="1.5" opacity="0.6" transform="rotate(30, 200, 200)"/>
      <ellipse cx="200" cy="200" rx="90" ry="30" fill="none" stroke="${theme.accentColor}" stroke-width="1.5" opacity="0.4" transform="rotate(-30, 200, 200)"/>
    `;
  } else {
    ringsGraphic = `
      <rect x="70" y="70" width="260" height="260" fill="none" stroke="${theme.accentColor}" stroke-width="1.5" opacity="0.3"/>
      <line x1="50" y1="50" x2="350" y2="350" stroke="${theme.glowColor}" stroke-width="1" opacity="0.3" />
      <line x1="350" y1="50" x2="50" y2="350" stroke="${theme.glowColor}" stroke-width="1" opacity="0.3" />
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${theme.bgStart}"/>
          <stop offset="100%" stop-color="${theme.bgEnd}"/>
        </linearGradient>
        <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${theme.glowColor}" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="${theme.glowColor}" stop-opacity="0"/>
        </radialGradient>
        <filter id="neonFilter">
          <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect width="400" height="400" fill="url(#bgGrad)"/>
      
      ${theme.radial ? `<circle cx="200" cy="200" r="180" fill="url(#glowGrad)"/>` : ""}
      
      ${gridLine}
      
      <g>
        ${ringsGraphic}
      </g>
      
      <g filter="url(#neonFilter)">
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="'Inter', system-ui, sans-serif" font-weight="900" font-size="76" fill="#ffffff" letter-spacing="2">
          ${initials}
        </text>
      </g>
      
      <text x="24" y="376" font-family="monospace" font-size="9" font-weight="bold" fill="${theme.accentColor}" letter-spacing="1" opacity="0.8">
        FLUX AUDIO STUDIO
      </text>
      <text x="376" y="376" font-family="monospace" font-size="9" font-weight="bold" fill="#ffffff" letter-spacing="1" opacity="0.5" text-anchor="end">
        PRESET v1.0
      </text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const sanitizeOwnerName = (nameOrEmail?: string) => {
  if (!nameOrEmail) return "Socio Premium";
  const str = String(nameOrEmail).trim();
  if (str.includes("@")) {
    return str.split("@")[0];
  }
  return str;
};

export const ALL_DATABASE_TRACKS: MusicTrack[] = [
  {
    id: "phonk1",
    title: "Metamorphosis (Drift Phonk)",
    artist: "INTERWORLD",
    bpm: 135,
    duration: "2:23",
    url: "https://www.youtube.com/watch?v=v2Gk2_CvdN0",
  },
  {
    id: "phonk2",
    title: "Midnight City",
    artist: "M83",
    bpm: 105,
    duration: "4:03",
    url: "https://www.youtube.com/watch?v=9aZQFq6hQ0M",
  },
  {
    id: "gym1",
    title: "The Business",
    artist: "Tiësto",
    bpm: 120,
    duration: "2:44",
    url: "https://www.youtube.com/watch?v=f2jXz93eJv4",
  },
  {
    id: "gym2",
    title: "Levels",
    artist: "Avicii",
    bpm: 126,
    duration: "3:20",
    url: "https://www.youtube.com/watch?v=8AebxEMgR6o",
  },
  {
    id: "gym3",
    title: "Animals",
    artist: "Martin Garrix",
    bpm: 128,
    duration: "5:04",
    url: "https://www.youtube.com/watch?v=qOsg5rS76sM",
  },
  {
    id: "gym4",
    title: "Faded",
    artist: "Alan Walker",
    bpm: 90,
    duration: "3:32",
    url: "https://www.youtube.com/watch?v=60ItHLz5WeA",
  },
  {
    id: "gym5",
    title: "Blinding Lights",
    artist: "The Weeknd",
    bpm: 171,
    duration: "3:20",
    url: "https://www.youtube.com/watch?v=J7p4bzqtlQA",
  },
  {
    id: "gym6",
    title: "Keraunos (Drift Phonk)",
    artist: "PlayaPhonk",
    bpm: 151,
    duration: "2:27",
    url: "https://www.youtube.com/watch?v=p79tLALf61c",
  },
  {
    id: "gym7",
    title: "Rapture",
    artist: "Nadia Ali (Avicii Remix)",
    bpm: 126,
    duration: "3:38",
    url: "https://www.youtube.com/watch?v=b09f_c3uCg0",
  },
  {
    id: "gym8",
    title: "Wake Me Up",
    artist: "Avicii",
    bpm: 124,
    duration: "4:07",
    url: "https://www.youtube.com/watch?v=IcrbM1l_BoI",
  },
  {
    id: "gym9",
    title: "Adagio for Strings",
    artist: "Tiësto",
    bpm: 140,
    duration: "7:20",
    url: "https://www.youtube.com/watch?v=8To-Xih87JE",
  },
  {
    id: "gym10",
    title: "Clarity",
    artist: "Zedd ft. Foxes",
    bpm: 128,
    duration: "4:31",
    url: "https://www.youtube.com/watch?v=IXXxciRUMzE",
  },
  {
    id: "gym11",
    title: "Lean On",
    artist: "Major Lazer & DJ Snake",
    bpm: 98,
    duration: "2:56",
    url: "https://www.youtube.com/watch?v=YqeW9_5kURI",
  },
  {
    id: "gym12",
    title: "Titanium",
    artist: "David Guetta ft. Sia",
    bpm: 126,
    duration: "4:05",
    url: "https://www.youtube.com/watch?v=JRfuAAtPhic",
  },
  {
    id: "gym13",
    title: "Strobe (Club Edit)",
    artist: "deadmau5",
    bpm: 128,
    duration: "6:12",
    url: "https://www.youtube.com/watch?v=tKi9Z-f6qHY",
  },
  {
    id: "gym14",
    title: "Intro",
    artist: "The xx",
    bpm: 120,
    duration: "2:08",
    url: "https://www.youtube.com/watch?v=sV4_wYedXyU",
  },
];

const getPlaylistGradientClass = (name: string) => {
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    "from-purple-600 via-indigo-700 to-blue-950",
    "from-emerald-600 via-teal-700 to-cyan-950",
    "from-rose-600 via-pink-700 to-red-950",
    "from-amber-600 via-orange-700 to-yellow-950",
    "from-blue-600 via-purple-700 to-pink-950",
    "from-fuchsia-600 via-purple-700 to-violet-950",
    "from-red-600 via-rose-700 to-indigo-950",
  ];
  return gradients[hash % gradients.length];
};

const calculatePlaylistDuration = (tracks: MusicTrack[]) => {
  if (!tracks || tracks.length === 0) return "0 min";

  let totalSeconds = 0;
  tracks.forEach((track) => {
    let secs = 0;
    if (
      track.duration &&
      typeof track.duration === "string" &&
      track.duration.includes(":")
    ) {
      const parts = track.duration.split(":");
      if (parts.length === 2) {
        const m = parseInt(parts[0], 10);
        const s = parseInt(parts[1], 10);
        if (!isNaN(m) && !isNaN(s)) {
          secs = m * 60 + s;
        }
      } else if (parts.length === 3) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const s = parseInt(parts[2], 10);
        if (!isNaN(h) && !isNaN(m) && !isNaN(s)) {
          secs = h * 3600 + m * 60 + s;
        }
      }
    } else if (track.duration && !isNaN(Number(track.duration))) {
      const val = Number(track.duration);
      if (val > 1000) {
        secs = Math.floor(val / 1000);
      } else {
        secs = val;
      }
    }

    // Fallback to 3:30 (210s) if track exists but has no valid duration
    if (secs === 0) {
      secs = 210;
    }

    totalSeconds += secs;
  });

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} h ${minutes} min`;
  }
  return `${minutes} min ${seconds} s`;
};

const getPlaylistGenre = (pl: MusicPlaylist) => {
  if (
    pl.genre &&
    pl.genre !== "Personalizado" &&
    pl.genre !== "Siguiente" &&
    pl.genre !== "general"
  ) {
    return pl.genre;
  }
  const name = (pl.name || "").toLowerCase();
  if (
    name.includes("reggaeton") ||
    name.includes("perreo") ||
    name.includes("flow") ||
    name.includes("bad bunny") ||
    name.includes("ozuna") ||
    name.includes("dy") ||
    name.includes("fresca") ||
    name.includes("caliente")
  ) {
    return "Reggaetón / Urbano";
  }
  if (
    name.includes("dembow") ||
    name.includes("el alfa") ||
    name.includes("chiman") ||
    name.includes("dominicano")
  ) {
    return "Dembow / Dominicano";
  }
  if (
    name.includes("electro") ||
    name.includes("house") ||
    name.includes("tech") ||
    name.includes("dance") ||
    name.includes("edm") ||
    name.includes("electronic") ||
    name.includes("techno") ||
    name.includes("workout") ||
    name.includes("gym") ||
    name.includes("entreno") ||
    name.includes("power")
  ) {
    return "Electro / EDM";
  }
  if (
    name.includes("salsa") ||
    name.includes("merengue") ||
    name.includes("bachata") ||
    name.includes("latin") ||
    name.includes("tropical") ||
    name.includes("caribe")
  ) {
    return "Tropical Latino";
  }
  if (name.includes("adoni") || name.includes("mix")) {
    return "Super Mix / Adoni";
  }
  if (
    name.includes("martina") ||
    name.includes("cumple") ||
    name.includes("birthday")
  ) {
    return "Fiesta / Cumpleaños";
  }
  if (
    name.includes("rock") ||
    name.includes("metal") ||
    name.includes("hard")
  ) {
    return "Rock / Metal Hits";
  }
  if (
    name.includes("chill") ||
    name.includes("relax") ||
    name.includes("suave") ||
    name.includes("calm")
  ) {
    return "Chillout / Lo-Fi";
  }
  if (pl.tracks && pl.tracks.length > 0) {
    const trackArtist = (pl.tracks[0].artist || "").toLowerCase();
    if (
      trackArtist.includes("bad bunny") ||
      trackArtist.includes("rauw") ||
      trackArtist.includes("karol") ||
      trackArtist.includes("feid") ||
      trackArtist.includes("anuel")
    ) {
      return "Reggaetón / Urbano";
    }
    if (
      trackArtist.includes("tiësto") ||
      trackArtist.includes("guetta") ||
      trackArtist.includes("garrix") ||
      trackArtist.includes("avicii") ||
      trackArtist.includes("calvin")
    ) {
      return "Electro / Dance";
    }
  }
  return "Flux Music";
};

const getPlaylistPopularity = (pl: MusicPlaylist) => {
  const idStr = pl.id || pl.name || "flux";
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const ratingVal = (4.7 + (absHash % 3) * 0.1).toFixed(1);
  const scoreVal = 92 + (absHash % 8);
  return { rating: ratingVal, score: scoreVal };
};

const getPlaylistSaves = (
  pl: MusicPlaylist,
  userPlaylists: MusicPlaylist[],
  user: any,
) => {
  const idStr = pl.id || pl.name || "flux";
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const trackFactor = pl.tracks ? pl.tracks.length * 4 : 5;
  const baseSaves = (absHash % 250) + 75 + trackFactor;

  const isSavedByCurUser = userPlaylists.some(
    (p) => p.ownerId === user?.uid && p.name === pl.name,
  );
  const finalSaves = baseSaves + (isSavedByCurUser ? 1 : 0);

  return finalSaves;
};

const cleanUrl = (url: string) => {
  if (!url) return "";
  if (url.includes("i.ytimg.com")) {
    let clean = url.split("?")[0];
    if (clean.endsWith("hq720.jpg") || clean.endsWith("sddefault.jpg") || clean.endsWith("maxresdefault.jpg") || clean.endsWith("hqdefault.jpg")) {
      clean = clean.replace("hq720.jpg", "mqdefault.jpg")
                   .replace("sddefault.jpg", "mqdefault.jpg")
                   .replace("hqdefault.jpg", "mqdefault.jpg")
                   .replace("maxresdefault.jpg", "mqdefault.jpg");
    }
    return clean;
  }
  return url;
};

const getTrackImage = (track?: any): string | null => {
  if (!track) return null;
  if (track.thumbnail) return cleanUrl(track.thumbnail);
  if (track.thumbnail_url) return cleanUrl(track.thumbnail_url);
  if (track.imageUrl) return cleanUrl(track.imageUrl);
  if (track.artwork_url) return cleanUrl(track.artwork_url);
  if (track.artwork) return cleanUrl(track.artwork);
  if (
    track.url &&
    (track.url.includes("youtube.com") || track.url.includes("youtu.be"))
  ) {
    const match = track.url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|\/|$)/);
    if (match && match[1]) {
      return `https://i.ytimg.com/vi/${match[1]}/mqdefault.jpg`;
    }
  }
  if (track.id?.startsWith("yt_")) {
    const vid = track.id.split("_")[1];
    if (vid) return `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`;
  }
  // If track.id is exactly 11 characters (typical youtube ID)
  if (track.id && typeof track.id === "string" && track.id.length === 11) {
    return `https://i.ytimg.com/vi/${track.id}/mqdefault.jpg`;
  }
  return null;
};

const getPlaylistImage = (pl?: any): string | null => {
  if (!pl) return null;
  if (pl.imageUrl && !pl.imageUrl.includes("pollinations")) return cleanUrl(pl.imageUrl);
  if (pl.thumbnail_url && !pl.thumbnail_url.includes("pollinations")) return cleanUrl(pl.thumbnail_url);
  if (pl.thumbnail && !pl.thumbnail.includes("pollinations")) return cleanUrl(pl.thumbnail);
  if (pl.artwork_url && !pl.artwork_url.includes("pollinations")) return cleanUrl(pl.artwork_url);
  if (pl.artwork && !pl.artwork.includes("pollinations")) return cleanUrl(pl.artwork);
  if (pl.tracks && pl.tracks.length > 0) {
    const tImg = getTrackImage(pl.tracks[0]);
    if (tImg) return cleanUrl(tImg);
  }
  return null;
};

// Generate a 10-second true silent WAV blob to prevent CPU overload
// Keeps iOS background lock without excessive CPU usage or network calls
// MUST be 44100Hz to prevent iOS system mixer from downsampling music quality
const createSilentAudioBlobURL = (): string => {
  if (typeof window === "undefined") return "";
  const sampleRate = 44100;
  const duration = 10; // Longer duration to avoid loop stuttering on Bluetooth
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
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // 1 channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, "data");
  view.setUint32(40, numSamples * 2, true);

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
};

const silentAudioBlobSrc = createSilentAudioBlobURL();

interface GymMusicPlayerProps {
  unreadRepliesCount?: number;
}

export default function GymMusicPlayer({ unreadRepliesCount = 0 }: GymMusicPlayerProps = {}) {
  const isIOS =
    typeof window !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  const {
    user,
    loading: authLoading,
    setAuthModalOpen,
    accessData,
    logout,
  } = useFirebase();

  const isTemporaryUser = accessData?.plan === "free" || user?.isAnonymous;

  const [trialRequestStatus, setTrialRequestStatus] = useState<
    "idle" | "sent" | "already_claimed"
  >("idle");
  const [isCheckingTrialRequest, setIsCheckingTrialRequest] = useState(false);
  const [showSupportChoice, setShowSupportChoice] = useState(false);
  const [trialRequestMsg, setTrialRequestMsg] = useState<string | null>(null);

  const getBrowserFingerprint = () => {
    let token = localStorage.getItem("flux_device_token");
    if (!token) {
      // Create a stable local device ID since Brave/Safari can randomize or block canvas fingerprinting
      token =
        "dev_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).substring(2);
      localStorage.setItem("flux_device_token", token);
    }

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return token;
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("FluxPlayer!_Fingerprint", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("FluxPlayer!_Fingerprint", 4, 17);
      const res = canvas.toDataURL();
      let hash = 0;
      for (let i = 0; i < res.length; i++) {
        hash = (hash << 5) - hash + res.charCodeAt(i);
        hash |= 0;
      }
      return "fp_" + Math.abs(hash).toString(36) + "_" + token;
    } catch (e) {
      return token;
    }
  };

  useEffect(() => {
    if (user) {
      checkTrialStatus();
    }
  }, [user]);

  const checkTrialStatus = async () => {
    if (!user) return;
    try {
      setIsCheckingTrialRequest(true);
      const fp = getBrowserFingerprint();

      const requestsRef = collection(db, "trial_requests");
      const q = query(requestsRef, where("uid", "==", user.uid));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const reqDoc = snap.docs[0].data();
        if (reqDoc.status === "pending") {
          setTrialRequestStatus("sent");
          setTrialRequestMsg(
            "Tu solicitud de prueba de 7 días está pendiente de aprobación por el administrador.",
          );
        } else if (
          reqDoc.status === "approved" ||
          (accessData && accessData.trialStart !== null)
        ) {
          setTrialRequestStatus("already_claimed");
          setTrialRequestMsg(
            "Ya has disfrutado de tu prueba gratuita de 7 días.",
          );
        } else if (reqDoc.status === "rejected") {
          setTrialRequestStatus("already_claimed");
          setTrialRequestMsg(
            "Tu solicitud de prueba de 7 días fue declinada por el administrador.",
          );
        }
        setIsCheckingTrialRequest(false);
        return;
      }

      const fpQuery = query(requestsRef, where("fingerprint", "==", fp));
      const fpSnap = await getDocs(fpQuery);
      if (!fpSnap.empty) {
        setTrialRequestStatus("already_claimed");
        setTrialRequestMsg(
          "Acceso Denegado: Ya se ha solicitado una prueba de 7 días desde este dispositivo.",
        );
        setIsCheckingTrialRequest(false);
        return;
      }

      setTrialRequestStatus("idle");
      setIsCheckingTrialRequest(false);
    } catch (err) {
      console.error("Error checking trial status:", err);
      setIsCheckingTrialRequest(false);
    }
  };
  const isEcoMode = true;
  const isAdmin = user?.email === "eltygere8651@gmail.com";

  useEffect(() => {
    if (isAdmin && user) {
      const syncTelegram = async () => {
        try {
          const docRef = doc(db, "system_settings", "telegram");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data?.botToken && data?.chatId) {
              await fetch(`${API_BASE_URL}/api/support/register-telegram`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  botToken: data.botToken.trim(),
                  chatId: data.chatId.trim(),
                  adminEmail: "eltygere8651@gmail.com",
                }),
              });
              console.log(
                "Successfully synchronized Telegram support credentials on backend.",
              );
            }
          }
        } catch (err) {
          console.warn(
            "Auto-syncing Telegram specs with backend failed (expected if non-admin or disconnected):",
            err,
          );
        }
      };

      syncTelegram();
    }
  }, [isAdmin, user]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<MusicPlaylist | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedData = localStorage.getItem("gym_music_last_played_playlist_data");
        if (savedData) return JSON.parse(savedData);
      } catch (e) {}
    }
    return null;
  });
  const [playingPlaylist, setPlayingPlaylist] = useState<MusicPlaylist | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedData = localStorage.getItem("gym_music_last_played_playlist_data");
        if (savedData) return JSON.parse(savedData);
      } catch (e) {}
    }
    return null;
  });
  const [isTracklistOpen, setIsTracklistOpen] = useState(true);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isMembershipDropdownOpen, setIsMembershipDropdownOpen] =
    useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
  };

  useEffect(() => {
    if (user && !authLoading && !user.isAnonymous) {
      const name = user.displayName;
      if (!name || name.includes("@") || name === "Usuario") {
        setShowNicknameModal(true);
      }
    }
  }, [user, authLoading]);



  useEffect(() => {
    const handleOpenAdmin = () => setIsAdminPanelOpen(true);
    window.addEventListener("open-admin-panel", handleOpenAdmin);
    return () =>
      window.removeEventListener("open-admin-panel", handleOpenAdmin);
  }, []);



  useEffect(() => {
    const handleOpenProfile = () => setIsProfileModalOpen(true);
    window.addEventListener("open-profile-modal", handleOpenProfile);
    return () =>
      window.removeEventListener("open-profile-modal", handleOpenProfile);
  }, []);

  useEffect(() => {
    const handleOpenChangelog = () => {
      window.dispatchEvent(new Event("open-notifications"));
    };
    window.addEventListener("open-changelog", handleOpenChangelog);
    return () =>
      window.removeEventListener("open-changelog", handleOpenChangelog);
  }, []);

  const handleSaveNickname = async () => {
    if (!user || !nicknameInput.trim()) return;
    try {
      const { updateProfile } = await import("firebase/auth");
      await updateProfile(user, { displayName: nicknameInput.trim() });
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { displayName: nicknameInput.trim() });
      setShowNicknameModal(false);
      window.location.reload();
    } catch (e) {
      console.error("Error setting nickname", e);
    }
  };

  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    const saved = localStorage.getItem("gym_music_current_track_index");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<MusicPlaylist[]>([]);

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");

  // Spotify-style playlist copier states
  const [isProcessingCopy, setIsProcessingCopy] = useState<boolean>(false);

  const [currentTrackMeta, setCurrentTrackMeta] = useState<any>(null);
  const [mobileView, setMobileView] = useState<"playlists" | "player">(
    "player",
  );

  const [draggedTrackIdx, setDraggedTrackIdx] = useState<number | null>(null);
  const [dragOverTrackIdx, setDragOverTrackIdx] = useState<number | null>(null);

  const handleDropTrack = async (dropIdx: number, event: React.DragEvent) => {
    event.preventDefault();
    if (draggedTrackIdx === null || draggedTrackIdx === dropIdx) {
      setDraggedTrackIdx(null);
      setDragOverTrackIdx(null);
      return;
    }

    if (!selectedPlaylist?.id || selectedPlaylist.id === "all") return;

    const isMasterAdmin = savedSecurityCode === "ho82788278";
    if (selectedPlaylist.ownerId !== user?.uid && !isAdmin && !isMasterAdmin) {
      showNotification("No tienes permisos para editar esta playlist.");
      setDraggedTrackIdx(null);
      setDragOverTrackIdx(null);
      return;
    }

    try {
      const updatedTracks = [...selectedPlaylist.tracks];
      const [draggedItem] = updatedTracks.splice(draggedTrackIdx, 1);
      updatedTracks.splice(dropIdx, 0, draggedItem);

      const docRef = selectedPlaylist.path
        ? doc(db, selectedPlaylist.path)
        : doc(
            db,
            "users",
            selectedPlaylist.ownerId,
            "playlists",
            selectedPlaylist.id,
          );
      const { setDoc } = await import("firebase/firestore");
      await setDoc(
        docRef,
        { tracks: updatedTracks, updatedAt: serverTimestamp() },
        { merge: true },
      );

      const newPlaylistObj = { ...selectedPlaylist, tracks: updatedTracks };
      setSelectedPlaylist(newPlaylistObj);

      if (previewPlaylist?.id === selectedPlaylist.id) {
        setPreviewPlaylist(newPlaylistObj);
      }

      if (playingPlaylist?.id === selectedPlaylist.id) {
        setPlayingPlaylist(newPlaylistObj);
        if (currentTrackIndex === draggedTrackIdx) {
          setCurrentTrackIndex(dropIdx);
        } else if (
          currentTrackIndex > draggedTrackIdx &&
          currentTrackIndex <= dropIdx
        ) {
          setCurrentTrackIndex(currentTrackIndex - 1);
        } else if (
          currentTrackIndex < draggedTrackIdx &&
          currentTrackIndex >= dropIdx
        ) {
          setCurrentTrackIndex(currentTrackIndex + 1);
        }
      }

      setUserPlaylists((prev) =>
        prev.map((p) => (p.id === selectedPlaylist.id ? newPlaylistObj : p)),
      );
      window.dispatchEvent(new Event("refreshUserPlaylists"));
    } catch (error) {
      console.error("Error drop moving track:", error);
      showNotification("Error al mover la canción.");
    }

    setDraggedTrackIdx(null);
    setDragOverTrackIdx(null);
  };

  const [draggedPlaylistId, setDraggedPlaylistId] = useState<string | null>(
    null,
  );
  const [dragOverPlaylistId, setDragOverPlaylistId] = useState<string | null>(
    null,
  );

  const handleDropPlaylist = async (dropId: string, event: React.DragEvent) => {
    event.preventDefault();
    if (!draggedPlaylistId || draggedPlaylistId === dropId) {
      setDraggedPlaylistId(null);
      setDragOverPlaylistId(null);
      return;
    }

    try {
      const currentList = userPlaylists.filter(
        (pl) => pl.ownerId === user?.uid,
      );
      const draggedIdx = currentList.findIndex(
        (p) => p.id === draggedPlaylistId,
      );
      const dropIdx = currentList.findIndex((p) => p.id === dropId);

      if (draggedIdx === -1 || dropIdx === -1) {
        setDraggedPlaylistId(null);
        setDragOverPlaylistId(null);
        return;
      }

      const newOrder = [...currentList];
      const [draggedItem] = newOrder.splice(draggedIdx, 1);
      newOrder.splice(dropIdx, 0, draggedItem);

      // Assign order scores descending
      const baseScore = newOrder.length * 10;
      const { setDoc } = await import("firebase/firestore");
      const promises = newOrder.map((pl, i) => {
        const newScore = baseScore - i;
        const plDocRef = pl.path
          ? doc(db, pl.path)
          : doc(db, "users", pl.ownerId!, "playlists", pl.id);
        return setDoc(plDocRef, { orderScore: newScore }, { merge: true });
      });

      await Promise.all(promises);
    } catch (e) {
      console.error("Error reordering playlist:", e);
    }

    setDraggedPlaylistId(null);
    setDragOverPlaylistId(null);
  };

  const handleMovePlaylistDirectional = async (
    plId: string,
    direction: "up" | "down",
    event: React.MouseEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const reorderable = userPlaylists.filter(
        (pl) =>
          pl.ownerId === user?.uid ||
          isAdmin ||
          savedSecurityCode === "ho82788278",
      );
      const targetPl = reorderable.find((p) => p.id === plId);
      if (!targetPl) return;

      const isRootGroup =
        targetPl.folder === "root" || localFoldersMap[plId] === "root";
      const groupList = reorderable.filter((pl) => {
        if (
          pl.name?.toLowerCase() === "favoritos" ||
          pl.name?.toLowerCase() === "siguiente"
        )
          return false;
        const plIsRoot =
          pl.folder === "root" || localFoldersMap[pl.id] === "root";
        return plIsRoot === isRootGroup;
      });

      const groupIdx = groupList.findIndex((p) => p.id === plId);

      if (groupIdx === -1) return;
      if (direction === "up" && groupIdx === 0) return;
      if (direction === "down" && groupIdx === groupList.length - 1) return;

      const swapTarget =
        direction === "up" ? groupList[groupIdx - 1] : groupList[groupIdx + 1];

      const absoluteList = [...reorderable];
      const absIdx1 = absoluteList.findIndex((p) => p.id === plId);
      const absIdx2 = absoluteList.findIndex((p) => p.id === swapTarget.id);

      [absoluteList[absIdx1], absoluteList[absIdx2]] = [
        absoluteList[absIdx2],
        absoluteList[absIdx1],
      ];

      const baseScore = absoluteList.length * 10;
      const { setDoc } = await import("firebase/firestore");
      const promises = absoluteList.map((pl, i) => {
        const newScore = baseScore - i;
        const plDocRef = pl.path
          ? doc(db, pl.path)
          : doc(db, "users", pl.ownerId || user!.uid, "playlists", pl.id);
        return setDoc(plDocRef, { orderScore: newScore }, { merge: true });
      });

      await Promise.all(promises);
    } catch (e) {
      console.error("Error moving playlist:", e);
    }
  };

  const [showLibrary, setShowLibrary] = useState(false);
  const [isTrackListExpanded, setIsTrackListExpanded] = useState<boolean>(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);
  const [previewPlaylist, setPreviewPlaylist] = useState<MusicPlaylist | null>(
    null,
  );
  const [folderExpanded, setFolderExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem("gym_music_folder_expanded");
    return saved !== "false";
  });
  const [localFoldersMap, setLocalFoldersMap] = useState<
    Record<string, string>
  >(() => {
    const saved = localStorage.getItem("gym_music_local_folders_map");
    return saved ? JSON.parse(saved) : {};
  });
  const [showTracks, setShowTracks] = useState(true);
  useEffect(() => {
    const handlePlayTrackEvent = (e: any) => {
      const track = e.detail;
      if (track) {
        setOverrideCurrentTrack(track);
        setIsPlaying(true);
        loadIframeVideoDirectly(track);
      }
    };
    window.addEventListener('play-track', handlePlayTrackEvent);
    return () => window.removeEventListener('play-track', handlePlayTrackEvent);
  }, []);

  // --- Single Session Enforcer ---
  const myDeviceIdRef = useRef<string>("");
  const [sessionHijacked, setSessionHijacked] = useState(false);

  useEffect(() => {
    let initial = localStorage.getItem("flux_device_id");
    if (!initial) {
      initial =
        Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("flux_device_id", initial);
    }
    myDeviceIdRef.current = initial;
  }, []);

  useEffect(() => {
    if (
      isPlaying &&
      user &&
      accessData &&
      accessData.maxUsers === 1 &&
      !isAdmin
    ) {
      if (accessData.activeSessionId !== myDeviceIdRef.current) {
        import("firebase/firestore").then(({ doc, updateDoc }) => {
          import("../lib/firebase").then(({ db }) => {
            updateDoc(doc(db, "users", user.uid), {
              activeSessionId: myDeviceIdRef.current,
            }).catch(() => {});
          });
        });
      }
    }
  }, [
    isPlaying,
    user,
    accessData?.maxUsers,
    accessData?.activeSessionId,
    isAdmin,
  ]);

  useEffect(() => {
    if (user && accessData && accessData.maxUsers === 1 && !isAdmin) {
      if (
        accessData.activeSessionId &&
        accessData.activeSessionId !== myDeviceIdRef.current
      ) {
        if (isPlaying) {
          setIsPlaying(false);
          setSessionHijacked(true);
        }
      }
    }
  }, [
    accessData?.activeSessionId,
    isPlaying,
    user,
    accessData?.maxUsers,
    isAdmin,
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [youtubeResults, setYoutubeResults] = useState<any[]>([]);
  const [artistDetails, setArtistDetails] = useState<any>(null);
  const [isSearchingYT, setIsSearchingYT] = useState(false);
  const [exploreData, setExploreData] = useState<{
    trending?: any[];
    dailyTop?: any[];
    top100?: any[];
    top20Tendencias?: any[];
    dailyTopPlaylists?: any[];
    workout?: any[];
    focus?: any[];
    trends?: any[];
    latin?: any[];
    party?: any[];
  } | null>(null);
  const [isLoadingExplore, setIsLoadingExplore] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    return localStorage.getItem("gym_music_selected_country") || "ES";
  });

  const [customExplorePlaylists, setCustomExplorePlaylists] = useState<any[]>(
    [],
  );
  const [exploreLayout, setExploreLayout] = useState<any[] | null>(null);

  useEffect(() => {
    const fetchExploreLayout = async () => {
      try {
        const { getDoc, doc } = await import("firebase/firestore");
        const docSnap = await getDoc(doc(db, "admin", `explore_layout_${selectedCountry}`));
        if (docSnap.exists()) {
          setExploreLayout(docSnap.data().sections || []);
        } else if (selectedCountry === "ES") {
          // Fallback to legacy global layout for Spain
          const legacySnap = await getDoc(doc(db, "admin", "explore_layout"));
          if (legacySnap.exists()) {
            setExploreLayout(legacySnap.data().sections || []);
          } else {
            setExploreLayout(null);
          }
        } else {
          setExploreLayout(null);
        }
      } catch (error) {
        console.warn(
          "Permiso denegado para explore_layout o reglas no propagadas:",
          error,
        );
      }
    };
    fetchExploreLayout();

    const handleRefresh = () => fetchExploreLayout();
    window.addEventListener("refreshExplore", handleRefresh);
    return () => window.removeEventListener("refreshExplore", handleRefresh);
  }, [selectedCountry]);

  useEffect(() => {
    const fetchCustomExplorePlaylists = async (force = false) => {
      try {
        const { getDocs, collection, query, orderBy } = await import("firebase/firestore");
        let lists = await fetchWithCache("gym_music_explore_custom_playlists_cache", 1000 * 60 * 60 * 12, async () => {
           const q = query(
             collection(db, "explore_custom_playlists"),
             orderBy("createdAt", "desc"),
           );
           const snap = await getDocs(q);
           return snap.docs.map((doc) => ({
             ...doc.data(),
             docId: doc.id,
           }));
        }, force);
        
        // Filter by country
        lists = lists.filter((p: any) => 
          p.country === selectedCountry || 
          (!p.country && selectedCountry === "ES")
        );
        
        setCustomExplorePlaylists(lists);
      } catch (error) {
        console.warn(
          "Permiso denegado para explorar listas personalizadas, o reglas no propagadas:",
          error,
        );
      }
    };
    fetchCustomExplorePlaylists();

    const handleRefresh = () => fetchCustomExplorePlaylists(true);
    window.addEventListener("refreshExplore", handleRefresh);
    return () => window.removeEventListener("refreshExplore", handleRefresh);
  }, [selectedCountry]);

  const handleAddCustomExplorePlaylist = async (
    url: string,
    sectionId?: string,
  ) => {
    try {
      let id = url.trim();
      let isPlaylist = true;

      const listMatch = url.match(/[?&]list=([^&]+)/i);
      const videoMatch = url.match(/(?:v=|youtu\.be\/)([^&?]+)/i);

      if (listMatch) {
        id = listMatch[1];
      } else if (videoMatch) {
        id = videoMatch[1];
        isPlaylist = false;
      } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
        showNotification(
          "URL inválida de YouTube (falta ID de video o playlist)",
        );
        return;
      } else {
        // If it's a raw ID without URL, we default to playlist, unless it's 11 chars (standard video ID)
        if (id.length === 11) {
          isPlaylist = false;
        }
      }

      if (!id) {
        showNotification("Debes proporcionar un enlace o ID válido.");
        return;
      }

      showNotification(
        isPlaylist
          ? "Obteniendo detalles de la lista..."
          : "Obteniendo detalles del video...",
      );
      const endpoint = isPlaylist
        ? `${API_BASE_URL}/api/youtube/playlist-info?id=${id}`
        : `${API_BASE_URL}/api/youtube/video-info?id=${id}`;
        
      let data: any = { title: "", thumbnail: "", artist: "" };
      
      try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("Backend error");
        data = await res.json();
      } catch (err) {
        // Fallback for Vercel static hosting (no backend)
        try {
          if (isPlaylist) {
             const fallbackRes = await fetch(`https://pipedapi.kavin.rocks/playlists/${id}`);
             if (!fallbackRes.ok) throw new Error("Fallback error");
             const fallbackData = await fallbackRes.json();
             
             data = {
               title: fallbackData.name || "Lista Recomendada",
               thumbnail: fallbackData.thumbnailUrl || (fallbackData.relatedStreams && fallbackData.relatedStreams.length > 0 ? `https://i.ytimg.com/vi/${fallbackData.relatedStreams[0].url.replace("/watch?v=", "")}/mqdefault.jpg` : ""),
               artist: "YouTube"
             };
          } else {
             const standardUrl = url.replace("music.youtube.com", "www.youtube.com");
             const fallbackRes = await fetch(`https://noembed.com/embed?dataType=json&url=${encodeURIComponent(standardUrl)}`);
             if (!fallbackRes.ok) throw new Error("Fallback error");
             const fallbackData = await fallbackRes.json();
             if (fallbackData.error) throw new Error("No encontrado");
             
             data = {
               title: fallbackData.title || "",
               thumbnail: fallbackData.thumbnail_url || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
               artist: fallbackData.author_name || ""
             };
          }
        } catch (e) {
          // If all APIs fail, just use default title but add it anyway
          data = {
             title: isPlaylist ? "Lista de YouTube" : "Video de YouTube",
             thumbnail: isPlaylist ? "" : `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
             artist: "YouTube"
          };
        }
      }

      await addDoc(collection(db, "explore_custom_playlists"), {
        id: id,
        title:
          data.title ||
          (isPlaylist ? "Lista Recomendada" : "Video Recomendado"),
        thumbnail: data.thumbnail || "",
        url: url,
        isPlaylist: isPlaylist,
        artist: data.artist || (isPlaylist ? "Tendencias Globales" : "YouTube"),
        createdAt: serverTimestamp(),
        sectionId: sectionId || "custom_0",
        country: selectedCountry,
      });
      showNotification(
        (isPlaylist ? "Lista" : "Video") + " añadida al Explorador con éxito",
      );
      window.dispatchEvent(new Event("refreshExplore"));
    } catch (e: any) {
      showNotification(e.message || "Error al añadir");
    }
  };

  const handleDeleteCustomExplorePlaylist = async (docId: string) => {
    try {
      await deleteDoc(doc(db, "explore_custom_playlists", docId));
      showNotification("Lista eliminada del Explorador");
      window.dispatchEvent(new Event("refreshExplore"));
    } catch (e: any) {
      showNotification("Error al eliminar la lista");
    }
  };

  const handleUpdateExploreLayout = async (newLayout: any[]) => {
    try {
      await setDoc(doc(db, "admin", `explore_layout_${selectedCountry}`), { sections: newLayout });
      showNotification("Diseño del explorador actualizado");
      window.dispatchEvent(new Event("refreshExplore"));
    } catch (e: any) {
      showNotification(
        "Error al actualizar el diseño: " + (e.message || "Desconocido"),
      );
      console.error("Error update layout:", e);
    }
  };

  // Expanded playlist/mix tracks viewer states
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(
    null,
  );
  const [expandedPlaylistTracks, setExpandedPlaylistTracks] = useState<any[]>(
    [],
  );
  const [isFetchingExpandedTracks, setIsFetchingExpandedTracks] =
    useState<boolean>(false);

  // New intuitive track/playlist placement modal states
  const [trackToAddDestination, setTrackToAddDestination] = useState<
    any | null
  >(null);
  const [isAddingToPlaylistModalOpen, setIsAddingToPlaylistModalOpen] =
    useState(false);
  const [modalNewPlaylistName, setModalNewPlaylistName] = useState("");
  const [modalNewPlaylistDesc, setModalNewPlaylistDesc] = useState("");
  const [modalSelectedPlaylistId, setModalSelectedPlaylistId] =
    useState<string>("new");
  const [isProcessingModalAdd, setIsProcessingModalAdd] = useState(false);


  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingCover, setEditingCover] = useState("");
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  const [editingTrackTitle, setEditingTrackTitle] = useState("");
  const [editingTrackArtist, setEditingTrackArtist] = useState("");
  const [editingTrackDescription, setEditingTrackDescription] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [trackToDeleteConfirm, setTrackToDeleteConfirm] =
    useState<MusicTrack | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const [trackQueue, setTrackQueue] = useState<MusicTrack[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const lastTab = localStorage.getItem("gym_music_last_tab");

        const saved = localStorage.getItem("gym_music_track_queue");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    if (trackQueue.length > 0) {
      try {
        localStorage.setItem(
          "gym_music_track_queue",
          JSON.stringify(trackQueue),
        );
      } catch (e) {}
    } else {
      localStorage.removeItem("gym_music_track_queue");
    }
  }, [trackQueue]);
  const [trackListTab, setTrackListTab] = useState<
    "playlist" | "search" | "queue" | "entertainment" | "radio-fai" | "karaoke" | "artist"
  >(() => (localStorage.getItem("gym_music_last_tab") as any) || "search");
  
  const [hasNewExplore, setHasNewExplore] = useState(false);
  const [hasNewCommunity, setHasNewCommunity] = useState(false);

  useEffect(() => {
    localStorage.setItem("gym_music_last_tab", trackListTab);
  }, [trackListTab]);
  const [playerTab, setPlayerTab] = useState<"artwork" | "siguiente" | "cola">(
    "artwork",
  );
  const trackQueueRef = useRef<MusicTrack[]>([]);

  useEffect(() => {
    trackQueueRef.current = trackQueue;
  }, [trackQueue]);

  useEffect(() => {
    if (!showLibrary) {
      setPreviewPlaylist(null);
    }
  }, [showLibrary]);

  // Memory preservation effects
  useEffect(() => {
    localStorage.setItem(
      "gym_music_current_track_index",
      currentTrackIndex.toString(),
    );
  }, [currentTrackIndex]);

  useEffect(() => {
    if (selectedPlaylist?.id) {
      localStorage.setItem(
        "gym_music_selected_playlist_id",
        selectedPlaylist.id,
      );
    }
  }, [selectedPlaylist]);

  const [overrideCurrentTrack, setOverrideCurrentTrack] = useState<MusicTrack | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const lastTab = localStorage.getItem("gym_music_last_tab");

        const saved = localStorage.getItem("gym_music_override_current_track");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });
  
  const overrideCurrentTrackRef = useRef<MusicTrack | null>(overrideCurrentTrack);
  useEffect(() => {
    overrideCurrentTrackRef.current = overrideCurrentTrack;
    if (overrideCurrentTrack) {
      try {
        localStorage.setItem(
          "gym_music_override_current_track",
          JSON.stringify(overrideCurrentTrack),
        );
      } catch (e) {}
    } else {
      localStorage.removeItem("gym_music_override_current_track");
    }
  }, [overrideCurrentTrack]);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [securityAttempts, setSecurityAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [savedSecurityCode, setSavedSecurityCode] = useState<string | null>(
    null,
  );

  // Persistence for security and block state
  useEffect(() => {
    const savedCode = localStorage.getItem("gym_music_security_code");
    if (savedCode) setSavedSecurityCode(savedCode);

    const blockedTime = localStorage.getItem("gym_music_blocked_until");
    if (blockedTime && Date.now() < parseInt(blockedTime)) {
      setIsBlocked(true);
    }
  }, []);

  const handleBlockUser = () => {
    setIsBlocked(true);
    const blockedUntil = Date.now() + 1000 * 60 * 60; // 1 hour block
    localStorage.setItem("gym_music_blocked_until", blockedUntil.toString());
    alert("Acceso bloqueado por seguridad (1 hora).");
  };

  const [wakeLock, setWakeLock] = useState<any>(null);

  const requestWakeLock = async () => {
    if (!("wakeLock" in navigator)) return;
    if (isEcoMode) return;
    try {
      const lock = await navigator.wakeLock.request("screen");
      setWakeLock(lock);
      console.log("Wake Lock active for training session stability.");
    } catch (err) {
      console.warn("Wake Lock not acquired:", err);
    }
  };

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      try {
        await wakeLock.release();
        setWakeLock(null);
        console.log("Wake Lock released.");
      } catch (err) {
        console.warn("Wake Lock release error:", err);
      }
    }
  }, [wakeLock]);

  // Handle active audio keep-alive and screen wake lock when isPlaying is true
  useEffect(() => {
    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isPlaying]);

  // Maintain mobile audio focus natively

  // Document Visibility & Screen Unlock Event handling to synchronize playback
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (youtubePlayerRef.current) {
          try {
            const currentSec = youtubePlayerRef.current.getCurrentTime() || 0;
            setPosition(currentSec * 1000);
          } catch (e) {}
        }
        if (isPlaying) {
          // Re-establish Screen Wake Lock
          requestWakeLock();

          // Resynchronize and play YouTube player if it got suspended/paused by iOS screen lock
          if (youtubePlayerRef.current) {
            try {
              const intPlayer = youtubePlayerRef.current.getInternalPlayer();
              if (intPlayer && typeof intPlayer.getPlayerState === "function") {
                const state = intPlayer.getPlayerState();
                // Only force play if not already playing (1) or buffering (3)
                if (state !== 1 && state !== 3) {
                  if (typeof intPlayer.playVideo === "function") {
                    intPlayer.playVideo();
                  } else if (typeof intPlayer.play === "function") {
                    intPlayer.play();
                  }
                }
              } else {
                if (intPlayer && typeof intPlayer.playVideo === "function") {
                  intPlayer.playVideo();
                } else if (intPlayer && typeof intPlayer.play === "function") {
                  intPlayer.play();
                }
              }
            } catch (err) {
              console.warn("Resync player error:", err);
            }
          }
        }
      } else if (document.hidden) {
        if (isPlaying) {
          if (youtubePlayerRef.current) {
            try {
              const intPlayer = youtubePlayerRef.current.getInternalPlayer();
              if (intPlayer && typeof intPlayer.playVideo === "function") {
                intPlayer.playVideo();
              } else if (intPlayer && typeof intPlayer.play === "function") {
                intPlayer.play();
              }
            } catch (err) {}
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPlaying]);

  
  
  const [isDucking, setIsDucking] = useState(false);
  const [isDjLoading, setIsDjLoading] = useState(false);
  const lastDjSpeechRef = useRef<number>(0);
  const isDjActiveRef = useRef(false);
  const songsPlayedSinceLastDjRef = useRef<number>(5); // Start at 15 so first play can trigger, then throttles strictly to 15

  const playAiDj = async (context: string, force = false) => {
    // AI DJ functionality completely disabled as requested to keep music uninterrupted
    return;
  };

  const [volume, setVolume] = useState(() => {
    const savedVol = localStorage.getItem("gym_music_volume");
    return savedVol !== null ? parseInt(savedVol, 10) : 70;
  });
  const [lastVolume, setLastVolume] = useState(() =>
    volume > 0 ? volume : 70,
  );
  const volumeRef = useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
    localStorage.setItem("gym_music_volume", volume.toString());
  }, [volume]);
  const [position, setPosition] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gym_music_saved_position");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(() => {
    const saved = localStorage.getItem("gym_music_is_shuffle");
    return saved === "true";
  });
  const [isRepeat, setIsRepeat] = useState(() => {
    const saved = localStorage.getItem("gym_music_is_repeat");
    return saved === "true";
  });
  const isShuffleRef = useRef(isShuffle);

  // Refs for snapshot syncing to avoid React closure stale state
  const playingPlaylistRef = useRef<MusicPlaylist | null>(null);
  const selectedPlaylistRef = useRef<MusicPlaylist | null>(null);
  const currentTrackIndexRef = useRef<number>(0);
  
  const shuffleIndicesRef = useRef<number[]>([]);
  const shufflePositionRef = useRef<number>(0);
  const lastShufflePlaylistIdRef = useRef<string | null>(null);

  useEffect(() => {
    playingPlaylistRef.current = playingPlaylist;
    selectedPlaylistRef.current = selectedPlaylist;
    currentTrackIndexRef.current = currentTrackIndex;
  }, [playingPlaylist, selectedPlaylist, currentTrackIndex]);
  useEffect(() => {
    isShuffleRef.current = isShuffle;
    localStorage.setItem("gym_music_is_shuffle", isShuffle.toString());
  }, [isShuffle]);

  useEffect(() => {
    localStorage.setItem("gym_music_is_repeat", isRepeat.toString());
  }, [isRepeat]);

  const youtubePlayerRef = useRef<any>(null);
  const fallbackSilentAudioRef = useRef<HTMLAudioElement>(null);


  useEffect(() => {
    // Only use the blob source which is set in the audio tag
  }, []);

  const expectedPlayingRef = useRef(false);
  const initialLoadRef = useRef(true);
  const lastPosSaveRef = useRef(0);
  const wasUnexpectedlyPausedRef = useRef(false);
  const isBufferingRef = useRef(false);
  const consecutiveErrorsRef = useRef<number>(0);
  const hasStolenLockForTrackRef = useRef(false);
  const hasEarlySkippedRef = useRef(false);
  const playlistsLoadedInitiallyRef = useRef(false);

  const pendingSeekPosRef = useRef<number | null>(
    typeof window !== "undefined" &&
      localStorage.getItem("gym_music_saved_position")
      ? Number(localStorage.getItem("gym_music_saved_position")) / 1000
      : null,
  );



  const sponsorBlockSegmentsRef = useRef<
    { start: number; end: number; actionType: string }[]
  >([]);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hardware Media Keys fallback listener (Handles Bluetooth steering wheel events that translate to DOM keydowns)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;

      if (e.key === "MediaTrackNext") {
        e.preventDefault();
        handlersRef.current.handleNext();
      } else if (e.key === "MediaTrackPrevious") {
        e.preventDefault();
        handlersRef.current.handlePrev();
      } else if (e.key === "MediaPlayPause") {
        e.preventDefault();
        handlersRef.current.togglePlayback();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Network Recovery Effect
  useEffect(() => {
    const handleOnline = () => {
      if (expectedPlayingRef.current && youtubePlayerRef.current) {
        try {
          const intPlayer = youtubePlayerRef.current.getInternalPlayer();
          if (intPlayer && typeof intPlayer.playVideo === "function") {
            intPlayer.playVideo();
          } else {
            youtubePlayerRef.current.seekTo(position / 1000, "seconds");
          }
        } catch (e) {}
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [position]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && wasUnexpectedlyPausedRef.current) {
        showNotification(
          "Si iOS pausa el audio en reposo, recuerda que puedes pulsar Play desde el centro de control o la pantalla de bloqueo.",
        );
        wasUnexpectedlyPausedRef.current = false;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const userPlaylistsRef = useRef<MusicPlaylist[]>([]);
  useEffect(() => {
    userPlaylistsRef.current = userPlaylists;
  }, [userPlaylists]);

  const positionRef = useRef(position);
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Cloud Sync (Cross-Device Playback Restore)
  useEffect(() => {
    if (!user) return;
    const fetchCloudState = async () => {
      try {
        const { getDoc, doc } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.playerState) {
            const localSaveTime = parseInt(
              localStorage.getItem("gym_music_saved_timestamp") || "0",
              10,
            );
            const cloudSaveTime = data.playerState.timestamp || 0;

            if (cloudSaveTime > localSaveTime) {
              if (data.playerState.playlistId)
                localStorage.setItem(
                  "gym_music_last_played_playlist_id",
                  data.playerState.playlistId,
                );
              if (data.playerState.trackIndex !== undefined)
                localStorage.setItem(
                  "gym_music_current_track_index",
                  data.playerState.trackIndex.toString(),
                );
              if (data.playerState.position !== undefined)
                localStorage.setItem(
                  "gym_music_saved_position",
                  data.playerState.position.toString(),
                );
              localStorage.setItem(
                "gym_music_saved_timestamp",
                cloudSaveTime.toString(),
              );

              // Apply live if already loaded
              if (playlistsLoadedInitiallyRef.current) {
                if (data.playerState.playlistId) {
                  const found = userPlaylistsRef.current.find(
                    (f) => f.id === data.playerState.playlistId,
                  );
                  if (found) {
                    setPlayingPlaylist(found);
                    setSelectedPlaylist(found);
                  }
                }
                if (data.playerState.trackIndex !== undefined)
                  setCurrentTrackIndex(data.playerState.trackIndex);
                if (data.playerState.position !== undefined)
                  setPosition(data.playerState.position);
                if (data.playerState.overrideTrack !== undefined) {
                  setOverrideCurrentTrack(data.playerState.overrideTrack);
                  if (data.playerState.overrideTrack) {
                     try {
                        localStorage.setItem("gym_music_override_current_track", JSON.stringify(data.playerState.overrideTrack));
                     } catch(e) {}
                  } else {
                     localStorage.removeItem("gym_music_override_current_track");
                  }
                }
                if (data.playerState.position !== undefined) {
                  if (
                    youtubePlayerRef.current &&
                    typeof youtubePlayerRef.current.seekTo === "function"
                  ) {
                    youtubePlayerRef.current.seekTo(
                      data.playerState.position / 1000,
                      "seconds",
                    );
                  }
                }
              }
            }
          }
        }
      } catch (e) {}
    };
    fetchCloudState();

    const saveStateToCloud = async () => {
      const plId = playingPlaylistRef.current?.id;
      if (!plId) return;
      const now = Date.now();
      localStorage.setItem("gym_music_saved_timestamp", now.toString());
      localStorage.setItem("gym_music_last_played_playlist_id", plId);
      localStorage.setItem(
        "gym_music_current_track_index",
        currentTrackIndexRef.current.toString(),
      );
      localStorage.setItem(
        "gym_music_saved_position",
        positionRef.current.toString(),
      );
      try {
        const { updateDoc, doc } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        await updateDoc(doc(db, "users", user.uid), {
          playerState: {
            playlistId: plId,
            trackIndex: currentTrackIndexRef.current,
            position: positionRef.current,
            timestamp: now,
            overrideTrack: overrideCurrentTrackRef.current || null,
          },
        });
      } catch (e) {}
    };

    const handleVisibility = () => {
      if (document.hidden) saveStateToCloud();
    };

    window.addEventListener("beforeunload", saveStateToCloud);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("beforeunload", saveStateToCloud);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user]);

  useEffect(() => {
    const now = Date.now();
    if (position === 0 || now - lastPosSaveRef.current > 3000) {
      try {
        localStorage.setItem("gym_music_saved_position", position.toString());
        localStorage.setItem("gym_music_saved_timestamp", now.toString());
        lastPosSaveRef.current = now;
      } catch(e) {}
    }
  }, [position]);

  // Initialize security code from localStorage
  useEffect(() => {
    const savedCode = localStorage.getItem("gym_music_security_code");
    if (savedCode) {
      setSavedSecurityCode(savedCode);
    }
  }, []);

  const displayTracks = React.useMemo(() => {
    return playingPlaylist?.tracks || ALL_DATABASE_TRACKS;
  }, [playingPlaylist]);

  const viewedTracks = React.useMemo(() => {
    return selectedPlaylist?.tracks || ALL_DATABASE_TRACKS;
  }, [selectedPlaylist]);

  const filteredDisplayTracks = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return viewedTracks.map((track, idx) => ({ track, idx }));
    }
    const lowerQuery = searchQuery.trim().toLowerCase();

    const mapped = viewedTracks.map((track, idx) => {
      const lowerTitle = track.title?.toLowerCase() || "";
      const lowerArtist = track.artist?.toLowerCase() || "";
      const isArtistMatch = lowerArtist.includes(lowerQuery);
      const isTitleMatch = lowerTitle.includes(lowerQuery);

      let priority = -1;
      if (lowerArtist === lowerQuery) priority = 4;
      else if (lowerArtist.startsWith(lowerQuery)) priority = 3;
      else if (lowerTitle === lowerQuery) priority = 2;
      else if (lowerTitle.startsWith(lowerQuery)) priority = 1;
      else if (isArtistMatch || isTitleMatch) priority = 0;

      return { track, idx, priority };
    });

    return mapped
      .filter((item) => item.priority > -1)
      .sort((a, b) => b.priority - a.priority)
      .map(({ track, idx }) => ({ track, idx }));
  }, [viewedTracks, searchQuery]);

  const communityPlaylists = React.useMemo(() => {
    const list = userPlaylists.filter((pl) => {
      const isNotFav =
        pl.name.toLowerCase() !== "favoritos" &&
        pl.name.toLowerCase() !== "siguiente";

      if (!isNotFav) return false;

      return true;
    });

    // Deduplicate community playlists by name entirely, prioritizing official ones.
    const map = new Map<string, any>();
    for (const pl of list) {
      const key = pl.name.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, pl);
      } else {
        // Priority: isAdminContent > others
        const existing = map.get(key);
        if (!existing.isAdminContent && pl.isAdminContent) {
          map.set(key, pl);
        }
      }
    }
    return Array.from(map.values()).sort((a: any, b: any) => {
      const getTimestamp = (pl: any) => {
        if (!pl.createdAt) return 0;
        return pl.createdAt.toMillis?.() || (pl.createdAt.seconds ? pl.createdAt.seconds * 1000 : 0) || new Date(pl.createdAt).getTime() || 0;
      };
      return getTimestamp(b) - getTimestamp(a);
    });
  }, [userPlaylists]);

  const communitySearchResults = React.useMemo(() => {
    if (!searchQuery.trim() || trackListTab !== "search") return [];
    const query = searchQuery.trim().toLowerCase();
    return communityPlaylists.filter(
      (pl) =>
        pl.name.toLowerCase().includes(query) ||
        (pl.genre && pl.genre.toLowerCase().includes(query)),
    );
  }, [searchQuery, communityPlaylists, trackListTab]);

  useEffect(() => {
    if (!customExplorePlaylists.length) return;
    const maxCustomCreatedAt = Math.max(...customExplorePlaylists.map(pl => {
      if (!pl.createdAt) return 0;
      return pl.createdAt.toMillis ? pl.createdAt.toMillis() : new Date(pl.createdAt).getTime() || 0;
    }));
    
    const lastViewed = parseInt(localStorage.getItem("last_viewed_explore") || "0", 10);
    
    if (trackListTab === "search") {
      localStorage.setItem("last_viewed_explore", maxCustomCreatedAt.toString());
      setHasNewExplore(false);
    } else if (maxCustomCreatedAt > lastViewed) {
      setHasNewExplore(true);
    }
  }, [customExplorePlaylists, trackListTab]);

  useEffect(() => {
    if (!communityPlaylists.length) return;
    const maxCommunityCreatedAt = Math.max(...communityPlaylists.map(pl => {
      if (!pl.createdAt) return 0;
      return pl.createdAt.toMillis ? pl.createdAt.toMillis() : new Date(pl.createdAt).getTime() || 0;
    }));
    
    const lastViewed = parseInt(localStorage.getItem("last_viewed_community") || "0", 10);
    
    if (showLibrary) {
      localStorage.setItem("last_viewed_community", maxCommunityCreatedAt.toString());
      setHasNewCommunity(false);
    } else if (maxCommunityCreatedAt > lastViewed) {
      setHasNewCommunity(true);
    }
  }, [communityPlaylists, showLibrary]);

  const displayTrackIndex = overrideCurrentTrack ? -1 : currentTrackIndex;

  const baseCurrentTrack =
    displayTracks[currentTrackIndex] ||
    displayTracks[0] ||
    ALL_DATABASE_TRACKS[0];
  const currentTrack = overrideCurrentTrack || baseCurrentTrack;

  const lastTrackIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!currentTrack || !currentTrack.id) return;
    if (lastTrackIdRef.current === null) {
      lastTrackIdRef.current = currentTrack.id;
      return;
    }
    if (lastTrackIdRef.current !== currentTrack.id) {
      lastTrackIdRef.current = currentTrack.id;
      
      // Only increment count if we are in the Radio Flux tab (AI DJ is disabled)
      if (trackListTab === "radio-fai") {
        songsPlayedSinceLastDjRef.current += 1; 
      }
    }
  }, [currentTrack?.id, trackListTab]);

  const currentUrlRaw = currentTrack 
    ? (currentTrack.url || `https://www.youtube.com/watch?v=${currentTrack.id}`) 
    : "";
  const currentUrl = currentUrlRaw.replace("music.youtube.com", "www.youtube.com");

  const reactPlayerConfig = useMemo(() => {
    const vars: any = {
      origin: typeof window !== "undefined" ? window.location.origin : "",
      playsinline: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      iv_load_policy: 3,
      hl: "en",
      vq: "tiny",
    };

    // Removed vars.playlist. We manually handle track skipping and iOS lock screen 'next' via MediaSession API.

    return {
      youtube: { playerVars: vars },
      file: {
        forceAudio: true,
        attributes: { playsInline: true, id: "native-audio" },
      },
    };
  }, [displayTracks, currentTrackIndex, trackQueue]);

  const isNativeMode = false; // Never use native mode, it's blocked by YouTube
  const fetchSponsorBlockSegments = async (url: string) => {
    try {
      const match = url.match(/[?&]v=([^&]+)/);
      let videoId = match ? match[1] : null;
      if (!videoId) {
         try { videoId = new URL(url.replace("music.youtube.com", "www.youtube.com")).searchParams.get("v"); } catch(e) {}
      }
      if (!videoId) return;
      const res = await fetch(`https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}&categories=["sponsor","intro","outro","interaction","selfpromo","music_offtopic"]`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          sponsorBlockSegmentsRef.current = data.map((seg: any) => ({
            start: seg.segment[0],
            end: seg.segment[1],
            actionType: seg.category,
          }));
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    hasStolenLockForTrackRef.current = false;
    hasEarlySkippedRef.current = false;
    if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
    skipTimeoutRef.current = null;
    sponsorBlockSegmentsRef.current = [];
    if (currentTrack?.url) {
      fetchSponsorBlockSegments(currentTrack.url);
    }
  }, [currentTrack?.url, currentTrackIndex]);

  const handlePlaylistImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>, playlist?: any) => {
    const img = e.target as HTMLImageElement;
    if (playlist && playlist.tracks && playlist.tracks.length > 0) {
      const attempts = parseInt(img.dataset.errorCount || "0", 10);
      if (attempts < 5) {
        img.dataset.errorCount = (attempts + 1).toString();
        // Pick a random track from the playlist to try next
        const randomTrack = playlist.tracks[Math.floor(Math.random() * playlist.tracks.length)];
        const nextImg = cleanUrl(randomTrack?.thumbnail_url) || getTrackImage(randomTrack);
        if (nextImg && nextImg !== img.src) {
          img.src = nextImg;
          return;
        }
      }
    }
    img.style.display = "none";
  }, []);

  const togglePlayback = useCallback(() => {
    const nextPlaying = !isPlaying;
    expectedPlayingRef.current = nextPlaying;

    if (nextPlaying) {
      if (fallbackSilentAudioRef.current && fallbackSilentAudioRef.current.paused) {
        fallbackSilentAudioRef.current.play().catch(() => {});
      }
    } else {
      if (fallbackSilentAudioRef.current) {
        fallbackSilentAudioRef.current.pause();
      }
    }

    setIsPlaying(nextPlaying);
  }, [isPlaying]);

  const lastSkipTimeRef = useRef<number>(0);

  const loadIframeVideoDirectly = (targetTrack: any) => {
    hasStolenLockForTrackRef.current = false;
    if (!targetTrack) return;
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: targetTrack.title || "Cargando...",
          artist: targetTrack.artist || "Flux",
          artwork: [
            {
              src:
                targetTrack.thumbnail_url ||
                DEFAULT_MUSIC_COVER,
              sizes: "512x512",
              type: "image/jpeg",
            },
          ],
        });
      } catch (e) {}
    }
    const nextUrlRaw = targetTrack.url || `https://www.youtube.com/watch?v=${targetTrack.id}`;
    const nextUrl = nextUrlRaw.replace("music.youtube.com", "www.youtube.com");
    const match = nextUrl.match(/(?:v=|\/)([\w-]{11})(?:\?|&|\/|$)/);
    if (match && match[1]) {
       const videoId = match[1];
       const intPlayer = youtubePlayerRef.current?.getInternalPlayer();
       if (intPlayer && typeof intPlayer.loadVideoById === "function") {
           if (isDjActiveRef.current) {
             intPlayer.cueVideoById(videoId);
           } else {
             intPlayer.loadVideoById(videoId);
           }
       }
    }
  };

  const handleNext = useCallback((isAutomaticParam = false) => {
    const isAutomatic = isAutomaticParam === true;
    const now = Date.now();
    if (now - lastSkipTimeRef.current < 400) return;
    lastSkipTimeRef.current = now;

    expectedPlayingRef.current = true;
    if (fallbackSilentAudioRef.current && fallbackSilentAudioRef.current.paused) {
      fallbackSilentAudioRef.current.play().catch(() => {});
    }

    const currentActiveTrack =
      overrideCurrentTrack ||
      displayTracks[currentTrackIndex] ||
      displayTracks[0] ||
      ALL_DATABASE_TRACKS[0];
      
    if (currentActiveTrack) {
      recordTrackSkip(currentActiveTrack);
    }

    if (trackListTab === "radio-fai") {
      window.dispatchEvent(new Event("fai_next_track"));
      return;
    }

    let nextTrackTarget = null;
    let nextIndex = 0;

    if (trackQueueRef.current.length > 0) {
      nextTrackTarget = trackQueueRef.current[0];
      setOverrideCurrentTrack(nextTrackTarget);
      
      const newQueue = trackQueueRef.current.slice(1);
      setTrackQueue(newQueue);
      trackQueueRef.current = newQueue;

      // Infinite radio logic: if queue is empty and we are playing a youtube track, fetch more related tracks
      if (newQueue.length === 0 && nextTrackTarget.id.startsWith('yt_temp_')) {
          const ytId = nextTrackTarget.id.replace('yt_temp_', '');
          fetch(`${API_BASE_URL}/api/youtube/upnext?id=${ytId}`)
            .then(r => r.json())
            .then(data => {
              if (data && data.length > 0) {
                const targetIdWithPrefix = `yt_temp_${ytId}`;
                const radioQueue = data
                  .filter((t: any) => t.id !== ytId && t.id !== targetIdWithPrefix)
                  .map((t: any) => ({
                    ...t,
                    id: t.id.startsWith('yt_temp_') ? t.id : `yt_temp_${t.id}`
                  }));
                setTrackQueue(radioQueue);
                trackQueueRef.current = radioQueue;
              }
            }).catch(() => {});
      }

      showNotification(`Siguiente en cola: ${nextTrackTarget.title}`);
      pendingSeekPosRef.current = null;
      setPosition(0);
      setDuration(0);
      setIsPlaying(true);
      loadIframeVideoDirectly(nextTrackTarget);
      return;
    }

    setOverrideCurrentTrack(null);
    pendingSeekPosRef.current = null;
    setPosition(0);
    setDuration(0);

    const tracksList = displayTracks;

    if (isShuffle) {
      if (tracksList.length > 1) {
        const pid = playingPlaylist?.id || "default";
        if (lastShufflePlaylistIdRef.current !== pid || shuffleIndicesRef.current.length !== tracksList.length) {
          const indices = Array.from({ length: tracksList.length }, (_, i) => i);
          for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
          }
          const curr = indices.indexOf(currentTrackIndex);
          if (curr > 0) {
            [indices[0], indices[curr]] = [indices[curr], indices[0]];
          }
          shuffleIndicesRef.current = indices;
          shufflePositionRef.current = 0;
          lastShufflePlaylistIdRef.current = pid;
        } else {
          // If user manually changed track, sync position
          const expectedTrackIndex = shuffleIndicesRef.current[shufflePositionRef.current];
          if (expectedTrackIndex !== currentTrackIndex) {
            const actualPos = shuffleIndicesRef.current.indexOf(currentTrackIndex);
            if (actualPos !== -1) {
              shufflePositionRef.current = actualPos;
            }
          }
        }

        shufflePositionRef.current += 1;
        if (shufflePositionRef.current >= shuffleIndicesRef.current.length) {
          // Re-shuffle when reached end
          const indices = Array.from({ length: tracksList.length }, (_, i) => i);
          for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
          }
          // Avoid playing the same track twice in a row if possible
          if (indices[0] === currentTrackIndex && indices.length > 1) {
             [indices[0], indices[1]] = [indices[1], indices[0]];
          }
          shuffleIndicesRef.current = indices;
          shufflePositionRef.current = 0;
        }
        nextIndex = shuffleIndicesRef.current[shufflePositionRef.current];
        nextTrackTarget = tracksList[nextIndex];
        setCurrentTrackIndex(nextIndex);
      } else {
        const allPlaylistsWithTracks = userPlaylists.filter(
          (pl) => pl.tracks && pl.tracks.length > 0,
        );
        if (allPlaylistsWithTracks.length > 0) {
          const randomPl =
            allPlaylistsWithTracks[
              Math.floor(Math.random() * allPlaylistsWithTracks.length)
            ];
          setSelectedPlaylist(randomPl);
          setPlayingPlaylist(randomPl);
          const randTrackIdx = Math.floor(
            Math.random() * randomPl.tracks.length,
          );
          nextIndex = randTrackIdx;
          nextTrackTarget = randomPl.tracks[randTrackIdx];
          setCurrentTrackIndex(randTrackIdx);
        } else {
          const randDbTrackIdx = Math.floor(
            Math.random() * ALL_DATABASE_TRACKS.length,
          );
          nextIndex = randDbTrackIdx;
          nextTrackTarget = ALL_DATABASE_TRACKS[randDbTrackIdx];
          setCurrentTrackIndex(randDbTrackIdx);
        }
      }
      setIsPlaying(true);
      loadIframeVideoDirectly(nextTrackTarget);
      return;
    }

    if (isRepeat) {
      nextTrackTarget = currentActiveTrack;
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.seekTo(0);
      }
      setIsPlaying(true);
      loadIframeVideoDirectly(nextTrackTarget);
      return;
    }
    
    if (currentTrackIndex < tracksList.length - 1) {
      nextIndex = currentTrackIndex + 1;
    } else if (tracksList.length > 0) {
      nextIndex = 0;
    }
    nextTrackTarget = tracksList[nextIndex];
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
    loadIframeVideoDirectly(nextTrackTarget);
  }, [
    displayTracks,
    currentTrackIndex,
    isShuffle,
    userPlaylists,
    playingPlaylist,
    isRepeat,
    overrideCurrentTrack,
  ]);

  const handlePrev = useCallback(() => {
    const now = Date.now();
    if (now - lastSkipTimeRef.current < 400) return;
    lastSkipTimeRef.current = now;

    expectedPlayingRef.current = true;
    if (fallbackSilentAudioRef.current && fallbackSilentAudioRef.current.paused) {
      fallbackSilentAudioRef.current.play().catch(() => {});
    }

    if (youtubePlayerRef.current) {
      const currentSec = youtubePlayerRef.current.getCurrentTime() || 0;
      if (currentSec > 3) {
        youtubePlayerRef.current.seekTo(0, "seconds");
        setIsPlaying(true);
        return;
      }
    }

    setOverrideCurrentTrack(null);
    pendingSeekPosRef.current = null;
    setPosition(0);
    setDuration(0);

    const tracksList = displayTracks;
    let nextIndex = currentTrackIndex - 1;
    if (nextIndex < 0) {
      nextIndex = tracksList.length > 0 ? tracksList.length - 1 : 0;
    }
    
    let nextTrackTarget = tracksList[nextIndex] || ALL_DATABASE_TRACKS[0];

    if (isShuffle) {
      if (tracksList.length > 1) {
        const pid = playingPlaylist?.id || "default";
        if (lastShufflePlaylistIdRef.current !== pid || shuffleIndicesRef.current.length !== tracksList.length) {
          const indices = Array.from({ length: tracksList.length }, (_, i) => i);
          for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
          }
          const curr = indices.indexOf(currentTrackIndex);
          if (curr > 0) {
            [indices[0], indices[curr]] = [indices[curr], indices[0]];
          }
          shuffleIndicesRef.current = indices;
          shufflePositionRef.current = 0;
          lastShufflePlaylistIdRef.current = pid;
        } else {
          // If user manually changed track, sync position
          const expectedTrackIndex = shuffleIndicesRef.current[shufflePositionRef.current];
          if (expectedTrackIndex !== currentTrackIndex) {
            const actualPos = shuffleIndicesRef.current.indexOf(currentTrackIndex);
            if (actualPos !== -1) {
              shufflePositionRef.current = actualPos;
            }
          }
        }

        shufflePositionRef.current -= 1;
        if (shufflePositionRef.current < 0) {
          shufflePositionRef.current = shuffleIndicesRef.current.length - 1;
        }
        nextIndex = shuffleIndicesRef.current[shufflePositionRef.current];
        nextTrackTarget = tracksList[nextIndex];
        setCurrentTrackIndex(nextIndex);
      } else {
        const allPlaylistsWithTracks = userPlaylists.filter(
          (pl) => pl.tracks && pl.tracks.length > 0,
        );
        if (allPlaylistsWithTracks.length > 0) {
          const randomPl =
            allPlaylistsWithTracks[
              Math.floor(Math.random() * allPlaylistsWithTracks.length)
            ];
          setSelectedPlaylist(randomPl);
          setPlayingPlaylist(randomPl);
          const randTrackIdx = Math.floor(Math.random() * randomPl.tracks.length);
          nextIndex = randTrackIdx;
          nextTrackTarget = randomPl.tracks[randTrackIdx];
          setCurrentTrackIndex(randTrackIdx);
        } else {
          const randDbTrackIdx = Math.floor(
            Math.random() * ALL_DATABASE_TRACKS.length,
          );
          nextIndex = randDbTrackIdx;
          nextTrackTarget = ALL_DATABASE_TRACKS[randDbTrackIdx];
          setCurrentTrackIndex(randDbTrackIdx);
        }
      }
      setIsPlaying(true);
      loadIframeVideoDirectly(nextTrackTarget);
      return;
    }

    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
    loadIframeVideoDirectly(nextTrackTarget);
  }, [
    currentTrackIndex,
    isShuffle,
    displayTracks,
    userPlaylists,
    playingPlaylist,
    duration,
  ]);

  // Fetch meta for custom UI
  useEffect(() => {
    if (currentUrl) {
      fetchMetadata(currentUrl).then((meta) => {
        if (meta) {
          setCurrentTrackMeta(meta);
        }
      });
    }
  }, [currentTrack, currentUrl]);

  const pendingRestorePlayingRef = useRef<string | null>(
    typeof window !== "undefined"
      ? localStorage.getItem("gym_music_last_played_playlist_id")
      : null,
  );
  const pendingRestoreSelectedRef = useRef<string | null>(
    typeof window !== "undefined"
      ? localStorage.getItem("gym_music_selected_playlist_id")
      : null,
  );

  const communityDocsRef = useRef<any[]>([]);
  const userDocsRef = useRef<any[]>([]);

  // Sync with Firestore (Optimized: fetch global lists statically with limit, and user lists in real-time)
  useEffect(() => {
    let unsubscribeUser = () => {};

    const processMergedDocs = () => {
      const normalizeDoc = (doc: any) => {
        if (typeof doc.data === 'function') {
           return { id: doc.id, data: doc.data(), ref: { path: doc.ref.path } };
        }
        return { id: doc.id, data: doc._data || doc.data || {}, ref: { path: doc.ref?.path || "" } };
      };

      // Unir documentos, dando prioridad a las versiones del usuario
      const combined = new Map();
      communityDocsRef.current.forEach((doc) => combined.set(doc.id, normalizeDoc(doc)));
      userDocsRef.current.forEach((doc) => combined.set(doc.id, normalizeDoc(doc)));

      const mergedDocs = Array.from(combined.values());

      mergedDocs.sort((a, b) => {
        const orderA =
          typeof a.data.orderScore === "number" ? a.data.orderScore : 0;
        const orderB =
          typeof b.data.orderScore === "number" ? b.data.orderScore : 0;
        if (orderA !== orderB) {
          return orderB - orderA; // Descending
        }
        const tA = a.data.createdAt?.toMillis?.() || (a.data.createdAt?.seconds ? a.data.createdAt.seconds * 1000 : 0) || a.data.createdAt || 0;
        const tB = b.data.createdAt?.toMillis?.() || (b.data.createdAt?.seconds ? b.data.createdAt.seconds * 1000 : 0) || b.data.createdAt || 0;
        return tB - tA;
      });

      const folders = mergedDocs
        .map((doc) => {
          const data = doc.data;
          let ownerId = data.ownerId;

          if (!ownerId && doc.ref.path.includes("users/")) {
            const segments = doc.ref.path.split("/");
            const userIdx = segments.indexOf("users");
            if (userIdx !== -1 && segments[userIdx + 1]) {
              ownerId = segments[userIdx + 1];
            }
          }

          const rawTracks = data.tracks || [];
          const cleanedTracks = rawTracks.filter((track: any) => {
            const url = track.url || "";
            return (
              !url.toLowerCase().includes("soundcloud.com") &&
              !url.toLowerCase().includes("snd.sc")
            );
          });

          const realNames = [
            "Elena Rossi",
            "Marc Volkov",
            "Mia Chen",
            "Lucas Mendez",
            "Aria Jensen",
            "Oliver Wright",
            "Isabella Santos",
            "Kaito Tanaka",
            "Emma Laurent",
            "Julian Vane",
            "Nina Petrova",
            "Leo Moretti",
            "Zara Khalid",
            "Hugo Becker",
            "Maya Lindholm",
          ];
          const nameIndex =
            doc.id
              .split("")
              .reduce(
                (acc: number, char: string) => acc + char.charCodeAt(0),
                0,
              ) % realNames.length;
          const fakeOwnerName = realNames[nameIndex];

          const isAdminContent =
            data.ownerId === "ho82788278" ||
            data.adminSecret === "ho82788278" ||
            data.ownerName?.toLowerCase() === "administrador" ||
            data.ownerName === "eltygere8651" ||
            data.ownerName?.toLowerCase() === "adoni";

          return {
            id: doc.id,
            ...data,
            ownerId: ownerId,
            path: doc.ref.path,
            ownerName: isAdminContent
              ? "#fluxmusicoficial"
              : data.ownerName &&
                  data.ownerName !== "Administrador" &&
                  data.ownerName !== "eltygere8651" &&
                  data.ownerName !== "Usuario" &&
                  !data.ownerName.includes("@")
                ? data.ownerName
                : fakeOwnerName,
            tracks: cleanedTracks,
            isAdminContent: isAdminContent,
          };
        })
        .sort(
          (a: any, b: any) =>
            (b.isAdminContent ? 1 : 0) - (a.isAdminContent ? 1 : 0),
        )
        .filter((pl: any, index: number, self: any[]) => {
          if (user && pl.ownerId === user.uid) return true;
          if (!pl.tracks || pl.tracks.length === 0) return false;
          return self.findIndex((t) => t.name === pl.name) === index;
        })
        .filter((pl: any) => {
          const isMartina = pl.name?.toLowerCase().includes("martina");
          if (isMartina) return true;
          const isSoundCloud =
            pl.name?.toLowerCase().includes("soundcloud") ||
            pl.description?.toLowerCase().includes("soundcloud") ||
            pl.genre?.toLowerCase().includes("soundcloud");
          if (isSoundCloud) return false;
          return true;
        }) as any as MusicPlaylist[];

      const sortedFolders = folders.sort((a: any, b: any) => {
        if (a.name?.toLowerCase() === "favoritos") return -1;
        if (b.name?.toLowerCase() === "favoritos") return 1;
        return 0;
      });

      setUserPlaylists(sortedFolders);

      // Attempt seamless state restore
      if (
        (pendingRestorePlayingRef.current || pendingRestoreSelectedRef.current) &&
        !selectedPlaylistRef.current &&
        !playingPlaylistRef.current
      ) {
        let playingFound = folders.find((f) => f.id === pendingRestorePlayingRef.current);
        let selectedFound = folders.find((f) => f.id === pendingRestoreSelectedRef.current);
        
        if (!playingFound && pendingRestorePlayingRef.current) {
          try {
            const savedData = localStorage.getItem("gym_music_last_played_playlist_data");
            if (savedData) {
              const parsed = JSON.parse(savedData);
              if (parsed && parsed.id === pendingRestorePlayingRef.current) {
                playingFound = parsed;
              }
            }
          } catch (e) {
            console.warn("Failed to parse saved playlist data", e);
          }
        }

        if (playingFound) {
          setPlayingPlaylist(playingFound);
          if (!selectedFound) setSelectedPlaylist(playingFound);
        }
        
        if (selectedFound) {
          setSelectedPlaylist(selectedFound);
        }

        if (playingFound || selectedFound) {
          const lastTab = localStorage.getItem("gym_music_last_tab");
          if (lastTab !== "entertainment") {
            setTrackListTab("playlist");
          }
          if (playingFound) setMobileView("player");
          pendingRestorePlayingRef.current = null;
          pendingRestoreSelectedRef.current = null;
        }
      }

      const currentSelected = selectedPlaylistRef.current;
      const currentPlaying = playingPlaylistRef.current;
      const currentTrackIdx = currentTrackIndexRef.current;

      if (currentSelected) {
        const updatedSelected = folders.find(
          (f) => f.id === currentSelected.id,
        );
        if (updatedSelected) {
          const tracksSame =
            currentSelected.tracks?.length === updatedSelected.tracks?.length &&
            currentSelected.tracks?.every(
              (t: any, i: number) =>
                (t.id && t.id === updatedSelected.tracks[i]?.id) ||
                (t.url && t.url === updatedSelected.tracks[i]?.url),
            );
          const metadataSame =
            currentSelected.name === updatedSelected.name &&
            currentSelected.thumbnail_url === updatedSelected.thumbnail_url;
          if (!tracksSame || !metadataSame)
            setSelectedPlaylist(updatedSelected);
        }
      }

      if (currentPlaying) {
        const updatedPlaying = folders.find((f) => f.id === currentPlaying.id);
        if (updatedPlaying) {
          const tracksSame =
            currentPlaying.tracks?.length === updatedPlaying.tracks?.length &&
            currentPlaying.tracks?.every(
              (t: any, i: number) =>
                (t.id && t.id === updatedPlaying.tracks[i]?.id) ||
                (t.url && t.url === updatedPlaying.tracks[i]?.url),
            );
          const metadataSame =
            currentPlaying.name === updatedPlaying.name &&
            currentPlaying.thumbnail_url === updatedPlaying.thumbnail_url;

          if (!tracksSame || !metadataSame) {
            const currentTracksList = currentPlaying.tracks || [];
            const playingTrack = currentTracksList[currentTrackIdx];

            setPlayingPlaylist(updatedPlaying);

            if (
              playingTrack &&
              updatedPlaying.tracks &&
              updatedPlaying.tracks.length > 0
            ) {
              const trackAtCurrentIdx = updatedPlaying.tracks[currentTrackIdx];
              let isSameAtCurrent = false;
              if (trackAtCurrentIdx) {
                isSameAtCurrent =
                  (playingTrack.id &&
                    trackAtCurrentIdx.id === playingTrack.id) ||
                  (playingTrack.url &&
                    trackAtCurrentIdx.url === playingTrack.url);
              }

              if (!isSameAtCurrent) {
                const newIdx = updatedPlaying.tracks.findIndex(
                  (t: any) =>
                    (playingTrack.id && t.id === playingTrack.id) ||
                    (playingTrack.url && t.url === playingTrack.url),
                );
                if (newIdx !== -1) {
                  setCurrentTrackIndex(newIdx);
                } else {
                  setOverrideCurrentTrack(playingTrack);
                }
              }
            }
          }
        }
      }
    };

    const fetchCommunity = async (force = false) => {
      try {
        const { getDocs, collectionGroup, query, orderBy, limit, where } = await import("firebase/firestore");
        const data = await fetchWithCache("gym_music_community_cache", 1000 * 60, async () => {
           const qComm = query(
             collectionGroup(db, "playlists"),
             where("isPublic", "==", true),
             orderBy("createdAt", "desc"),
             limit(50),
           );
           const snap = await getDocs(qComm);
           return snap.docs.map(doc => ({
             id: doc.id,
             _data: doc.data(),
             ref: { path: doc.ref.path }
           }));
        }, force);
        communityDocsRef.current = data;
        processMergedDocs();
      } catch (e) {
        console.error("Error fetching community playlists", e);
      }
    };
    fetchCommunity();

    const handleRefreshCommunity = () => fetchCommunity(true);
    window.addEventListener("refreshCommunity", handleRefreshCommunity);

    const fetchUserPlaylists = async (force = false) => {
      if (isTemporaryUser) { showNotification("Esta función está disponible exclusivamente para usuarios Premium."); return; } if (!user) {
        userDocsRef.current = [];
        processMergedDocs();
        return;
      }
      try {
        const { getDocs, collection, query, orderBy } = await import("firebase/firestore");
        const data = await fetchWithCache(`gym_music_user_cache_${user.uid}`, 30000, async () => {
          const qUser = query(
            collection(db, "users", user.uid, "playlists"),
            orderBy("createdAt", "desc"),
          );
          const snap = await getDocs(qUser);
          return snap.docs.map(doc => ({
             id: doc.id,
             _data: doc.data(),
             ref: { path: doc.ref.path }
          }));
        }, force);
        userDocsRef.current = data;
        processMergedDocs();
      } catch (error) {
        console.error("Error fetching user playlists", error);
      }
    };
    fetchUserPlaylists();

    const handleRefresh = () => fetchUserPlaylists(true);
    window.addEventListener("refreshUserPlaylists", handleRefresh);

    return () => {
      window.removeEventListener("refreshUserPlaylists", handleRefresh);
      window.removeEventListener("refreshCommunity", handleRefreshCommunity);
    };
  }, [user, isAdmin]);

  useEffect(() => {
    if (playingPlaylist) {
      localStorage.setItem(
        "gym_music_last_played_playlist_id",
        playingPlaylist.id,
      );
    } else {
      localStorage.removeItem("gym_music_last_played_playlist_id");
      localStorage.removeItem("gym_music_last_played_playlist_data");
    }
    if (playingPlaylist) {
      try {
        localStorage.setItem(
          "gym_music_last_played_playlist_data",
          JSON.stringify(playingPlaylist)
        );
      } catch (e) {
        console.warn("Could not save playing playlist data", e);
      }
    }
  }, [playingPlaylist]);

  // Synchronous reproduction/play incrementer logic for community/smart metadata
  useEffect(() => {
    if (isPlaying && playingPlaylist && playingPlaylist.id) {
      try {
        const storedPlays = localStorage.getItem("flux_playlist_playbacks");
        const playsMap = storedPlays ? JSON.parse(storedPlays) : {};
        const currentCount = playsMap[playingPlaylist.id] || 0;

        const trackIdKey = currentTrack?.id || "unknown";
        const lastIncrementKey = `flux_last_play_inc_${playingPlaylist.id}_${trackIdKey}`;
        const lastIncremented = sessionStorage.getItem(lastIncrementKey);

        if (!lastIncremented) {
          playsMap[playingPlaylist.id] = currentCount + 1;
          localStorage.setItem(
            "flux_playlist_playbacks",
            JSON.stringify(playsMap),
          );
          sessionStorage.setItem(lastIncrementKey, "1");
          if (currentTrack) {
            recordTrackPlay(currentTrack);
          }
        }
      } catch (e) {
        console.warn("Unable to increment play count:", e);
      }
    }
  }, [isPlaying, playingPlaylist?.id, currentTrack?.id]);

  useEffect(() => {
    if (trackListTab === "search" && !exploreData && !isLoadingExplore) {
      const fetchExplore = async () => {
        setIsLoadingExplore(true);
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/youtube/explore?country=${selectedCountry || "ES"}`,
          );
          if (res.ok) {
            const data = await res.json();

            // --- SILENT MIX PARA TI INJECTION ---
            try {
              const history = getPlayHistory();
              const historyList = Object.values(history);
              if (historyList.length > 2) {
                // Ensure arrays exist
                data.mixParaTi = [];

                // Mix 1: Tus Más Escuchados
                const topPlayed = [...historyList]
                  .sort((a, b) => b.playCount - a.playCount)
                  .slice(0, 30);
                if (topPlayed.length > 0) {
                  data.mixParaTi.push({
                    id: "mix_mas_escuchados",
                    title: "Tus Más Escuchados",
                    artist: "Historia Flux",
                    isPlaylist: true,
                    isLocalMix: true,
                    thumbnail: topPlayed[0].url
                      ? undefined
                      : `https://i.ytimg.com/vi/${topPlayed[0].trackId}/mqdefault.jpg`,
                    tracks: topPlayed.map((t, i) => {
                      let vId = t.trackId;
                      if (t.url && t.url.includes("v=")) {
                        vId = t.url.split("v=")[1].split("&")[0];
                      }
                      return {
                        id: `local_his_${i}_${vId}`,
                        title: t.title,
                        artist: t.artist,
                        duration: "0:00",
                        url: t.url || `https://www.youtube.com/watch?v=${vId}`,
                        thumbnail: `https://i.ytimg.com/vi/${vId}/mqdefault.jpg`,
                      };
                    }),
                  });
                  // Fix thumbnail
                  const firstTrack = data.mixParaTi[0].tracks[0];
                  data.mixParaTi[0].thumbnail = firstTrack.thumbnail;
                }

                // Mix 2: Mix Descubrimiento (Silent YouTube search based on multiple top played artists)
                const topUniqueArtists: string[] = [];
                for (const item of topPlayed) {
                  const artistName =
                    item.artist || item.title?.split("-")[0]?.trim();
                  if (
                    artistName &&
                    artistName !== "Artista" &&
                    artistName !== "Flux" &&
                    !topUniqueArtists.includes(artistName)
                  ) {
                    topUniqueArtists.push(artistName);
                    if (topUniqueArtists.length >= 6) break;
                  }
                }

                if (topUniqueArtists.length > 0) {
                  setTimeout(() => {
                    Promise.all(
                      topUniqueArtists.map(
                        (artist) =>
                          fetch(
                            `${API_BASE_URL}/api/youtube/search?q=${encodeURIComponent(artist + " audio")}`,
                          )
                            .then((res) => (res.ok ? res.json() : []))
                            .catch(() => []), // Prevent single failures from rejecting all
                      ),
                    )
                      .then((results) => {
                        const mixedTracks: any[] = [];
                        const maxLen = Math.max(
                          0,
                          ...results.map((r) =>
                            Array.isArray(r) ? r.length : 0,
                          ),
                        );

                        for (let i = 0; i < maxLen; i++) {
                          for (let j = 0; j < results.length; j++) {
                            const trackList = results[j];
                            if (Array.isArray(trackList)) {
                              const track = trackList[i];
                              if (track && !track.isPlaylist && isReasonableTrack(track.duration, track.title)) {
                                // Avoid duplicate tracks
                                if (
                                  !mixedTracks.find(
                                    (t) =>
                                      t.url === track.url || t.id === track.id,
                                  )
                                ) {
                                  mixedTracks.push(track);
                                }
                              }
                            }
                          }
                          if (mixedTracks.length >= 40) break;
                        }

                        if (mixedTracks.length > 3) {
                          setExploreData((prev: any) => {
                            if (!prev) return prev;
                            const newPrev = { ...prev };
                            newPrev.mixParaTi = newPrev.mixParaTi || [];
                            newPrev.mixParaTi = newPrev.mixParaTi.filter(
                              (m: any) => m.id !== "mix_descubrimiento",
                            );

                            const titleString =
                              topUniqueArtists.slice(0, 3).join(", ") +
                              (topUniqueArtists.length > 3 ? " y más" : "");

                            newPrev.mixParaTi.push({
                              id: "mix_descubrimiento",
                              title: "Mix Descubrimiento",
                              artist: "Basado en " + titleString,
                              isPlaylist: true,
                              isLocalMix: true,
                              thumbnail:
                                mixedTracks[0]?.thumbnail ||
                                `https://i.ytimg.com/vi/${mixedTracks[0]?.id}/mqdefault.jpg`,
                              tracks: mixedTracks.map((t: any, i: number) => ({
                                id: `local_rec_${i}_${t.id}`,
                                title: t.title,
                                artist: t.artist || "Descubrimiento",
                                duration: t.duration || "0:00",
                                url:
                                  t.url ||
                                  `https://www.youtube.com/watch?v=${t.id}`,
                                thumbnail:
                                  t.thumbnail ||
                                  `https://i.ytimg.com/vi/${t.id}/mqdefault.jpg`,
                              })),
                            });
                            return newPrev;
                          });
                        }
                      })
                      .catch((e) => console.warn("Discovery Mix Error:", e));
                  }, 800); // 800ms delay to not block UI thread
                }
              }
            } catch (e) {
              console.warn("Silent Mix Gen Error:", e);
            }
            // -------------------------------------

            setExploreData(data);
          } else {
            throw new Error("Explore API failed");
          }
        } catch (err) {
          console.error("Explore fallback:", err);
          setExploreData({
            trending: [],
            dailyTop: [],
            top100: [],
            workout: [],
            focus: [],
            trends: [],
            latin: [],
            party: [],
          });
        } finally {
          setIsLoadingExplore(false);
        }
      };
      fetchExplore();
    }
  }, [trackListTab, exploreData, isLoadingExplore, selectedCountry]);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const handleNextRef = useRef(handleNext);
  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  const metadataCacheRef = useRef<Record<string, any>>({});

  const fetchMetadata = async (url: string) => {
    if (metadataCacheRef.current[url]) {
      return metadataCacheRef.current[url];
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/oembed?url=${encodeURIComponent(url)}`);
      if (!res.ok) return null;

      const data = await res.json();
      metadataCacheRef.current[url] = data;
      return data;
    } catch (e) {
      console.error("Metadata fetch error via proxy", e);
    }
    return null;
  };


  const toggleMoverPlaylistACarpeta = async (
    playlist: MusicPlaylist,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const isInFolder =
      playlist.folder !== "root" && localFoldersMap[playlist.id] !== "root";
    const nextFolderValue = isInFolder ? "root" : "general";

    // Update local state instantly
    const updatedMap = { ...localFoldersMap };
    if (isInFolder) {
      updatedMap[playlist.id] = "root";
    } else {
      delete updatedMap[playlist.id];
    }
    setLocalFoldersMap(updatedMap);
    localStorage.setItem(
      "gym_music_local_folders_map",
      JSON.stringify(updatedMap),
    );

    if (user) {
      try {
        const plRef = doc(db, "users", user.uid, "playlists", playlist.id);
        await updateDoc(plRef, {
          folder: nextFolderValue,
          updatedAt: serverTimestamp(),
        });
        window.dispatchEvent(new Event("refreshUserPlaylists"));
      window.dispatchEvent(new Event("refreshCommunity"));
      } catch (err) {
        console.error(
          "Firebase folder field update failed, fell back to local state:",
          err,
        );
      }
    }

    showNotification(
      isInFolder ? "Sacado de Tus Listas" : "Añadido a Tus Listas",
    );
  };
  const handleAddNewCanalClick = () => {
    if (isTemporaryUser) {
        showNotification("Esta función está disponible exclusivamente para usuarios Premium.");
        return;
    }
    setTrackToAddDestination(null);
    setModalNewPlaylistName("");
    setModalNewPlaylistDesc("");
    setModalSelectedPlaylistId("new");
    setIsAddingToPlaylistModalOpen(true);
    setShowLibrary(false);
  };


  const startEditing = (pl: MusicPlaylist) => {
    setEditingId(pl.id);
    setEditingName(pl.name);
    setEditingDescription(pl.description || "");
    setEditingCover(getPlaylistImage(pl) || "");
    setAuthCode(savedSecurityCode || "");
  };

  const saveEdit = async () => {
    if (!editingId) return;

    if (isBlocked) {
      alert(
        "Acceso bloqueado por demasiados intentos fallidos. Reinicia la aplicación.",
      );
      return;
    }

    const isMasterAdmin = (authCode || savedSecurityCode) === "ho82788278";
    const isPremiumUser = accessData?.isValid;

    if (!isAdmin && !isMasterAdmin && !isPremiumUser) {
      const nextAttempts = securityAttempts + 1;
      setSecurityAttempts(nextAttempts);
      if (nextAttempts >= 2) {
        handleBlockUser();
      } else {
        alert(
          `Código incorrecto o acceso no autorizado. Te queda ${2 - nextAttempts} intento.`,
        );
      }
      return;
    }

    try {
      // Ensure user is signed in (anonymously if needed) to satisfy firestore rules
      let currentUser = user;
      if (!currentUser) {
        const {
          signInAnonymously: firebaseSignInAnonymously,
          auth: firebaseAuth,
        } = await import("../lib/firebase");
        const cred = await firebaseSignInAnonymously(firebaseAuth);
        currentUser = cred.user;
      }

      const pl = userPlaylists.find((p) => p.id === editingId);
      if (!pl) {
        alert("Playlist no encontrada.");
        return;
      }

      const targetOwnerId = pl.ownerId;
      if (!targetOwnerId) {
        alert("No se pudo determinar el propietario (ownerId missing).");
        return;
      }

      const desc = editingDescription.trim();
      const songsContext =
        pl.tracks && pl.tracks.length > 0
          ? `, inspired by songs like: ${pl.tracks
              .slice(0, 8)
              .map((t: any) => t.title)
              .join(", ")}`
          : "";
      const promptBase = `Abstract artistic music album cover for "${editingName}"${desc ? " theme: " + desc : ""}${songsContext}`;
      const prompt = encodeURIComponent(
        `${promptBase}, highly detailed, stunning lighting, 4k, no text, no fonts, no words, beautiful vibrant layout`,
      );
      const randomSeed = Math.floor(Math.random() * 1000000);
      const generatedCoverUrl = `https://image.pollinations.ai/prompt/${prompt}?width=400&height=400&nologo=true&seed=${randomSeed}`;

      const coverToSave = editingCover.trim() || generatedCoverUrl;

      const docRef = pl.path
        ? doc(db, pl.path)
        : doc(db, "users", targetOwnerId, "playlists", editingId);
      await updateDoc(docRef, {
        name: editingName,
        description: editingDescription,
        thumbnail_url: coverToSave,
        updatedAt: serverTimestamp(),
      });
      window.dispatchEvent(new Event("refreshUserPlaylists"));
      window.dispatchEvent(new Event("refreshCommunity"));
      setEditingId(null);
      alert("Canal actualizado.");
    } catch (error: any) {
      console.error("Error saving edit", error);
      alert(`Error al guardar: ${error.message || "Verifica tus permisos."}`);
    }
  };

  const startDeleting = (plId: string) => {
    setDeletingId(plId);
    setAuthCode(savedSecurityCode || "");
  };

  const executeDelete = async () => {
    if (!deletingId || isDeleting) return;

    const pl = userPlaylists.find((p) => p.id === deletingId);
    if (!pl) {
      alert("Canal no encontrado en la lista actual.");
      setDeletingId(null);
      return;
    }

    // Check if user is owner
    const isOwner = user && pl.ownerId === user.uid;

    if (isBlocked) {
      alert("Acceso bloqueado por demasiados intentos fallidos.");
      return;
    }

    const isSystemMasterPlaylist = pl.adminSecret === "ho82788278";
    const needsPasscode = isSystemMasterPlaylist && !isAdmin && !isOwner;

    if (needsPasscode) {
      const actualCode = authCode || savedSecurityCode;
      if (actualCode !== "ho82788278") {
        const nextAttempts = securityAttempts + 1;
        setSecurityAttempts(nextAttempts);
        if (nextAttempts >= 2) {
          handleBlockUser();
        } else {
          alert(`Código incorrecto. Te queda ${2 - nextAttempts} intento.`);
        }
        return;
      }
      if (!savedSecurityCode) {
        localStorage.setItem("gym_music_security_code", actualCode);
        setSavedSecurityCode(actualCode);
      }
    }

    try {
      setIsDeleting(true);
      // Ensure user is signed in (anonymously if needed) to satisfy firestore rules
      let currentUser = user;
      if (!currentUser) {
        const {
          signInAnonymously: firebaseSignInAnonymously,
          auth: firebaseAuth,
        } = await import("../lib/firebase");
        const cred = await firebaseSignInAnonymously(firebaseAuth);
        currentUser = cred.user;
      }

      const targetOwnerId = pl.ownerId;
      if (!targetOwnerId) {
        alert("No se pudo determinar el propietario para borrar.");
        setDeletingId(null);
        return;
      }

      const docRef = pl.path
        ? doc(db, pl.path)
        : doc(db, "users", targetOwnerId, "playlists", deletingId);
      await deleteDoc(docRef);
      window.dispatchEvent(new Event("refreshUserPlaylists"));
      window.dispatchEvent(new Event("refreshCommunity"));

      if (selectedPlaylist?.id === deletingId) {
        setSelectedPlaylist(null);
      }

      setDeletingId(null);
      alert("Canal eliminado con éxito.");
    } catch (error: any) {
      console.error("Error deleting", error);
      alert(
        `Error al eliminar: ${error.message || "Verifica tu conexión y permisos."}`,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const logoutSecurity = () => {
    if (confirm("¿Cerrar sesión de seguridad y olvidar el código maestro?")) {
      localStorage.removeItem("gym_music_security_code");
      setSavedSecurityCode(null);
      setAuthCode("");
      alert("Sesión de seguridad cerrada.");
    }
  };

  const handleDeleteTrack = async (
    trackToDelete: MusicTrack,
    event: React.MouseEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (!selectedPlaylist?.id || selectedPlaylist.id === "all") return;

    const isMasterAdmin = savedSecurityCode === "ho82788278";
    if (selectedPlaylist.ownerId !== user?.uid && !isAdmin && !isMasterAdmin) {
      showNotification("No tienes permisos para eliminar.");
      return;
    }

    setTrackToDeleteConfirm(trackToDelete);
  };

  const executeDeleteTrack = async () => {
    if (
      !trackToDeleteConfirm ||
      !selectedPlaylist?.id ||
      selectedPlaylist.id === "all"
    )
      return;

    try {
      const docRef = selectedPlaylist.path
        ? doc(db, selectedPlaylist.path)
        : doc(
            db,
            "users",
            selectedPlaylist.ownerId,
            "playlists",
            selectedPlaylist.id,
          );
      const updatedTracks = selectedPlaylist.tracks.filter(
        (t: any) => t.id !== trackToDeleteConfirm.id,
      );
      const { setDoc } = await import("firebase/firestore");
      await setDoc(
        docRef,
        { tracks: updatedTracks, updatedAt: serverTimestamp() },
        { merge: true },
      );

      const newPlaylistObj = { ...selectedPlaylist, tracks: updatedTracks };
      setSelectedPlaylist(newPlaylistObj);

      if (previewPlaylist?.id === selectedPlaylist.id) {
        setPreviewPlaylist(newPlaylistObj);
      }
      if (playingPlaylist?.id === selectedPlaylist.id) {
        setPlayingPlaylist(newPlaylistObj);
      }

      setUserPlaylists((prev) =>
        prev.map((p) => (p.id === selectedPlaylist.id ? newPlaylistObj : p)),
      );
      window.dispatchEvent(new Event("refreshUserPlaylists"));

      showNotification(
        `"${trackToDeleteConfirm.title}" de "${selectedPlaylist.name}" eliminada`,
      );
    } catch (error) {
      console.error("Error removing track:", error);
      showNotification("Error al eliminar la canción.");
    } finally {
      setTrackToDeleteConfirm(null);
    }
  };

  const startEditingTrack = (track: MusicTrack, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setEditingTrack(track);
    setEditingTrackTitle(track.title || "");
    setEditingTrackArtist(track.artist || "");
    setEditingTrackDescription(track.description || "");
  };

  const saveTrackEdit = async () => {
    if (!editingTrack || !selectedPlaylist?.id || selectedPlaylist.id === "all")
      return;

    const isMasterAdmin = savedSecurityCode === "ho82788278";
    if (selectedPlaylist.ownerId !== user?.uid && !isAdmin && !isMasterAdmin) {
      showNotification("No tienes permisos para editar.");
      return;
    }

    try {
      const tracksCopy = [...selectedPlaylist.tracks];
      const idx = tracksCopy.findIndex((t) => t.id === editingTrack.id);
      if (idx === -1) {
        alert("Canción no encontrada en esta playlist.");
        return;
      }

      tracksCopy[idx] = {
        ...tracksCopy[idx],
        title: editingTrackTitle.trim(),
        artist: editingTrackArtist.trim(),
        description: editingTrackDescription.trim() || "",
      };

      const ownerIdToUse = selectedPlaylist.ownerId || user?.uid;
      if (!ownerIdToUse) {
        alert("Error: no se detectó el ownerId.");
        return;
      }

      const docRef = doc(
        db,
        "users",
        ownerIdToUse,
        "playlists",
        selectedPlaylist.id,
      );
      await updateDoc(docRef, {
        tracks: tracksCopy,
        updatedAt: serverTimestamp(),
      });
      window.dispatchEvent(new Event("refreshUserPlaylists"));
      window.dispatchEvent(new Event("refreshCommunity"));

      const newPlaylistObj = { ...selectedPlaylist, tracks: tracksCopy };
      setSelectedPlaylist(newPlaylistObj);

      if (previewPlaylist?.id === selectedPlaylist.id) {
        setPreviewPlaylist(newPlaylistObj);
      }
      if (playingPlaylist?.id === selectedPlaylist.id) {
        setPlayingPlaylist(newPlaylistObj);
      }

      setUserPlaylists((prev) =>
        prev.map((p) => (p.id === selectedPlaylist.id ? newPlaylistObj : p)),
      );
      window.dispatchEvent(new Event("refreshUserPlaylists"));

      showNotification("Canción actualizada.");
      setEditingTrack(null);
    } catch (error: any) {
      console.error("Error saving track edit:", error);
      alert(`Error al guardar: ${error.message || "Permiso denegado."}`);
    }
  };

  const handleLoadExplorePlaylist = async (item: any) => {
    const itemThumbnail = item.thumbnail || item.thumbnail_url || item.imageUrl || item.artwork_url || item.artwork || "";
    if (item.isLocalMix) {
      setPreviewPlaylist({
        id: item.id,
        name: item.title,
        description: item.artist || "Selección para ti",
        tracks: item.tracks,
        thumbnail_url: itemThumbnail || (item.tracks?.length ? getTrackImage(item.tracks[0]) : ""),
        ownerId: "flux",
        ownerName: "Flux Music",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setShowLibrary(true);
      return;
    }

    if (item.isPlaylist === false) {
      setPreviewPlaylist({
        id: item.id,
        name: item.title,
        description: item.artist || "Sencillo",
        tracks: [
          {
            id: item.id,
            title: item.title,
            artist: item.artist || "Flux",
            duration: item.duration || "N/A",
            url: item.url || `https://www.youtube.com/watch?v=${item.id}`,
            thumbnail:
              itemThumbnail ||
              `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
          },
        ],
        thumbnail_url: itemThumbnail || `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
        ownerId: "youtube",
        ownerName: item.artist || "Flux",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setShowLibrary(true);
      return;
    }

    setIsLoadingExplore(true);
    try {
      const encodedTitle = encodeURIComponent(item.title);
      const res = await fetch(
        `${API_BASE_URL}/api/youtube/playlist?id=${item.id}&title=${encodedTitle}`,
      );
      if (!res.ok) throw new Error("Failed to load playlist");
      const tracks = await res.json();
      if (tracks && tracks.length > 0) {
        const fullPlaylist = {
          id: item.id,
          name: item.title,
          description: item.artist || "Lista oficial",
          tracks: tracks,
          thumbnail_url: itemThumbnail || getTrackImage(tracks[0]) || "",
          ownerId: "youtube",
          ownerName: item.artist || "Flux",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setPreviewPlaylist(fullPlaylist);
        setShowLibrary(true);
        showNotification(`Playlist cargada: ${item.title}`);
      } else {
        showNotification("La playlist está vacía.");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error cargando playlist.");
    } finally {
      setIsLoadingExplore(false);
    }
  };

  const handleToggleExpandPlaylist = async (
    playlistId: string,
    playlistTitle: string = "",
  ) => {
    if (expandedPlaylistId === playlistId) {
      setExpandedPlaylistId(null);
      setExpandedPlaylistTracks([]);
      return;
    }

    setExpandedPlaylistId(playlistId);
    setExpandedPlaylistTracks([]);
    setIsFetchingExpandedTracks(true);

    try {
      const qs = playlistTitle
        ? `?id=${playlistId}&title=${encodeURIComponent(playlistTitle)}`
        : `?id=${playlistId}`;
      const res = await fetch(`${API_BASE_URL}/api/youtube/playlist${qs}`);
      if (res.ok) {
        const tracks = await res.json();
        setExpandedPlaylistTracks(tracks);
      } else {
        showNotification("No se pudieron cargar las canciones de la lista.");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error al cargar canciones.");
    } finally {
      setIsFetchingExpandedTracks(false);
    }
  };

  const addSingleTrackToCurrentPlaylist = (track: MusicTrack) => {
    if (isTemporaryUser) {
        showNotification("Esta función está disponible exclusivamente para usuarios Premium.");
        return;
    }
    setTrackToAddDestination(track);
    const isMasterAdmin = savedSecurityCode === "ho82788278";
    const canWrite =
      selectedPlaylist &&
      selectedPlaylist.id !== "all" &&
      (selectedPlaylist.ownerId === user?.uid || isAdmin || isMasterAdmin);
    setModalSelectedPlaylistId(canWrite ? selectedPlaylist!.id : "new");
    setModalNewPlaylistName(
      track?.artist ? `Playlist de ${track.artist}` : `Mix de ${track.title}`,
    );
    setModalNewPlaylistDesc(`Canal personalizado basado en ${track.title}`);
    setIsAddingToPlaylistModalOpen(true);
  };

  const executeModalAddTrack = async (
    targetPlaylistId: string,
    buildNew: boolean,
  ) => {
    setIsProcessingModalAdd(true);

    try {
      let currentUser = user;
      if (!currentUser) {
        const {
          signInAnonymously: firebaseSignInAnonymously,
          auth: firebaseAuth,
        } = await import("../lib/firebase");
        const cred = await firebaseSignInAnonymously(firebaseAuth);
        currentUser = cred.user;
      }

      if (!currentUser) {
        showNotification("Error de autenticación. Inténtalo de nuevo.");
        setIsProcessingModalAdd(false);
        return;
      }

      let finalTracksToAdd: MusicTrack[] = [];

      if (trackToAddDestination) {
        const isPlaylistSource = trackToAddDestination.isPlaylist;

        if (isPlaylistSource) {
          showNotification("Extrayendo canciones de la lista...");
          try {
            const res = await fetch(
              `${API_BASE_URL}/api/youtube/playlist?id=${trackToAddDestination.id}`,
            );
            if (res.ok) {
              const fetched = await res.json();
              finalTracksToAdd = fetched.map((t: any, i: number) => ({
                id: `yt_${t.id}_${Date.now()}_${i}`,
                title: t.title,
                artist: t.artist,
                url: t.url,
                duration: t.duration || "N/A",
                bpm: 120,
                thumbnail:
                  t.thumbnail || `https://i.ytimg.com/vi/${t.id}/mqdefault.jpg`,
              }));
            } else {
              showNotification("No se pudieron extraer las pistas del enlace.");
              setIsProcessingModalAdd(false);
              return;
            }
          } catch (e) {
            showNotification("Error obteniendo pistas.");
            setIsProcessingModalAdd(false);
            return;
          }
        } else {
          const defaultUrl =
            trackToAddDestination.url ||
            (trackToAddDestination.id
              ? `https://www.youtube.com/watch?v=${trackToAddDestination.id}`
              : "");
          finalTracksToAdd = [
            {
              id: String(trackToAddDestination.id).startsWith("yt_")
                ? String(trackToAddDestination.id)
                : `yt_${trackToAddDestination.id}_${Date.now()}`,
              title: trackToAddDestination.title,
              artist: trackToAddDestination.artist,
              url: defaultUrl,
              duration: trackToAddDestination.duration || "N/A",
              bpm: 120,
              thumbnail: cleanUrl(
                trackToAddDestination.thumbnail ||
                trackToAddDestination.artwork_url ||
                trackToAddDestination.artwork ||
                (trackToAddDestination.id
                  ? `https://i.ytimg.com/vi/${trackToAddDestination.id}/mqdefault.jpg`
                  : "")
              ),
            },
          ];
        }

        if (trackToAddDestination && finalTracksToAdd.length === 0) {
          showNotification("No se encontraron canciones válidas.");
          setIsProcessingModalAdd(false);
          return;
        }
      }

      if (buildNew) {
        const name = modalNewPlaylistName.trim();
        if (!name) {
          showNotification(
            "Por favor especifica un nombre para la nueva playlist.",
          );
          setIsProcessingModalAdd(false);
          return;
        }

        // Detectar si ya existe en novedades para redirigir/evitar duplicación pública
        const normalizeStr = (s: string) =>
          s.toLowerCase().replace(/[^a-z0-9]/g, "");

        const existsPublicly = userPlaylists.find((p) => {
          if (p.ownerId === user?.uid) return false;
          const pName = normalizeStr(p.name);
          const newName = normalizeStr(name);

          if (
            pName === newName ||
            (pName.length > 5 && newName.includes(pName)) ||
            (newName.length > 5 && pName.includes(newName))
          ) {
            return true;
          }

          if (p.tracks && finalTracksToAdd.length > 0) {
            let overlap = 0;
            const existingUrls = new Set(p.tracks.map((t) => t.url));
            for (const t of finalTracksToAdd) {
              if (existingUrls.has(t.url)) overlap++;
            }
            if (overlap >= 2 && overlap / finalTracksToAdd.length > 0.6) {
              return true;
            }
          }
          return false;
        });

        if (existsPublicly) {
          showNotification(
            `El nombre "${name}" ya existe en Novedades. Usa el buscador para añadirlo a tu biblioteca. Si deseas una versión propia, elige otro nombre.`,
          );
          setIsProcessingModalAdd(false);
          setIsAddingToPlaylistModalOpen(false);
          return;
        }

        const desc = modalNewPlaylistDesc.trim();
        const firstTrack = finalTracksToAdd[0];
        const firstTrackCover = firstTrack
          ? firstTrack.artwork_url || firstTrack.thumbnail || firstTrack.artwork
          : null;
        const trackDestCover = trackToAddDestination
          ? trackToAddDestination.artwork_url ||
            trackToAddDestination.thumbnail ||
            trackToAddDestination.artwork
          : null;

        let generatedCoverUrl = cleanUrl(firstTrackCover || trackDestCover || "");

        if (!generatedCoverUrl) {
          const songsInPlaylist = finalTracksToAdd
            .slice(0, 8)
            .map((t) => t.title)
            .join(", ");
          const contextInfo = desc ? ` theme: ${desc}` : "";
          const promptContext = songsInPlaylist
            ? `, inspired by songs like: ${songsInPlaylist}`
            : "";
          const promptBase = `Abstract artistic music album cover for "${name}"${contextInfo}${promptContext}`;
          const prompt = encodeURIComponent(
            `${promptBase}, highly detailed, stunning lighting, 4k, no text, no fonts, no words, beautiful vibrant layout`,
          );
          const randomSeed = Math.floor(Math.random() * 1000000);
          generatedCoverUrl = `https://image.pollinations.ai/prompt/${prompt}?width=400&height=400&nologo=true&seed=${randomSeed}`;
        }

        const isMasterAdmin = savedSecurityCode === "ho82788278" || isAdmin;
        let displayOwnerName = currentUser.displayName || "Usuario";

        if (isMasterAdmin) {
          displayOwnerName = "#fluxmusicoficial";
        }

        const newPlDoc = {
          name: name,
          genre: "Personalizado",
          description: desc,
          icon: "📂",
          thumbnail_url: generatedCoverUrl,
          ownerId: currentUser.uid,
          ownerName: displayOwnerName,
          isPublic: true,
          adminSecret: savedSecurityCode || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tracks: finalTracksToAdd,
          folder: "general",
        };

        const docRef = await addDoc(
          collection(db, "users", currentUser.uid, "playlists"),
          newPlDoc,
        );
        window.dispatchEvent(new Event("refreshUserPlaylists"));
      window.dispatchEvent(new Event("refreshCommunity"));

        showNotification(`Nueva playlist "${name}" creada con éxito.`);

        const newlyCreatedPlaylist: MusicPlaylist = {
          id: docRef.id,
          ...newPlDoc,
          createdAt: new Date(),
          updatedAt: new Date(),
          tracks: finalTracksToAdd,
        } as any;
        setSelectedPlaylist(newlyCreatedPlaylist);
        localStorage.setItem("gym_music_selected_playlist_id", docRef.id);
      } else {
        if (!trackToAddDestination) {
          showNotification("No hay canción seleccionada para añadir.");
          setIsProcessingModalAdd(false);
          return;
        }
        const targetPl = userPlaylists.find((p) => p.id === targetPlaylistId);
        if (!targetPl) {
          showNotification("La playlist de destino no existe.");
          setIsProcessingModalAdd(false);
          return;
        }

        const isMasterAdmin = savedSecurityCode === "ho82788278";
        if (
          targetPl.ownerId !== currentUser.uid &&
          !isAdmin &&
          !isMasterAdmin
        ) {
          showNotification("No tienes permisos para modificar esta playlist.");
          setIsProcessingModalAdd(false);
          return;
        }

        const targetOwnerId = targetPl.ownerId || currentUser.uid;
        const docRef = targetPl.path
          ? doc(db, targetPl.path)
          : doc(db, "users", targetOwnerId, "playlists", targetPl.id);
        const updatedTracks = [...(targetPl.tracks || []), ...finalTracksToAdd];

        let updateData: any = {
          tracks: updatedTracks,
          updatedAt: serverTimestamp(),
        };

        const firstTrack = updatedTracks[0];
        const firstTrackCover = firstTrack
          ? firstTrack.artwork_url || firstTrack.thumbnail || firstTrack.artwork
          : null;

        const currentCover = targetPl.thumbnail_url || "";
        const isDefaultCover =
          !currentCover ||
          currentCover === "📂" ||
          currentCover === "" ||
          currentCover.includes("pollinations.ai");

        if (firstTrackCover && isDefaultCover) {
          updateData.thumbnail_url = firstTrackCover;
        }

        await updateDoc(docRef, updateData);
        window.dispatchEvent(new Event("refreshUserPlaylists"));
      window.dispatchEvent(new Event("refreshCommunity"));

        if (selectedPlaylist?.id === targetPl.id) {
          setSelectedPlaylist({
            ...selectedPlaylist,
            tracks: updatedTracks,
            thumbnail_url:
              updateData.thumbnail_url || selectedPlaylist.thumbnail_url,
          });
        }

        if (previewPlaylist?.id === targetPl.id) {
          setPreviewPlaylist({
            ...previewPlaylist,
            tracks: updatedTracks,
            thumbnail_url:
              updateData.thumbnail_url || previewPlaylist.thumbnail_url,
          });
        }

        if (playingPlaylist?.id === targetPl.id) {
          setPlayingPlaylist({
            ...playingPlaylist,
            tracks: updatedTracks,
            thumbnail_url:
              updateData.thumbnail_url || playingPlaylist.thumbnail_url,
          });
        }

        // Ensure the global userPlaylists array is updated so if they reopen it, it has the new tracks
        setUserPlaylists((prev) =>
          prev.map((p) => {
            if (p.id === targetPl.id) {
              return {
                ...p,
                tracks: updatedTracks,
                thumbnail_url: updateData.thumbnail_url || p.thumbnail_url,
              };
            }
            return p;
          }),
        );

        showNotification(`Añadido con éxito a "${targetPl.name}".`);
      }

      setIsAddingToPlaylistModalOpen(false);
      setTrackToAddDestination(null);
      setModalNewPlaylistName("");
      setModalNewPlaylistDesc("");
    } catch (err) {
      console.error(err);
      showNotification("Error procesando solicitud.");
    } finally {
      setIsProcessingModalAdd(false);
    }
  };

  const importAllExpandedTracks = async (tracks: MusicTrack[]) => {
    if (!selectedPlaylist?.id || selectedPlaylist.id === "all") {
      showNotification("Selecciona una de tus playlists primero.");
      return;
    }

    const isMasterAdmin = savedSecurityCode === "ho82788278";
    if (selectedPlaylist.ownerId !== user?.uid && !isAdmin && !isMasterAdmin) {
      showNotification("No tienes permisos para modificar esta playlist.");
      return;
    }

    try {
      const targetOwnerId = selectedPlaylist.ownerId || user?.uid;
      if (!targetOwnerId) return;

      const docRef = selectedPlaylist.path
        ? doc(db, selectedPlaylist.path)
        : doc(db, "users", targetOwnerId, "playlists", selectedPlaylist.id);
      const updatedTracks = [...(selectedPlaylist.tracks || []), ...tracks];

      let updateData: any = {
        tracks: updatedTracks,
        updatedAt: serverTimestamp(),
      };

      const firstTrack = updatedTracks[0];
      const firstTrackCover = firstTrack
        ? firstTrack.artwork_url || firstTrack.thumbnail || firstTrack.artwork
        : null;

      const currentCover = selectedPlaylist.thumbnail_url || "";
      const isDefaultCover =
        !currentCover ||
        currentCover === "📂" ||
        currentCover === "" ||
        currentCover.includes("pollinations.ai") ||
        currentCover.includes("image.pollinations.ai");

      if (firstTrackCover && isDefaultCover) {
        updateData.thumbnail_url = firstTrackCover;
      }

      await updateDoc(docRef, updateData);
      window.dispatchEvent(new Event("refreshUserPlaylists"));
      window.dispatchEvent(new Event("refreshCommunity"));

      setSelectedPlaylist({
        ...selectedPlaylist,
        tracks: updatedTracks,
        thumbnail_url:
          updateData.thumbnail_url || selectedPlaylist.thumbnail_url,
      });
      showNotification(`Se añadieron ${tracks.length} canciones con éxito.`);
    } catch (err) {
      console.error(err);
      showNotification("Error al añadir las canciones.");
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (trackListTab === "search" && searchQuery.trim().length > 2) {
      timeoutId = setTimeout(() => {
        handleYoutubeSearch();
      }, 700);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchQuery, trackListTab]);

  const handleYoutubeSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setTrackListTab("search");
    setIsSearchingYT(true);
    try {
      const resp = await fetch(
        `${API_BASE_URL}/api/youtube/search?q=${encodeURIComponent(searchQuery)}`,
      );
      if (!resp.ok) throw new Error("Search failed");
      const data = await resp.json();
      setYoutubeResults(data);
    } catch (err) {
      console.error(err);
      showNotification("Error buscando música.");
    } finally {
      setIsSearchingYT(false);
    }
  };

  const addYoutubeTrackToPlaylist = (ytTrack: any) => {
    if (isTemporaryUser) {
        showNotification("Esta función está disponible exclusivamente para usuarios Premium.");
        return;
    }
    setTrackToAddDestination(ytTrack);
    const isMasterAdmin = savedSecurityCode === "ho82788278";
    const canWrite =
      selectedPlaylist &&
      selectedPlaylist.id !== "all" &&
      (selectedPlaylist.ownerId === user?.uid || isAdmin || isMasterAdmin);
    setModalSelectedPlaylistId(canWrite ? selectedPlaylist!.id : "new");
    setModalNewPlaylistName(
      ytTrack?.artist
        ? `Playlist de ${ytTrack.artist}`
        : `Mix de ${ytTrack.title}`,
    );
    setModalNewPlaylistDesc(`Canal personalizado basado en ${ytTrack.title}`);
    setIsAddingToPlaylistModalOpen(true);
  };

  const saveCommunityPlaylistToLibrary = async (pl: MusicPlaylist) => {
    if (isTemporaryUser) {
        showNotification("Esta función está disponible exclusivamente para usuarios Premium.");
        return;
    }
    try {
      let currentUser = user;
      if (!currentUser) {
        const {
          signInAnonymously: firebaseSignInAnonymously,
          auth: firebaseAuth,
        } = await import("../lib/firebase");
        const cred = await firebaseSignInAnonymously(firebaseAuth);
        currentUser = cred.user;
      }

      if (!currentUser) {
        showNotification("Debes iniciar sesión para usar la biblioteca.");
        return;
      }

      const existingPl = userPlaylists.find(
        (p) => p.ownerId === currentUser.uid && p.name === pl.name,
      );
      if (existingPl) {
        showNotification("Ya tienes esta playlist en tu biblioteca.");
        return;
      }

      // Copiamos la playlist
      const newPl = {
        name: pl.name,
        description: pl.description || "",
        thumbnail_url: getPlaylistImage(pl) || "",
        category: "Local",
        ownerId: currentUser.uid,
        ownerName: currentUser.displayName || nicknameInput || "Premium Member",
        isPublic: true,
        folder: "general",
        tracks: pl.tracks || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(
        collection(db, "users", currentUser.uid, "playlists"),
        newPl,
      );
      window.dispatchEvent(new Event("refreshUserPlaylists"));
      window.dispatchEvent(new Event("refreshCommunity"));
      showNotification(`"${pl.name}" guardada en tu biblioteca.`);
    } catch (err) {
      console.error(err);
      showNotification("Error guardando playlist.");
    }
  };

  const handleAddToQueue = (track: MusicTrack, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setTrackQueue((q) => [...q, track]);
    showNotification(`Añadida a la cola: ${track.title}`);
  };

  const handleToggleFavorite = async (
    track: MusicTrack,
    event: React.MouseEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (isTemporaryUser) { showNotification("Esta función está disponible exclusivamente para usuarios Premium."); return; } if (!user) {
      showNotification("Debes iniciar sesión para añadir a favoritos");
      return;
    }

    // Find "Favoritos"/"Siguiente" playlist for user
    const favPlaylist = userPlaylists.find(
      (p) =>
        p.ownerId === user.uid &&
        (p.name.toLowerCase() === "favoritos" ||
          p.name.toLowerCase() === "siguiente"),
    );

    if (!favPlaylist) {
      const newPl: any = {
        name: "Siguiente",
        genre: "Siguiente",
        description: "Tus pistas favoritas",
        tracks: [track],
        thumbnail_url: "",
        ownerId: user.uid,
        ownerName: user.displayName || user.email || "Usuario Premium",
        isPublic: false,
        adminSecret: "ho82788278",
        icon: "❤️",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await addDoc(collection(db, "users", user.uid, "playlists"), newPl);
        window.dispatchEvent(new Event("refreshUserPlaylists"));
      window.dispatchEvent(new Event("refreshCommunity"));
        showNotification("Guardado en Favoritos");
      } catch (err) {
        console.error("Error creating Favoritos:", err);
        showNotification("Error creando Favoritos");
      }
      return;
    }

    const getVid = (u?: string) => {
      if (!u) return null;
      const m = u.match(/(?:v=|\/)([\w-]{11})(?:\?|&|\/|$)/);
      return m ? m[1] : null;
    };

    const isMatch = (t1: any, t2: any) => {
      if (t1.id && t2.id && t1.id === t2.id) return true;
      if (t1.url && t2.url && t1.url === t2.url) return true;
      const v1 = getVid(t1.url);
      const v2 = getVid(t2.url);
      if (v1 && v2 && v1 === v2) return true;
      return false;
    };

    const trackExists = favPlaylist.tracks.some((t) => isMatch(t, track));

    try {
      // Use stored path if available, otherwise fallback to standard user path
      const plRef = favPlaylist.path
        ? doc(db, favPlaylist.path)
        : doc(db, "users", user.uid, "playlists", favPlaylist.id);

      if (trackExists) {
        // Filter out by both ID and URL for robustness
        const updatedTracks = favPlaylist.tracks.filter(
          (t) => !isMatch(t, track),
        );

        await updateDoc(plRef, {
          tracks: updatedTracks,
          updatedAt: serverTimestamp(),
        });
        window.dispatchEvent(new Event("refreshUserPlaylists"));
      window.dispatchEvent(new Event("refreshCommunity"));
        showNotification("Eliminado de Favoritos");
      } else {
        await updateDoc(plRef, {
          tracks: [...favPlaylist.tracks, track],
          updatedAt: serverTimestamp(),
        });
        window.dispatchEvent(new Event("refreshUserPlaylists"));
      window.dispatchEvent(new Event("refreshCommunity"));
        showNotification("Añadido a Favoritos");
      }
    } catch (err: any) {
      console.error("Error updating Favoritos:", err);
      // If error is permission denied, show a more specific message
      if (err.code === "permission-denied") {
        showNotification("Error de permisos en Favoritos");
      } else {
        showNotification("Error actualizando Favoritos");
      }
    }
  };

  const selectPlaylist = (playlist: MusicPlaylist) => {
    setSelectedPlaylist(playlist);
    setShowLibrary(false);
    setIsSidebarExpanded(false);
    setTrackListTab("playlist");
    setMobileView("player");
  };

  const playPreviewTrack = (playlist: MusicPlaylist, trackIdx: number) => {
    expectedPlayingRef.current = true;
    setOverrideCurrentTrack(null);
    setTrackQueue([]);
    trackQueueRef.current = [];
    setShowLibrary(false);
    setIsSidebarExpanded(false);

    const isSamePlaylist = playingPlaylist?.id === playlist.id;
    setPlayingPlaylist(playlist);
    setSelectedPlaylist(playlist);

    if (isSamePlaylist) {
      if (currentTrackIndex === trackIdx) {
        expectedPlayingRef.current = !isPlaying;
        setIsPlaying(!isPlaying);
      } else {
        setIsLoadingTrack(true);
        setCurrentTrackIndex(trackIdx);
        pendingSeekPosRef.current = null;
        setPosition(0);
        setDuration(0);
        setIsPlaying(true);
        if (playlist.tracks && playlist.tracks[trackIdx]) {
          loadIframeVideoDirectly(playlist.tracks[trackIdx]);
        }
      }
    } else {
      setIsLoadingTrack(true);
      setCurrentTrackIndex(trackIdx);
      pendingSeekPosRef.current = null;
      setPosition(0);
      setDuration(0);
      setIsPlaying(true);
      if (playlist.tracks && playlist.tracks[trackIdx]) {
        loadIframeVideoDirectly(playlist.tracks[trackIdx]);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPos = parseInt(e.target.value);
    setPosition(newPos);
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(newPos / 1000, "seconds");
    }
  };

  const handleTimelinePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const updatePosition = (clientX: number) => {
      const rect = container.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const width = rect.width;
      if (width > 0 && duration > 0) {
        const pct = Math.max(0, Math.min(1, clickX / width));
        const newPos = Math.round(pct * duration);
        setPosition(newPos);
        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.seekTo(newPos / 1000, "seconds");
        }
      }
    };

    updatePosition(e.clientX);
    container.setPointerCapture(e.pointerId);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      updatePosition(moveEvent.clientX);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      container.releasePointerCapture(e.pointerId);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerUp);
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", handlePointerUp);
  };

  const handleVolumePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const updateVolume = (clientX: number) => {
      const rect = container.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const width = rect.width;
      if (width > 0) {
        const pct = Math.max(0, Math.min(1, clickX / width));
        const newVol = Math.round(pct * 100);
        handleVolumeChange(newVol);
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
        const newVol = Math.round(pct * 100);
        handleVolumeChange(newVol);
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

  const formatTime = (ms: number) => {
    if (!ms || isNaN(ms)) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const displayTitle = currentTrack?.title || "Waiting...";
  const displayArtist = currentTrack?.artist || "Original Arch";
  const displayArtwork =
    cleanUrl(currentTrackMeta?.thumbnail_url) ||
    getTrackImage(currentTrack) ||
    DEFAULT_MUSIC_COVER;

  // USE STABLE HANDLERS FOR MEDIA SESSION TO PREVENT LOCK SCREEN LAG/RE-REGISTRATION ISSUES
  const handlersRef = useRef({
    togglePlayback,
    handleNext,
    handlePrev,
    setIsPlaying,
    volume,
  });
  useEffect(() => {
    handlersRef.current = {
      togglePlayback,
      handleNext,
      handlePrev,
      setIsPlaying,
      volume,
    };
  }, [togglePlayback, handleNext, handlePrev, setIsPlaying, volume]);

  // Sync Position State with Lock Screen - THROTTLED ECO OPTIMAL
  const lastSyncTrackRef = useRef<number>(-1);
  const lastSyncIsPlayingRef = useRef<boolean>(false);
  const lastSessionSyncTimeRef = useRef<number>(0);
  const lastSyncDurationRef = useRef<number>(0);

  useEffect(() => {
    const isPlayingChanged = lastSyncIsPlayingRef.current !== isPlaying;
    const isNewTrack = lastSyncTrackRef.current !== currentTrackIndex;
    const isDurationChanged = lastSyncDurationRef.current !== duration;

    // Only synchronize media session on explicit playback state shifts or duration loads
    // to strictly preserve zero-CPU idling when playing in the background.
    if (isPlayingChanged || isNewTrack || isDurationChanged) {
      if (
        "mediaSession" in navigator &&
        "setPositionState" in navigator.mediaSession
      ) {
        try {
          // Fetch exact native time to prevent lockscreen progress jump backwards
          const actualSeconds =
            youtubePlayerRef.current?.getCurrentTime() || position / 1000;
          
          const validDuration = Math.max(0, (duration || 0) / 1000);
          if (validDuration > 0 && !isNaN(validDuration)) {
            navigator.mediaSession.setPositionState({
              duration: validDuration,
              playbackRate: 1,
              position: Math.max(0, Math.min(actualSeconds, validDuration)),
            });
          }
          lastSyncDurationRef.current = duration;
          lastSyncTrackRef.current = currentTrackIndex;
          lastSyncIsPlayingRef.current = isPlaying;
        } catch (e) {}
      }
    }
  }, [position, duration, isPlaying, currentTrackIndex]);

  // Removed generic `isPlaying` sync for fallback audio.
  // We now orchestrate the silent audio track manually:
  // It only plays during transitions or pausing to hold the background audio lock.

  const durationRef = useRef(duration);
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  const sessionHandlersRef = useRef<Record<string, any>>({});

  const enforceActionHandlers = useCallback(() => {
    if (!("mediaSession" in navigator)) return;

    if (!sessionHandlersRef.current.playHandler) {
      // Define handlers that use the latest state via handlersRef to avoid stale closures, but keep references stable!
      sessionHandlersRef.current.playHandler = () => {
        expectedPlayingRef.current = true;
        handlersRef.current.setIsPlaying(true);
        if (fallbackSilentAudioRef.current && fallbackSilentAudioRef.current.paused) {
          fallbackSilentAudioRef.current.play().catch(() => {});
        }
        if (youtubePlayerRef.current) {
          try {
            const intPlayer = youtubePlayerRef.current.getInternalPlayer();
            if (intPlayer) {
              if (typeof intPlayer.playVideo === "function") {
                intPlayer.playVideo();
              } else if (typeof intPlayer.play === "function") {
                intPlayer.play();
              }
            }
          } catch (e) {}
        }
      };

      sessionHandlersRef.current.pauseHandler = () => {
        expectedPlayingRef.current = false;
        handlersRef.current.setIsPlaying(false);
        if (fallbackSilentAudioRef.current) {
          fallbackSilentAudioRef.current.pause();
        }
        if (youtubePlayerRef.current) {
          try {
            const intPlayer = youtubePlayerRef.current.getInternalPlayer();
            if (intPlayer && typeof intPlayer.pauseVideo === "function") {
              intPlayer.pauseVideo();
            } else if (intPlayer && typeof intPlayer.pause === "function") {
              intPlayer.pause();
            }
          } catch (e) {}
        }
      };

      sessionHandlersRef.current.nextHandler = () => {
        try {
          handlersRef.current.handleNext();
        } catch (e) {
          console.warn(e);
        }
      };
      sessionHandlersRef.current.prevHandler = () => {
        try {
          handlersRef.current.handlePrev();
        } catch (e) {
          console.warn(e);
        }
      };

      sessionHandlersRef.current.seekforwardHandler = () => {
        if (youtubePlayerRef.current) {
          const currentSec = youtubePlayerRef.current.getCurrentTime() || 0;
          const target = currentSec + 10;
          youtubePlayerRef.current.seekTo(target, "seconds");
          try {
            const validDuration = Math.max(0, (durationRef.current || 0) / 1000);
            if (validDuration > 0 && !isNaN(validDuration)) {
              navigator.mediaSession.setPositionState({
                duration: validDuration,
                playbackRate: 1,
                position: Math.max(0, Math.min(target, validDuration)),
              });
            }
          } catch (e) {}
        }
      };

      sessionHandlersRef.current.seekbackwardHandler = () => {
        if (youtubePlayerRef.current) {
          const currentSec = youtubePlayerRef.current.getCurrentTime() || 0;
          const target = Math.max(0, currentSec - 10);
          youtubePlayerRef.current.seekTo(target, "seconds");
          try {
            const validDuration = Math.max(0, (durationRef.current || 0) / 1000);
            if (validDuration > 0 && !isNaN(validDuration)) {
              navigator.mediaSession.setPositionState({
                duration: validDuration,
                playbackRate: 1,
                position: Math.max(0, Math.min(target, validDuration)),
              });
            }
          } catch (e) {}
        }
      };

      sessionHandlersRef.current.seektoHandler = (details: any) => {
        if (details.seekTime !== undefined && youtubePlayerRef.current) {
          youtubePlayerRef.current.seekTo(details.seekTime, "seconds");
          try {
            const validDuration = Math.max(0, (durationRef.current || 0) / 1000);
            if (validDuration > 0 && !isNaN(validDuration)) {
              navigator.mediaSession.setPositionState({
                duration: validDuration,
                playbackRate: 1,
                position: Math.max(0, Math.min(details.seekTime, validDuration)),
              });
            }
          } catch (e) {}
        }
      };
    }

    // Register handlers - always register both next and prev to ensure they show up on iOS/Bluetooth/Car
    const actions: [MediaSessionAction, () => void][] = [
      ["play", sessionHandlersRef.current.playHandler],
      ["pause", sessionHandlersRef.current.pauseHandler],
      ["previoustrack", sessionHandlersRef.current.prevHandler],
      ["nexttrack", sessionHandlersRef.current.nextHandler],
      ["seekforward", sessionHandlersRef.current.seekforwardHandler],
      ["seekbackward", sessionHandlersRef.current.seekbackwardHandler],
    ];

    actions.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (error) {
        // Fallback for older browsers
      }
    });

    if (Capacitor.isNativePlatform()) {
       try {
         MediaSession.setActionHandler({ action: 'play' }, sessionHandlersRef.current.playHandler);
         MediaSession.setActionHandler({ action: 'pause' }, sessionHandlersRef.current.pauseHandler);
         MediaSession.setActionHandler({ action: 'previoustrack' }, sessionHandlersRef.current.prevHandler);
         MediaSession.setActionHandler({ action: 'nexttrack' }, sessionHandlersRef.current.nextHandler);
       } catch (e) {
         console.warn("MediaSession action handler error", e);
       }
    }

    // Add SeekTo Support
    try {
      navigator.mediaSession.setActionHandler(
        "seekto",
        sessionHandlersRef.current.seektoHandler,
      );
    } catch (e) {}
  }, []);

  const lastMetadataRef = useRef<string>("");

  const registerMediaSession = useCallback(async (forceUpdate: boolean = false) => {
    if (!("mediaSession" in navigator)) return;

    const metadataKey = `${displayTitle}-${displayArtist}-${displayArtwork}`;
    if (lastMetadataRef.current !== metadataKey || forceUpdate) {
      lastMetadataRef.current = metadataKey;
      
      const title = displayTitle || "Flux Music";
      const artist = displayArtist || "Unknown Artist";
      const album = selectedPlaylist?.name || "Flux Music";
      const artwork = displayArtwork || DEFAULT_MUSIC_COVER;

      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork: [
          { src: artwork, sizes: "512x512", type: "image/jpeg" },
          { src: artwork, sizes: "256x256", type: "image/jpeg" },
          { src: artwork, sizes: "128x128", type: "image/jpeg" },
          { src: artwork, sizes: "96x96", type: "image/jpeg" },
        ],
      });

      if (Capacitor.isNativePlatform()) {
        try {
          await MediaSession.setMetadata({
            title,
            artist,
            album,
            artwork: [{ src: artwork }]
          });
        } catch (e) {
          console.warn('Capacitor MediaSession setMetadata failed', e);
        }
      }
    }

    enforceActionHandlers();
  }, [
    displayTitle,
    displayArtist,
    displayArtwork,
    selectedPlaylist,
    enforceActionHandlers,
  ]);

  // Media Session API Integration for background playback
  useEffect(() => {
    registerMediaSession();
  }, [registerMediaSession]);

  // Periodic background safeguard to protect and recover hijacked Media Session action handlers.
  // Runs extremely efficiently natively via audio timeupdate, preserving battery and fully respecting Eco Mode guidelines,
  // guaranteeing that steering wheel/car bluetooth next/prev skip buttons remain active.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    // Run once immediately when state changes
    enforceActionHandlers();
  }, [enforceActionHandlers, currentTrackIndex, isPlaying]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
    if (Capacitor.isNativePlatform()) {
      MediaSession.setPlaybackState({ playbackState: isPlaying ? "playing" : "paused" }).catch(e => console.warn(e));
    }
  }, [isPlaying]);

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
  };

  // --- ECO-FRIENDLY WATCHDOG FOR YOUTUBE IFRAME STALLS (1-2 Hours Bug) ---
  // Optimized to use minimal CPU and battery resources
  const stuckBufferingTimeRef = useRef(0);
  useEffect(() => {
    // 15 seconds interval is extremely low frequency, virtually 0 impact on battery/CPU
    const watchdog = setInterval(() => {
      // Fast exit loop (nanoseconds execution if paused) to preserve battery tightly
      if (!expectedPlayingRef.current || !youtubePlayerRef.current) {
        stuckBufferingTimeRef.current = 0;
        return;
      }

      try {
        const intPlayer = youtubePlayerRef.current.getInternalPlayer();
        if (intPlayer && typeof intPlayer.getPlayerState === "function") {
          const state = intPlayer.getPlayerState();

          // Estado 2: Pausado. Si el iframe se pausó solo (límite de inactividad de YouTube o suspensión del navegador)
          if (state === 2) {
            if (typeof intPlayer.playVideo === "function") {
              intPlayer.playVideo();
            }
            stuckBufferingTimeRef.current = 0;
          }
          // Estado 3: Buffering o -1: Sin empezar. A veces YouTube se queda colgado cargando infinitamente.
          else if (state === 3 || state === -1) {
            stuckBufferingTimeRef.current += 15000;
            if (stuckBufferingTimeRef.current >= 30000) {
              // Si lleva más de 30 segundos atascado en buffer, forzamos un seek minúsculo para destrabar
              const currentSec = youtubePlayerRef.current.getCurrentTime() || 0;
              if (typeof youtubePlayerRef.current.seekTo === "function") {
                youtubePlayerRef.current.seekTo(currentSec + 0.1, "seconds");
              }
              if (typeof intPlayer.playVideo === "function") {
                intPlayer.playVideo();
              }
              stuckBufferingTimeRef.current = 0;
            }
          } else {
            stuckBufferingTimeRef.current = 0;
          }
        }
      } catch (e) {
        // Ignorar errores silenciosamente
      }
    }, 15000);

    return () => clearInterval(watchdog);
  }, []);

  // --- DERIVED UI STATES (already defined above) ---

  return (
    <div
      className={`bg-[#080809]/90  text-white ${isEcoMode ? "shadow-lg" : "shadow-2xl"} h-full w-full flex flex-col border border-white/5 overflow-hidden font-sans relative sm:rounded-[40px] rounded-[32px]`}
    >
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-black px-6 py-3 rounded-full font-bold text-sm shadow-2xl flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Invisible embedding of YouTube ReactPlayer and background thread preservation audio */}
      <div className="absolute top-[-300px] left-[-300px] w-[300px] h-[300px] overflow-hidden pointer-events-none select-none z-[-1] opacity-[0.01]">
        <audio
          ref={fallbackSilentAudioRef}
          src={silentAudioBlobSrc}
          playsInline
          loop
        />
        {currentUrl && (
          <ReactPlayer
            ref={youtubePlayerRef}
            url={currentUrl}
            playing={isPlaying}
            volume={isDucking ? (volume / 100) * 0.15 : (volume / 100)}
            progressInterval={1000}
            onError={async (e) => {
              console.warn("ReactPlayer Error:", e);
              consecutiveErrorsRef.current += 1;
              if (consecutiveErrorsRef.current > 4) {
                console.warn("Too many consecutive playback errors. Pausing playback to prevent infinite loop.");
                setIsPlaying(false);
                consecutiveErrorsRef.current = 0;
                return;
              }
              console.warn("Unplayable track detected (copyright, regional block, or deleted). Auto-skipping...");
              // Skip automatically after a short timeout to prevent instant double skips
              setTimeout(() => {
                if (handleNextRef.current) {
                  handleNextRef.current(true);
                }
              }, 1500);
            }}
            onReady={(player) => {
              // Re-register Media Session and reinforce action handlers to beat YouTube iframe's own initial lock screen registration
              registerMediaSession();
              enforceActionHandlers();

              if (
                pendingSeekPosRef.current !== null &&
                pendingSeekPosRef.current > 0
              ) {
                youtubePlayerRef.current?.seekTo(
                  pendingSeekPosRef.current,
                  "seconds",
                );
              }

              if (initialLoadRef.current) {
                initialLoadRef.current = false;
              }
            }}
            onBuffer={() => {
              isBufferingRef.current = true;
            }}
            onBufferEnd={() => {
              isBufferingRef.current = false;
              if (expectedPlayingRef.current && youtubePlayerRef.current) {
                try {
                  const intPlayer = youtubePlayerRef.current.getInternalPlayer();
                  if (intPlayer) {
                    if (typeof intPlayer.playVideo === "function") {
                      intPlayer.playVideo();
                    } else if (typeof intPlayer.play === "function") {
                      intPlayer.play();
                    }
                  }
                } catch (e) {}
              }
            }}
            onPlay={() => {
              isBufferingRef.current = false;
              wasUnexpectedlyPausedRef.current = false;
              consecutiveErrorsRef.current = 0;
              setIsPlaying(true);

              // Keep silent audio playing so we retain the MediaSession lock instead of YouTube iframe taking it
              // if (fallbackSilentAudioRef.current && !fallbackSilentAudioRef.current.paused) {
              //   fallbackSilentAudioRef.current.pause();
              // }

              enforceActionHandlers();
              registerMediaSession();

              // Crucial iOS fix: Ensure it doesn't get muted by Safari's autoplay policies when playing
              try {
                if (youtubePlayerRef.current) {
                  const intPlayer =
                    youtubePlayerRef.current.getInternalPlayer();
                  try {
                    intPlayer.unMute();
                  } catch (e) {}

                  // Steal Media Session lock from YouTube AFTER it resumes
                  // Guarantees Bluetooth wheel controls work in Brave browser + No Micro-cuts
                  setTimeout(() => {
                    if (fallbackSilentAudioRef.current && fallbackSilentAudioRef.current.paused) {
                      fallbackSilentAudioRef.current.play().catch(() => {});
                    }
                    enforceActionHandlers();
                    registerMediaSession(true);
                  }, 500);
                }
              } catch (e) {}
            }}
            onPause={() => {
              // If we expect to be playing, never let the iframe stay paused
              if (expectedPlayingRef.current) {
                wasUnexpectedlyPausedRef.current = true;

                if (fallbackSilentAudioRef.current && fallbackSilentAudioRef.current.paused) {
                  fallbackSilentAudioRef.current.play().catch(() => {});
                }

                // Immediately counter react-player pause SYNCHRONOUSLY for iOS lock screen bypass
                // Done only once to avoid conflicting with YouTube's internal buffering state machine
                if (
                  expectedPlayingRef.current &&
                  youtubePlayerRef.current &&
                  !isBufferingRef.current
                ) {
                  try {
                    const intPlayer =
                      youtubePlayerRef.current.getInternalPlayer();
                    if (intPlayer) {
                      if (typeof intPlayer.playVideo === "function") {
                        intPlayer.playVideo();
                      } else if (typeof intPlayer.play === "function") {
                        intPlayer.play();
                      }
                    }
                  } catch (e) {}

                  // Steal Media Session lock from YouTube AFTER it resumes
                  // Guarantees Bluetooth wheel controls work in Brave browser + No Micro-cuts
                  setTimeout(() => {
                      enforceActionHandlers();
                      registerMediaSession();
                  }, 500);
                }

                // Extremely important: do NOT set isPlaying(false). This caused the audio to stop on iOS.
                return;
              }
              setIsPlaying(false);
            }}
            onEnded={() => {
              if (!hasEarlySkippedRef.current) {
                handleNextRef.current(true);
              }
            }}
            onProgress={(state) => {
              try {
                const intPlayer = youtubePlayerRef.current?.getInternalPlayer();
                if (intPlayer && typeof intPlayer.getVideoData === "function") {
                  const currentVideoData = intPlayer.getVideoData();
                  let expectedVideoId = null;
                  try {
                     expectedVideoId = new URL(currentUrl.replace("music.youtube.com", "www.youtube.com")).searchParams.get("v");
                  } catch(e) {}
                  
                  if (currentVideoData?.video_id && expectedVideoId && currentVideoData.video_id !== expectedVideoId) {
                    if (hasEarlySkippedRef.current) return;
                    if (Date.now() - lastSkipTimeRef.current < 3000) return;
                    
                    const actualVideoId = currentVideoData.video_id;
                    const getVidId = (u: string) => { try { return new URL((u || "").replace("music.youtube.com", "www.youtube.com")).searchParams.get("v"); } catch { return null; } };
                    
                    if (trackQueueRef.current.length > 0 && getVidId(trackQueueRef.current[0].url) === actualVideoId) {
                       handleNextRef.current();
                       return;
                    }
                    
                    const nextIndex = displayTracks.findIndex((t) => getVidId(t.url) === actualVideoId);
                    
                    if (nextIndex !== -1 && nextIndex !== currentTrackIndex) {
                       setCurrentTrackIndex(nextIndex);
                       return; // Exit onProgress to prevent state clashes before reload
                    }
                  }
                }
              } catch (e) {}

              if (
                pendingSeekPosRef.current !== null &&
                pendingSeekPosRef.current > 0
              ) {
                if (Math.abs(state.playedSeconds - pendingSeekPosRef.current) > 2 && state.playedSeconds < pendingSeekPosRef.current) {
                  // Ignore early progress events and enforce the seek if YouTube iframe ignored the onReady seek
                  youtubePlayerRef.current?.seekTo(
                    pendingSeekPosRef.current,
                    "seconds",
                  );
                  return;
                } else {
                  // Seek has been reached reliably
                  pendingSeekPosRef.current = null;
                }
              }
              const currentPosMs = state.playedSeconds * 1000;
              if (document.visibilityState === "visible") {
                setPosition(currentPosMs);
              }

              // Persist locally for seamless restoration, even if backgrounded, throttle to once every 5s
              if (
                currentPosMs > 0 &&
                Math.abs(currentPosMs - (positionRef.current || 0)) > 5000
              ) {
                positionRef.current = currentPosMs;
                localStorage.setItem(
                  "gym_music_saved_position",
                  currentPosMs.toString(),
                );
                if (playingPlaylistRef.current) {
                  localStorage.setItem(
                    "gym_music_last_played_playlist_id",
                    playingPlaylistRef.current.id,
                  );
                  localStorage.setItem(
                    "gym_music_current_track_index",
                    currentTrackIndexRef.current.toString(),
                  );
                }
              }

              // Intelligent gapless logic: checking for silences/outros/intros using crowdsourced segments
              const played = state.playedSeconds;
              const durationCurrent = durationRef.current / 1000;

              // Reset early skip flag once the new video actually starts playing
              if (hasEarlySkippedRef.current && played < durationCurrent - 2) {
                hasEarlySkippedRef.current = false;
              }

              // Pre-activar el audio de respaldo 1.5 segundos antes del final para que iOS no suspenda la app
              if (durationCurrent > 3 && played >= durationCurrent - 1.5) {
                if (!hasEarlySkippedRef.current && Date.now() - lastSkipTimeRef.current > 3000) {
                  hasEarlySkippedRef.current = true;
                  if (fallbackSilentAudioRef.current && fallbackSilentAudioRef.current.paused) {
                    fallbackSilentAudioRef.current.play().catch(() => {});
                  }
                  // Gapless early skip to mask YouTube loading delay
                  handleNextRef.current();
                }
                return;
              }
              const segments = sponsorBlockSegmentsRef.current;

              if (segments && segments.length > 0 && youtubePlayerRef.current) {
                if (skipTimeoutRef.current) {
                  clearTimeout(skipTimeoutRef.current);
                  skipTimeoutRef.current = null;
                }

                const activeSegment = segments.find(
                  (seg) => played >= seg.start && played < seg.end,
                );
                if (activeSegment) {
                  // Only go to next track if the segment essentially ends the video
                  if (durationCurrent > 0 && activeSegment.end >= durationCurrent - 10) {
                    handleNextRef.current();
                  } else {
                    youtubePlayerRef.current.seekTo(activeSegment.end, "seconds");
                  }
                } else {
                  const maxSkipWindowSeconds =
                    (youtubePlayerRef.current?.props?.progressInterval ||
                      5000) / 1000;
                  const nextSegment = segments.find(
                    (seg) =>
                      seg.start > played &&
                      seg.start <= played + maxSkipWindowSeconds,
                  );
                  if (nextSegment) {
                    const msUntilSkip = Math.max(
                      0,
                      (nextSegment.start - played) * 1000,
                    );
                    skipTimeoutRef.current = setTimeout(() => {
                      if (isPlayingRef.current && youtubePlayerRef.current) {
                        const actualSecs =
                          youtubePlayerRef.current.getCurrentTime() || 0;
                        if (actualSecs >= nextSegment.start - 2) {
                          if (durationCurrent > 0 && nextSegment.end >= durationCurrent - 10) {
                            handleNextRef.current();
                          } else {
                            youtubePlayerRef.current.seekTo(nextSegment.end, "seconds");
                          }
                        }
                      }
                    }, msUntilSkip);
                  }
                }
              }
            }}
            onDuration={(dur) => {
              if (document.visibilityState === "visible" || duration === 0) {
                setDuration(dur * 1000);
              }
            }}
            config={reactPlayerConfig}
            width="300px"
            height="300px"
          />
        )}
      </div>

      {/* GLOBAL TABS / PILLS HEADER */}
      <Carousel className="px-3 py-2 gap-1.5 bg-[#050505]/95 select-none z-10 shrink-0 border-b border-white/5 snap-x w-full">
        {/* Explorar - Desktop Only (in bottom bar on mobile) */}
        <button
          onClick={() => {
            setSearchQuery("");
            setYoutubeResults([]);
            setPreviewPlaylist(null);
            setTrackListTab("search");
            setIsTrackListExpanded(true);
            setShowLibrary(false);
            setIsSidebarExpanded(false);
            if (window.innerWidth < 768) {
              setMobileView("player");
            }
          }}
          className={`hidden md:flex relative shrink-0 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border snap-start items-center justify-center ${
            searchQuery === "" &&
            trackListTab === "search" &&
            !showLibrary &&
            !isSidebarExpanded &&
            (window.innerWidth >= 768 || mobileView === "player")
              ? "bg-gradient-to-b from-[#1a1a20] to-[#0a0a0c] backdrop-blur-2xl border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-white/20"
              : "bg-white/[0.03] backdrop-blur-md border-white/[0.05] active:bg-white/[0.08] shadow-sm"
          }`}
        >
          <span className="font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">Explorar</span>
          {hasNewExplore && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-[#050505] shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
        </button>

        {/* Comunidad (Moved here from hidden, replacing Flux position) */}
        <button
          onClick={() => {
            setSearchQuery("");
            setYoutubeResults([]);
            setPreviewPlaylist(null);
            setShowLibrary(true);
            setIsSidebarExpanded(false);
          }}
          className={`relative flex shrink-0 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border snap-start items-center justify-center ${
            showLibrary && !isSidebarExpanded
              ? "bg-gradient-to-b from-[#1a1a20] to-[#0a0a0c] backdrop-blur-2xl border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-white/20"
              : "bg-white/[0.03] backdrop-blur-md border-white/[0.05] active:bg-white/[0.08] shadow-sm"
          }`}
        >
          <span className="font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">Comunidad</span>
        </button>

        {/* Mi Biblioteca - Desktop Only (in bottom bar on mobile) */}
        <button
          onClick={() => {
            setSearchQuery("");
            setYoutubeResults([]);
            setPreviewPlaylist(null);
            setIsSidebarExpanded(true);
            setShowLibrary(false);
          }}
          className={`hidden md:flex relative shrink-0 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border snap-start items-center justify-center ${
            isSidebarExpanded && !showLibrary
              ? "bg-gradient-to-b from-[#1a1a20] to-[#0a0a0c] backdrop-blur-2xl border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-white/20"
              : "bg-white/[0.03] backdrop-blur-md border-white/[0.05] active:bg-white/[0.08] shadow-sm"
          }`}
        >
          <span className="font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">Mi Biblioteca</span>
        </button>

        {/* FLUX - Desktop Only (in bottom bar on mobile) */}
        <button
          onClick={() => {
            setSearchQuery("");
            setYoutubeResults([]);
            setPreviewPlaylist(null);
            
            setTrackListTab("radio-fai");
            setIsTrackListExpanded(true);
            setShowLibrary(false);
            setIsSidebarExpanded(false);
            if (window.innerWidth < 768) {
              setMobileView("player");
            }
          }}
          className={`hidden md:flex relative shrink-0 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border snap-start items-center justify-center ${
            trackListTab === "radio-fai" &&
            !showLibrary &&
            !isSidebarExpanded &&
            (window.innerWidth >= 768 || mobileView === "player")
              ? "bg-gradient-to-b from-[#1a1a20] to-[#0a0a0c] backdrop-blur-2xl border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-white/20"
              : "bg-white/[0.03] backdrop-blur-md border-white/[0.05] active:bg-white/[0.08] shadow-sm"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">FLUX</span>
            <Radio className="w-3.5 h-3.5 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)] animate-pulse" />
          </span>
          {Date.now() < new Date("2026-07-06T17:16:26Z").getTime() && (
            <span className="absolute -top-1.5 -right-2 px-1 py-[1px] bg-red-500 text-white text-[7px] font-black uppercase tracking-widest rounded shadow-[0_0_10px_rgba(239,68,68,0.6)] rotate-[8deg] animate-pulse">
              Novedad
            </span>
          )}
        </button>

        {/* Karaoke - Moved to top for mobile */}
        <button
          onClick={() => {
            setSearchQuery("");
            setYoutubeResults([]);
            setPreviewPlaylist(null);
            
            setTrackListTab("karaoke");
            setIsTrackListExpanded(true);
            setShowLibrary(false);
            setIsSidebarExpanded(false);
            if (window.innerWidth < 768) {
              setMobileView("player");
            }
          }}
          className={`relative flex shrink-0 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border snap-start items-center justify-center ${
            trackListTab === "karaoke" &&
            !showLibrary &&
            !isSidebarExpanded &&
            (window.innerWidth >= 768 || mobileView === "player")
              ? "bg-gradient-to-b from-[#1a1a20] to-[#0a0a0c] backdrop-blur-2xl border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-white/20"
              : "bg-white/[0.03] backdrop-blur-md border-white/[0.05] active:bg-white/[0.08] shadow-sm"
          }`}
        >
          <span className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-400 rounded-full blur-[6px] animate-pulse opacity-85"></div>
              <Mic className="relative w-4 h-4 text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,1)] animate-pulse" />
            </div>
            <span className="font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">Karaoke</span>
          </span>
        </button>

        {/* Podcasts */}
        <button
          onClick={() => {
            setSearchQuery("");
            setYoutubeResults([]);
            setPreviewPlaylist(null);
            setTrackListTab("entertainment");
            setIsTrackListExpanded(true);
            setShowLibrary(false);
            setIsSidebarExpanded(false);
            if (window.innerWidth < 768) {
              setMobileView("player");
            }
          }}
          className={`relative shrink-0 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border snap-start flex items-center justify-center ${
            trackListTab === "entertainment" &&
            !showLibrary &&
            !isSidebarExpanded &&
            (window.innerWidth >= 768 || mobileView === "player")
              ? "bg-gradient-to-b from-[#1a1a20] to-[#0a0a0c] backdrop-blur-2xl border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-white/20"
              : "bg-white/[0.03] backdrop-blur-md border-white/[0.05] active:bg-white/[0.08] shadow-sm"
          }`}
        >
          <span className="font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">Podcasts</span>
        </button>


      </Carousel>

      <div className="flex-1 flex flex-row min-h-0 relative overflow-hidden">
        {/* SIDEBAR OVERLAY BACKGROUND (Desktop only) */}
        {isSidebarExpanded && (
          <div
            className="hidden md:block absolute inset-0 bg-black/60  z-[40]"
            onClick={() => setIsSidebarExpanded(false)}
          />
        )}

        {/* SIDEBAR */}
        <div
          className={`
           ${mobileView === "playlists" ? "flex w-full" : "hidden md:flex"} 
           flex-col border-r border-white/5 shrink-0 overflow-hidden 
           md:absolute md:top-0 md:bottom-0 md:w-[350px] z-[50] 
           transition-transform duration-300 ease-in-out
           ${!isSidebarExpanded ? "md:-translate-x-full md:pointer-events-none" : "md:translate-x-0 cursor-default bg-[#050505] shadow-[10px_0_30px_rgba(0,0,0,0.8)]"}
           bg-[#050505]
        `}
        >
          <div className="p-3 border-b border-white/[0.03] shrink-0 flex items-center justify-between w-full h-auto">
            <div className="text-left">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                Mi Biblioteca
              </h3>
            </div>
          </div>

          <div className="flex flex-col p-3 md:p-3 gap-2.5 overflow-y-auto scrollbar-none flex-1 min-h-0 w-full items-stretch">
            {/* Comunidad Promo Card */}
            <button
              onClick={() => {
                setShowLibrary(true);
                setIsSidebarExpanded(false);
                if (window.innerWidth < 768) {
                  setMobileView("player");
                }
              }}
              className="w-full relative overflow-hidden group bg-gradient-to-br from-emerald-500/10 via-[#0a0a0c] to-[#0a0a0c] border border-emerald-500/20 active:border-emerald-500/50 rounded-2xl p-4 cursor-pointer text-left transition-all active:scale-[1.01] active:shadow-[0_0_25px_rgba(16,185,129,0.1)] mb-1 shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/5 to-emerald-400/0 -translate-x-full group-active:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
              <div className="flex justify-between items-start mb-2">
                <span className="bg-emerald-500 text-black text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse">
                  Comunidad
                </span>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-active:rotate-12 transition-transform">
                  <Globe className="w-3.5 h-3.5" />
                </div>
              </div>
              <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider mb-1.5 group-active:text-blue-400 transition-colors">
                Descubre Música
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                Únete a la comunidad para explorar playlists increíbles de otros usuarios. <strong className="text-blue-400 font-bold">Descubre tu próximo track favorito.</strong>
              </p>
            </button>

            {/* Spotify-style Create Playlist Button */}
            {accessData?.isValid && (
              <button
                onClick={handleAddNewCanalClick}
                className="group relative flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] active:bg-white/[0.08] border border-white/5 active:border-white/20 transition-all duration-300 cursor-pointer overflow-hidden mb-2 shadow-xl active:scale-[0.98]"
              >
                <div className="relative w-10 h-10 shrink-0 rounded-lg bg-[#333] flex items-center justify-center text-slate-300 group-active:bg-white group-active:text-black transition-all duration-300 shadow-lg">
                  <Plus className="w-5 h-5 stroke-[2.5px]" />
                </div>
                <div className="flex flex-col items-start overflow-hidden text-left">
                  <span className="text-[11px] font-black text-white uppercase tracking-wider group-active:text-[#1ED760] transition-colors">
                    Crear playlist
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold truncate">
                    Nueva lista vacía
                  </span>
                </div>
                <div className="ml-auto opacity-0 group-active:opacity-100 transition-all translate-x-2 group-active:translate-x-0 duration-300">
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </button>
            )}

            {(() => {
              const filteredList = userPlaylists.filter(
                (pl) => pl.ownerId === user?.uid,
              );

              if (filteredList.length === 0 && !accessData?.isValid) {
                return (
                  <div className="text-center py-10 px-4 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-slate-600 mb-2">
                      <ListMusic className="w-8 h-8" />
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed font-bold">
                      Tu biblioteca está vacía
                    </p>
                  </div>
                );
              }

              // 1) Extract 'Favoritos' system-playlist
              const favoritosPlaylist = filteredList.find(
                (pl) =>
                  pl.name?.toLowerCase() === "favoritos" ||
                  pl.name?.toLowerCase() === "siguiente",
              );
              const otherPlaylists = filteredList.filter(
                (pl) =>
                  pl.name?.toLowerCase() !== "favoritos" &&
                  pl.name?.toLowerCase() !== "siguiente",
              );

              // 2) Group other playlists: default folder is "Tus Listas" (folder !== "root")
              const folderPlaylists = otherPlaylists.filter(
                (pl) =>
                  pl.folder !== "root" && localFoldersMap[pl.id] !== "root",
              );
              const rootPlaylists = otherPlaylists.filter(
                (pl) =>
                  pl.folder === "root" || localFoldersMap[pl.id] === "root",
              );

              // Pin 'cumple' to top of folderPlaylists or rootPlaylists
              const pinToTop = (list: MusicPlaylist[]) => {
                const martinaIdx = list.findIndex((pl) => {
                  const lowerName = pl.name?.toLowerCase() || "";
                  return (
                    (lowerName.includes("cumple") &&
                      lowerName.includes("martina")) ||
                    lowerName.includes("cumple 2026")
                  );
                });
                if (martinaIdx !== -1) {
                  const martinaPl = list.splice(martinaIdx, 1)[0];
                  list.unshift(martinaPl);
                }
                return list;
              };

              // Pin 'favoritos' to very top of general list if they contain anything, but we pin it uniquely outside the folder!
              const sortedFolderList = pinToTop([...folderPlaylists]);
              const sortedRootList = pinToTop([...rootPlaylists]);

              const renderPlaylistItem = (
                pl: MusicPlaylist,
                isNested: boolean,
                canMoveUp: boolean = true,
                canMoveDown: boolean = true,
              ) => {
                const isSelected = selectedPlaylist?.id === pl.id;
                const gradient = getPlaylistGradientClass(pl.name);
                const isInFolder =
                  pl.folder !== "root" && localFoldersMap[pl.id] !== "root";

                const isBeingDragged = draggedPlaylistId === pl.id;
                const isBeingDraggedOver = dragOverPlaylistId === pl.id;

                return (
                  <div
                    key={pl.id}
                    onClick={() => selectPlaylist(pl)}
                    role="button"
                    tabIndex={0}
                    draggable
                    onDragStart={(e) => {
                      setDraggedPlaylistId(pl.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", pl.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDragOverPlaylistId(pl.id);
                    }}
                    onDragLeave={() => {
                      if (dragOverPlaylistId === pl.id) {
                        setDragOverPlaylistId(null);
                      }
                    }}
                    onDrop={(e) => {
                      handleDropPlaylist(pl.id, e);
                    }}
                    onDragEnd={() => {
                      setDraggedPlaylistId(null);
                      setDragOverPlaylistId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectPlaylist(pl);
                      }
                    }}
                    className={`group relative w-full cursor-pointer flex flex-row items-center justify-between gap-2 p-2 sm:p-3 rounded-xl transition-all text-left ${
                      isSelected
                        ? "bg-[#1ED760]/5 border-l-[3px] border-[#1ED760] ring-1 ring-[#1ED760]/10"
                        : "border-l-[3px] border-transparent active:bg-white/[0.03]"
                    } ${isBeingDragged ? "opacity-50" : ""} ${isBeingDraggedOver ? "border-b-2 border-b-emerald-500 bg-white/[0.04]" : ""}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      {/* Dynamic Premium Cover Art */}
                      <div
                        className={`relative w-16 h-16 md:w-12 md:h-12 rounded-lg bg-gradient-to-tr ${gradient} flex items-center justify-center text-sm md:text-lg font-black text-white/90 shadow-md overflow-hidden shrink-0 group-active:scale-105 transition-transform duration-300`}
                      >
                        <>
                          {/* Inner Gloss Sheen Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                          <span className="relative z-10 shrink-0 select-none filter drop-shadow flex items-center justify-center">
                            {pl.icon &&
                            pl.icon !== "📂" &&
                            pl.icon !== "📁" &&
                            pl.icon !== "🎵" ? (
                              pl.icon
                            ) : (
                              <Headphones className="w-5 h-5 text-white/90" />
                            )}
                          </span>
                          {getPlaylistImage(pl) && (
                            <img
                              src={getPlaylistImage(pl)!}
                              alt={pl.name}
                              className="absolute inset-0 w-full h-full object-cover z-20 bg-[#0d0d0f]"
                              
                              referrerPolicy="no-referrer"
                              onError={(e) => handlePlaylistImageError(e, pl)}
                            />
                          )}
                        </>

                        {/* Hover Play Indicator Overlay */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 text-white fill-white scale-90 group-active:scale-100 transition-transform duration-300" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex flex-col justify-center items-start flex-1 gap-0.5">
                        <p
                          className={`text-[13px] sm:text-[14px] font-bold truncate leading-tight max-w-full ${
                            isSelected
                              ? "text-[#1ED760]"
                              : "text-white/90 group-active:text-white"
                          }`}
                        >
                          {pl.name}
                        </p>
                        <p
                          className="text-[11px] sm:text-[12px] text-slate-400 font-medium truncate max-w-full flex items-center gap-1.5"
                          title={`${pl.tracks?.length || 0} pistas`}
                        >
                          {pl.tracks.length}{" "}
                          {pl.tracks.length === 1 ? "Pista" : "Pistas"} •{" "}
                          <span className="text-[#1ED760]">
                            {calculatePlaylistDuration(pl.tracks)}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Actions Bar - Adaptive position desktop/mobile */}
                    {pl.name?.toLowerCase() !== "favoritos" && (
                      <div className="flex items-center gap-1 shrink-0 md:hidden md:group-active:flex z-10 md:absolute md:right-2 md:top-1/2 md:-translate-y-1/2 md:bg-black/90 md:p-1 md:rounded flex-row shadow-lg">
                        {/* Move Folder Action */}
                        <button
                          onClick={(e) => toggleMoverPlaylistACarpeta(pl, e)}
                          className={`p-1.5 sm:p-2 md:hidden rounded-lg transition-all active:scale-95 cursor-pointer ${
                            isInFolder
                              ? "text-amber-400 active:bg-amber-500/20"
                              : "text-slate-400 active:text-[#1ED760] active:bg-[#1ED760]/20"
                          }`}
                          title={
                            isInFolder
                              ? "Sacar de Tus Listas"
                              : "Mover a Tus Listas"
                          }
                        >
                          {isInFolder ? (
                            <FolderMinus className="w-4 h-4 md:w-3.5 md:h-3.5" />
                          ) : (
                            <FolderPlus className="w-4 h-4 md:w-3.5 md:h-3.5" />
                          )}
                        </button>

                        {/* Delete Button */}
                        {(user?.uid === pl.ownerId || isAdmin) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startDeleting(pl.id);
                            }}
                            className="p-1.5 sm:p-2 text-slate-400 active:text-red-500 active:bg-red-500/20 rounded-lg transition-all active:scale-95 cursor-pointer"
                            title="Eliminar Canal"
                          >
                            <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              };

              return (
                <div className="flex flex-col gap-2.5 w-full">
                  {/* Pinned Favoritos Area (Spotify Style) */}
                  {favoritosPlaylist && (
                    <div
                      onClick={() => selectPlaylist(favoritosPlaylist)}
                      className={`group w-full relative cursor-pointer flex flex-row items-center justify-between p-3 rounded-2xl transition-all text-left mb-1 border border-transparent ${
                        selectedPlaylist?.id === favoritosPlaylist.id
                          ? "bg-[#1ED760]/5 border-l-[3px] border-[#1ED760] ring-1 ring-[#1ED760]/10"
                          : "active:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        {/* Pinned Heart cover art */}
                        <div className="relative w-16 h-16 md:w-12 md:h-12 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-lg overflow-hidden shrink-0 group-active:scale-105 transition-transform duration-300">
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                          <Heart className="w-5 h-5 text-white fill-white shadow-md relative z-10" />

                          {/* Hover Play Indicator Overlay */}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 text-white fill-white translate-x-px" />
                          </div>
                        </div>

                        {/* Text details */}
                        <div className="flex-1 min-w-0 text-left flex flex-col justify-center items-start gap-1">
                          <p className="text-[14px] md:text-[14px] font-bold text-rose-400 group-active:text-pink-400 transition-colors uppercase tracking-wider leading-none truncate w-full">
                            Tus Siguiente
                          </p>
                          <p className="text-[12px] md:text-[12px] text-slate-400 font-medium uppercase tracking-wide truncate w-full">
                            {favoritosPlaylist.tracks?.length || 0}{" "}
                            {favoritosPlaylist.tracks?.length === 1
                              ? "Canción"
                              : "Canciones"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tus Listas Accordion Header */}
                  <div
                    onClick={() => {
                      const newVal = !folderExpanded;
                      setFolderExpanded(newVal);
                      localStorage.setItem(
                        "gym_music_folder_expanded",
                        String(newVal),
                      );
                    }}
                    className="group w-full relative cursor-pointer flex flex-row items-center justify-between p-3 rounded-2xl bg-[#09090b] border border-white/5 active:bg-white/[0.05] transition-all text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <div className="relative w-16 h-16 md:w-12 md:h-12 rounded-lg bg-gradient-to-tr from-[#1ED760]/20 to-emerald-500/5 border border-[#1ED760]/20 flex items-center justify-center text-[#1ED760] shadow-md shrink-0">
                        <ListMusic className="w-5 h-5 shadow-lg" />
                        {sortedFolderList.length > 0 && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                            <span
                              className={`${isEcoMode ? "" : "animate-ping"} absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75`}
                            ></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1ED760]"></span>
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 text-left flex flex-col justify-center items-start gap-1">
                        <p className="text-[14px] md:text-[14px] font-bold text-white group-active:text-[#1ED760] transition-colors uppercase tracking-wide leading-none truncate max-w-full">
                          Tus Listas
                        </p>
                        <p className="text-[12px] md:text-[12px] text-[#1ED760] font-medium uppercase tracking-wider truncate max-w-full">
                          {sortedFolderList.length}{" "}
                          {sortedFolderList.length === 1
                            ? "Playlist"
                            : "Playlists"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-1">
                      {folderExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 group-active:text-white transition-colors" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-300 group-active:text-white transition-colors" />
                      )}
                    </div>
                  </div>

                  {/* Content of the Folder, if expanded */}
                  <AnimatePresence>
                    {folderExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden flex flex-col gap-2 pl-3 ml-2 border-l border-white/5"
                      >
                        {sortedFolderList.length === 0 ? (
                          <p className="text-[10px] text-slate-500 italic py-2 pl-3 select-none">
                            Vacía. Todo lo que agregues irá aquí.
                          </p>
                        ) : (
                          sortedFolderList.map((pl) =>
                            renderPlaylistItem(pl, true),
                          )
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Root Playlists (Outside folder, if any) */}
                  {sortedRootList.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/[0.03]">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider px-3 select-none">
                        Otras Listas
                      </p>
                      {sortedRootList.map((pl) =>
                        renderPlaylistItem(pl, false),
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* User Session & Status */}
          {!user ? (
            <div className="p-2 md:p-3 md:mt-auto border-t border-white/5 bg-emerald-500/5 flex flex-col items-stretch gap-2 shrink-0">
              <div className="hidden md:block text-left shrink-0">
                <p className="text-[8px] font-black uppercase text-emerald-400 tracking-wider">
                  Modo Administrador
                </p>
                <p className="text-[8px] text-slate-500 font-bold mt-0.5">
                  Para gestionar canales
                </p>
              </div>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="py-1.5 md:py-2 bg-emerald-500 active:bg-emerald-400 text-black font-black uppercase tracking-wider text-[10px] rounded-lg md:rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Shield className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Entrar</span>
              </button>
            </div>
          ) : (
            <div className="p-2 md:p-3 md:mt-auto border-t border-white/5 bg-black/20 flex flex-col items-stretch gap-2 shrink-0 relative">
              {/* Floating Dropdown Menú Estilo Spotify */}
              <AnimatePresence>
                {isMembershipDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute bottom-full left-2 right-2 mb-2 bg-[#121214] border border-white/10 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.8)] p-1.5 z-[100] flex flex-col backdrop-blur-md"
                  >
                    {/* Dropdown Header Info */}
                    <div className="px-3 py-2 border-b border-white/5 mb-1 text-left">
                      <p className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                        Suscripción Premium
                      </p>
                      <p className="text-[10px] text-[#1ED760] font-extrabold mt-0.5 truncate max-w-full">
                        {accessData?.daysRemaining || 0} Días restantes
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsProfileModalOpen(true);
                        setIsMembershipDropdownOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 active:text-white active:bg-white/[0.05] transition-colors cursor-pointer text-[11px] font-bold"
                    >
                      <User className="w-4 h-4 text-[#1ED760]" />
                      <span>Mi Perfil (Editar Datos)</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setIsAdminPanelOpen(true);
                          setIsMembershipDropdownOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#1ED760] active:text-emerald-300 active:bg-[#1ED760]/10 transition-colors cursor-pointer text-[11px] font-black"
                      >
                        <Shield className="w-4 h-4 text-[#1ED760]" />
                        <span>Panel de Admin</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setIsMembershipDropdownOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 active:text-red-400 active:bg-red-500/10 transition-colors cursor-pointer text-[11px] font-bold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Spotify-style User Pill Button */}
              <button
                onClick={() =>
                  setIsMembershipDropdownOpen(!isMembershipDropdownOpen)
                }
                className={`flex items-center justify-between gap-2.5 p-2 bg-white/[0.03] active:bg-white/[0.08] active:scale-[0.98] border rounded-full cursor-pointer transition-all w-full select-none text-left z-20 ${
                  isMembershipDropdownOpen
                    ? "border-[#1ED760]/40 bg-white/[0.06] shadow-[0_0_15px_rgba(30,215,96,0.15)]"
                    : "border-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Circle Avatar with Initials */}
                  <div className="w-9 h-9 bg-gradient-to-tr from-emerald-500 to-[#1ED760] rounded-full flex items-center justify-center text-black font-black text-[11px] shrink-0 shadow-md">
                    <span>
                      {user.displayName
                        ? user.displayName.substring(0, 2).toUpperCase()
                        : "SP"}
                    </span>
                  </div>

                  <div className="text-left min-w-0">
                    <p className="text-[10px] text-white font-extrabold truncate uppercase tracking-wide leading-tight">
                      {user.displayName || "Socio Premium"}
                    </p>
                    <p className="text-[8px] text-[#1ED760] font-black uppercase tracking-wider leading-none mt-0.5">
                      {user.email === "eltygere8651@gmail.com"
                        ? "Administrador"
                        : `Premium • ${accessData?.daysRemaining || 0}d`}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-slate-400 pr-0.5">
                  {isMembershipDropdownOpen ? (
                    <ChevronDown className="w-4 h-4 text-[#1ED760] transition-transform duration-200" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-400 active:text-white transition-all" />
                  )}
                </div>
              </button>
            </div>
          )}
        </div>

        {/* CONTAINER PLAYER + TRACKLIST */}
        <div
          className={`${mobileView === "player" ? "flex" : "hidden md:flex"} flex-col-reverse md:flex-col flex-1 min-w-0 min-h-0 overflow-hidden bg-[#070708]`}
        >
          {/* PLAYER BAR */}
          <div
            className={`${(!selectedPlaylist && !isPlaying && !overrideCurrentTrack) || trackListTab === "entertainment" || trackListTab === "radio-fai" || trackListTab === "karaoke" ? "hidden" : !isTrackListExpanded ? "flex-1 p-3 pb-1 md:p-5 md:pb-3 flex flex-col justify-start items-center overflow-y-auto overflow-x-hidden" : "hidden md:flex flex-none p-3 border-b border-white/5"} bg-[#0a0a0b]/85  border-b border-white/10 relative shrink-0 transition-all duration-500 ease-in-out z-30`}
          >
            {selectedPlaylist || overrideCurrentTrack || currentTrack ? (
              <div className="w-full flex-1 flex flex-col min-h-0">
                {/* 1. PC COMPACT / MINIMIZED LAYOUT (Shown only on Desktop when minimized) */}
                {isTrackListExpanded && (
                  <div className="hidden md:flex items-center justify-between w-full h-[86px] px-4 bg-[#000000] border-t border-white/5 relative z-50">
                    {/* Left: Artwork + Title + Artist + Heart icon */}
                    <div className="flex items-center gap-4 min-w-[200px] w-1/4">
                      <div className="relative shrink-0 flex items-center justify-center min-h-0 w-16 h-16">
                        <div
                          className={`relative z-10 w-full h-full rounded-xl overflow-hidden ${isEcoMode ? "shadow-sm" : "shadow-lg"} border border-white/5`}
                        >
                          <img
                            src={displayArtwork}
                            alt="Artwork"
                            className="w-full h-full object-cover transition-opacity duration-300"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <h1 className="font-black text-white uppercase tracking-tight text-sm truncate">
                            {displayTitle}
                          </h1>
                          {isLoadingTrack && (
                            <Loader2 className="text-emerald-500 animate-spin shrink-0 w-3 h-3 ml-1" />
                          )}
                        </div>
                        <p className="font-bold text-[#1ED760] uppercase tracking-wider text-[10px] mt-0.5 truncate">
                          {displayArtist}
                        </p>
                      </div>
                    </div>

                    {/* Center: Controls + Timeline combined */}
                    <div className="flex flex-col items-center justify-center gap-2 w-1/2 max-w-[600px]">
                      {/* Controls Row */}
                      <div className="flex items-center justify-center gap-6">
                        <button
                          onClick={() => setIsShuffle(!isShuffle)}
                          title="Aleatorio"
                          className={`p-1 transition-all transform active:scale-95 ${isShuffle ? "text-[#1ED760]" : "text-slate-500 active:text-white"}`}
                        >
                          <Shuffle className="w-5 h-5" />
                        </button>

                        <button
                          onClick={handlePrev}
                          title="Anterior"
                          className="p-1 text-white active:text-blue-400 transition-all transform active:scale-90"
                        >
                          <SkipBack className="fill-current w-9 h-9" />
                        </button>

                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          
                          onClick={togglePlayback}
                          className="rounded-full w-16 h-16 bg-white text-black flex items-center justify-center transition-all duration-350 shadow-md"
                        >
                          {isPlaying ? (
                            <Pause className="fill-current text-black w-8 h-8" />
                          ) : (
                            <Play className="fill-current text-black w-8 h-8 ml-1" />
                          )}
                        </motion.button>

                        <button
                          onClick={handleNext}
                          title="Siguiente"
                          className="p-1 text-white active:text-blue-400 transition-all transform active:scale-90"
                        >
                          <SkipForward className="fill-current w-9 h-9" />
                        </button>
                        <button
                          onClick={() => setIsRepeat(!isRepeat)}
                          title="Repetir"
                          className={`p-1 transition-all transform active:scale-95 ${isRepeat ? "text-[#1ED760]" : "text-slate-500 active:text-white"}`}
                        >
                          <Repeat className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Timeline Row */}
                      <div className="flex items-center w-full gap-3">
                        <span className="text-[10px] font-bold text-slate-500 font-mono w-[35px] text-right">
                          {formatTime(position)}
                        </span>
                        <div
                          onPointerDown={handleTimelinePointerDown}
                          className="flex-1 relative flex items-center h-4 cursor-pointer min-w-0 group/timeline select-none touch-none"
                        >
                          <div className="w-full h-1.5 bg-white/10 rounded-full relative overflow-hidden pointer-events-none group-hover/timeline:h-2 transition-all">
                            <div
                              className="h-full bg-white rounded-full relative"
                              style={{
                                width: `${duration > 0 ? (position / duration) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <div
                            className="absolute w-3.5 h-3.5 bg-white rounded-full opacity-0 group-hover/timeline:opacity-100 shadow-md pointer-events-none transition-opacity"
                            style={{
                              left: `calc(${duration > 0 ? (position / duration) * 100 : 0}% - 7px)`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 font-mono w-[35px] text-left">
                          {formatTime(duration)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions + Volume */}
                    <div className="flex justify-end items-center gap-4 min-w-[200px] w-1/4">
                      <button
                        onClick={() =>
                          setIsTrackListExpanded(!isTrackListExpanded)
                        }
                        className="p-1.5 text-[#b3b3b3] active:text-white transition-colors outline-none cursor-pointer"
                        title={
                          isTrackListExpanded ? "Pantalla Completa" : "Contraer"
                        }
                      >
                        {isTrackListExpanded ? (
                          <Maximize2 className="w-4 h-4" />
                        ) : (
                          <Minimize2 className="w-4 h-4" />
                        )}
                      </button>

                      {/* Heart Icon to like instantly */}
                      <button
                        onClick={(e) => handleToggleFavorite(currentTrack, e)}
                        className="p-2 text-slate-400 active:text-pink-500 active:scale-90 transition-all cursor-pointer rounded-full bg-white/5"
                        title="Añadir a Favoritos"
                      >
                        <Heart
                          className={`w-[15px] h-[15px] transition-colors ${
                            userPlaylists
                              .find(
                                (p) =>
                                  p.ownerId === user?.uid &&
                                  (p.name.toLowerCase() === "favoritos" ||
                                    p.name.toLowerCase() === "siguiente"),
                              )
                              ?.tracks.some(
                                (t) =>
                                  (currentTrack.id &&
                                    t.id === currentTrack.id) ||
                                  (currentTrack.url &&
                                    t.url === currentTrack.url),
                              )
                              ? "fill-[#1ED760] text-[#1ED760]"
                              : ""
                          }`}
                        />
                      </button>

                      
                      

                      {/* Volume Adjuster */}
                      <div className="flex items-center justify-end gap-2 group/vol w-[100px]">
                        <Volume2 className="w-4 h-4 text-slate-400 group-hover/vol:text-white transition-colors shrink-0" />
                        <div
                          onPointerDown={handleVolumePointerDown}
                          className="w-full h-1.5 bg-white/20 rounded-full relative cursor-pointer group-hover/vol:h-2 transition-all touch-none flex items-center"
                        >
                          <div
                            className="absolute left-0 h-full rounded-full bg-slate-300 group-hover/vol:bg-[#1ED760] pointer-events-none transition-colors"
                            style={{ width: `${volume}%` }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow opacity-0 group-hover/vol:opacity-100 transition-opacity translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. DYNAMIC FULL SCREEN LAYOUT (Shown on Mobile always when expanded, or Desktop when maximized) */}
                {!isTrackListExpanded && (
                  <div className="flex flex-col gap-1 sm:gap-1.5 items-center justify-start w-full max-w-2xl mx-auto h-full flex-1 relative pt-12 sm:pt-6">
                    {/* Global Player Header: Minimize (Left) & Tabs Switcher (Center) decoupled */}
                    <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 grid grid-cols-[3rem_1fr_3rem] sm:grid-cols-[3.5rem_1fr_3.5rem] items-center z-50 shrink-0 gap-2">
                      {/* Left: Minimize button - Decoupled and easily accessible at the top left */}
                      <div className="flex items-center justify-start">
                        <button
                          onClick={() => {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            setIsTrackListExpanded(true);
                          }}
                          title="Minimizar reproductor"
                          className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-black/40 backdrop-blur-md border border-white/10 active:bg-white/20 active:scale-95 rounded-full transition-all text-white shadow-xl cursor-pointer"
                        >
                          <ChevronDown className="w-8 h-8 sm:w-7 sm:h-7" />
                        </button>
                      </div>

                      {/* Center: Tabs Switcher */}
                      <div className="flex items-center justify-center w-full min-w-0">
                        <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md max-w-full p-1 rounded-full border border-white/5 mx-auto overflow-x-auto premium-scrollbar">
                          <button
                            onClick={() => setPlayerTab("artwork")}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold transition-all truncate whitespace-nowrap ${playerTab === "artwork" ? "bg-white/10 text-white shadow-lg" : "text-slate-400 active:text-white active:bg-white/5"}`}
                          >
                            Carátula
                          </button>
                          <button
                            onClick={() => setPlayerTab("siguiente")}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold transition-all truncate whitespace-nowrap ${playerTab === "siguiente" ? "bg-white/10 text-white shadow-lg" : "text-slate-400 active:text-white active:bg-white/5"}`}
                          >
                            Siguiente
                          </button>
                          <button
                            onClick={() => setPlayerTab("cola")}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold transition-all truncate whitespace-nowrap ${playerTab === "cola" ? "bg-white/10 text-white shadow-lg" : "text-slate-400 active:text-white active:bg-white/5"}`}
                          >
                            Cola
                          </button>
                        </div>
                      </div>

                      {/* Right Placeholder to balance CSS Grid */}
                      <div />
                    </div>

                    {/* Artwork & Title centrally stacked */}
                    <div className="flex w-full min-w-0 relative flex-col items-center flex-1 justify-center mt-6 sm:mt-8">
                      <div className="flex flex-col items-center justify-center w-full flex-1 min-h-0">
                        {/* Contents according to tab */}
                        {playerTab === "artwork" && (
                          <div className="relative shrink-0 flex items-center justify-center min-h-0 flex-1 w-full max-w-[260px] sm:max-w-[380px] lg:max-w-[460px] max-h-[35vh] sm:max-h-[45vh] lg:max-h-[50vh] aspect-square mb-2.5 sm:mb-4 mx-auto">
                            <AnimatePresence>
                              {isPlaying && !isEcoMode && (
                                <motion.div
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1.1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  className="absolute -inset-1.5 bg-emerald-500/20 blur-md rounded-full pointer-events-none"
                                />
                              )}
                            </AnimatePresence>
                            <div
                              className={`relative z-10 w-full h-full rounded-2xl overflow-hidden ${isEcoMode ? "shadow-lg" : "shadow-2xl"} border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]`}
                            >
                              <img
                                src={displayArtwork}
                                alt="Artwork"
                                className="w-full h-full object-cover transition-opacity duration-300"
                                referrerPolicy="no-referrer"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/5 pointer-events-none" />
                            </div>
                          </div>
                        )}

                        {playerTab === "siguiente" && (
                          <div className="relative shrink-0 flex items-center justify-start min-h-0 flex-1 w-full max-w-[260px] sm:max-w-[380px] lg:max-w-[460px] max-h-[35vh] sm:max-h-[45vh] lg:max-h-[50vh] aspect-square mb-2.5 sm:mb-4 mx-auto bg-black/50 rounded-2xl border border-white/10 flex-col overflow-hidden">
                            <div className="p-3 border-b border-white/10 bg-white/5 w-full shrink-0 flex items-center justify-between z-10">
                              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider truncate mr-2">
                                {playingPlaylist
                                  ? playingPlaylist.name
                                  : "Playlist"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold shrink-0">
                                {playingPlaylist
                                  ? playingPlaylist.tracks.length
                                  : 0}{" "}
                                canciones
                              </span>
                            </div>
                            <div className="w-full flex-1 min-h-0 overflow-y-auto premium-scrollbar p-2 flex flex-col gap-1">
                              {!playingPlaylist ||
                              playingPlaylist.tracks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                  <ListMusic className="w-8 h-8 opacity-40 mb-2" />
                                  <p className="text-xs uppercase font-bold tracking-wider text-center">
                                    No estás reproduciendo
                                    <br />
                                    ninguna playlist
                                  </p>
                                </div>
                              ) : (
                                playingPlaylist.tracks.map((track, i) => {
                                  const isActive = currentTrackIndex === i;
                                  return (
                                    <button
                                      key={i}
                                      onClick={() =>
                                        playPreviewTrack(playingPlaylist, i)
                                      }
                                      className={`flex gap-2 items-center p-1.5 rounded-lg active:bg-white/5 transition-colors text-left w-full ${isActive ? "bg-white/10" : ""}`}
                                    >
                                      <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 bg-white/10 rounded overflow-hidden relative">
                                        <img
                                          src={cleanUrl(
                                            track.thumbnail ||
                                            track.artwork_url ||
                                            track.artwork ||
                                            ""
                                          )}
                                          className="w-full h-full object-cover"
                                          alt=""
                                        />
                                        {isActive && (
                                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <div className="w-3 h-3 flex items-end justify-center gap-0.5">
                                              <div className="w-0.5 bg-[#1ED760] animate-[musicBar_1s_ease-in-out_infinite_alternate] h-[60%]" />
                                              <div className="w-0.5 bg-[#1ED760] animate-[musicBar_1.2s_ease-in-out_infinite_alternate-reverse] h-full" />
                                              <div className="w-0.5 bg-[#1ED760] animate-[musicBar_0.8s_ease-in-out_infinite_alternate] h-[80%]" />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p
                                          className={`text-xs font-bold truncate ${isActive ? "text-[#1ED760]" : "text-slate-200"}`}
                                        >
                                          {track.title || track.name}
                                        </p>
                                        <p className="text-[10px] text-emerald-400 truncate mt-0.5">
                                          {track.artist || track.username}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}

                        {playerTab === "cola" && (
                          <div className="relative shrink-0 flex items-center justify-start min-h-0 flex-1 w-full max-w-[260px] sm:max-w-[380px] lg:max-w-[460px] max-h-[35vh] sm:max-h-[45vh] lg:max-h-[50vh] aspect-square mb-2.5 sm:mb-4 mx-auto bg-black/50 rounded-2xl border border-white/10 flex-col overflow-hidden">
                            <div className="p-3 border-b border-white/10 bg-white/5 w-full shrink-0 flex items-center justify-between z-10">
                              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                A continuación
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">
                                {trackQueue.length} canciones
                              </span>
                            </div>
                            <div className="w-full flex-1 min-h-0 overflow-y-auto premium-scrollbar p-2 flex flex-col gap-1">
                              {trackQueue.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                  <ListPlus className="w-8 h-8 opacity-40 mb-2" />
                                  <p className="text-xs uppercase font-bold tracking-wider">
                                    Cola vacía
                                  </p>
                                </div>
                              ) : (
                                trackQueue.map((track, i) => (
                                  <div
                                    key={i}
                                    className="flex gap-2 items-center p-1.5 rounded-lg active:bg-white/5 transition-colors"
                                  >
                                    <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 bg-white/10 rounded overflow-hidden">
                                      <img
                                        src={cleanUrl(
                                          track.thumbnail ||
                                          track.artwork_url ||
                                          track.artwork ||
                                          ""
                                        )}
                                        className="w-full h-full object-cover"
                                        alt=""
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-slate-200 truncate">
                                        {track.title || track.name}
                                      </p>
                                      <p className="text-[10px] text-emerald-400 truncate mt-0.5">
                                        {track.artist || track.username}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}

                        {/* Title details & Heart favorite button stacked horizontally */}
                        <div className="flex items-center justify-between w-full max-w-[260px] sm:max-w-[380px] lg:max-w-[460px] px-1 mb-2 sm:mb-4">
                          <div className="flex flex-col min-w-0 text-left">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <h1 className="font-black text-white uppercase tracking-tight text-xl sm:text-2xl truncate max-w-[55vw] sm:max-w-[300px]">
                                {displayTitle}
                              </h1>
                              {isLoadingTrack && (
                                <Loader2 className="text-emerald-500 animate-spin shrink-0 w-4 h-4 ml-1.5" />
                              )}
                            </div>
                            <p className="font-black text-[#1ED760] uppercase tracking-[0.2em] text-[10px] sm:text-xs mt-1 truncate max-w-[55vw] sm:max-w-[300px]">
                              {displayArtist}
                            </p>
                          </div>

                          {/* Heart Icon to like instantly from full screen on mobile/desktop */}
                          <button
                            onClick={(e) =>
                              handleToggleFavorite(currentTrack, e)
                            }
                            className="p-1.5 sm:p-2 text-slate-400 active:text-pink-500 active:scale-90 transition-all cursor-pointer rounded-full bg-white/5 ml-3 shrink-0"
                            title="Añadir a Favoritos"
                          >
                            <Heart
                              className={`w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] transition-colors ${
                                userPlaylists
                                  .find(
                                    (p) =>
                                      p.ownerId === user?.uid &&
                                      (p.name.toLowerCase() === "favoritos" ||
                                        p.name.toLowerCase() === "siguiente"),
                                  )
                                  ?.tracks.some(
                                    (t) =>
                                      (currentTrack.id &&
                                        t.id === currentTrack.id) ||
                                      (currentTrack.url &&
                                        t.url === currentTrack.url),
                                  )
                                  ? "fill-pink-500 text-pink-500"
                                  : ""
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Timeline slider + Control knobs combined */}
                    <div className="flex flex-col w-full px-1 sm:px-0 mx-auto max-w-[260px] sm:max-w-[380px] lg:max-w-[460px] gap-2.5 sm:gap-4 mb-2 sm:mb-4">
                      {/* Timeline */}
                      <div className="flex flex-col w-full gap-2">
                        <div
                          onPointerDown={handleTimelinePointerDown}
                          className="flex-1 relative flex items-center h-2.5 cursor-pointer min-w-0 group/timeline select-none touch-none"
                        >
                          <div className="w-full h-1 bg-white/10 rounded-full relative overflow-hidden pointer-events-none group-hover/timeline:h-1.5 transition-all">
                            <div
                              className="h-full bg-white rounded-full relative"
                              style={{
                                width: `${duration > 0 ? (position / duration) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <div
                            className="absolute w-3 h-3 bg-white rounded-full opacity-100 shadow-md pointer-events-none"
                            style={{
                              left: `calc(${duration > 0 ? (position / duration) * 100 : 0}% - 6px)`,
                            }}
                          />
                        </div>

                        <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest px-0.5 font-mono">
                          <span>{formatTime(position)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      {/* Buttons controls */}
                      <div className="grid grid-cols-[0.8fr_auto_1.2fr] sm:grid-cols-[1fr_auto_1fr] items-center w-full px-1 gap-1">
                        {/* Shuffle + Repeat */}
                        <div className="flex justify-start items-center gap-1.5 sm:gap-3">
                          <button
                            onClick={() => setIsShuffle(!isShuffle)}
                            title="Aleatorio"
                            className={`p-1 sm:p-2 transition-all transform active:scale-95 ${isShuffle ? "text-[#1ED760]" : "text-slate-500 active:text-white"}`}
                          >
                            <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          
                          <button
                            onClick={() => setIsRepeat(!isRepeat)}
                            title="Repetir"
                            className={`p-1 sm:p-2 transition-all transform active:scale-95 ${isRepeat ? "text-[#1ED760]" : "text-slate-500 active:text-white"}`}
                          >
                            <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>

                        {/* Prev - Play - Next */}
                        <div className="flex items-center justify-center gap-4 sm:gap-8">
                          <button
                            onClick={handlePrev}
                            title="Anterior"
                            className="p-1 sm:p-2 text-white active:text-blue-400 transition-all transform active:scale-90 flex-shrink-0"
                          >
                            <SkipBack className="fill-current w-8 h-8 sm:w-8 sm:h-8" />
                          </button>

                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            
                            onClick={togglePlayback}
                            className="rounded-full w-16 h-16 sm:w-16 sm:h-16 bg-white text-black flex items-center justify-center transition-all duration-350 shadow-xl"
                          >
                            {isPlaying ? (
                              <Pause className="fill-current text-black w-5 h-5 sm:w-7 sm:h-7" />
                            ) : (
                              <Play className="fill-current text-black w-5 h-5 sm:w-7 sm:h-7 ml-0.5 sm:ml-1" />
                            )}
                          </motion.button>

                          <button
                            onClick={handleNext}
                            title="Siguiente"
                            className="p-1 sm:p-2 text-white active:text-blue-400 transition-all transform active:scale-90 flex-shrink-0"
                          >
                            <SkipForward className="fill-current w-8 h-8 sm:w-8 sm:h-8" />
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
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  Selecciona o Añade un Canal para empezar
                </p>
              </div>
            )}
          </div>

          {/* BELOW LAYOUT: PERMANENT TRACK LIST */}
          {selectedPlaylist ||
          trackListTab === "search" ||
          trackListTab === "entertainment" ||
          trackListTab === "karaoke" ||
          trackListTab === "radio-fai" ? (
            <div
              className={`flex flex-col min-h-0 bg-black/40 flex-1 border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.4)] relative z-20 overflow-hidden transform-gpu ${!isTrackListExpanded && (selectedPlaylist || isPlaying || overrideCurrentTrack) && trackListTab !== "radio-fai" ? "hidden" : "flex"}`}
            >
              {trackListTab !== "entertainment" && trackListTab !== "radio-fai" && trackListTab !== "karaoke" && (
                <div className="w-full relative px-3 py-1.5 sm:px-4 sm:py-2 border-b border-white/5 flex flex-col shrink-0 bg-[#080809]/40">
                  <div className="flex flex-col w-full">
                    {/* Search Bar matching Tab */}
                    <div className="flex items-center gap-2 w-full">
                      {(trackListTab === "playlist" ||
                        trackListTab === "queue") && (
                        <button
                          onClick={() => {
                            if (trackListTab === "playlist") {
                              setSelectedPlaylist(null);
                            }
    setTrackListTab("search");
                            setSearchQuery("");
                            if (window.innerWidth < 768) {
                              setMobileView("playlists");
                            } else {
                              setIsSidebarExpanded(true);
                            }
                          }}
                          title="Volver"
                          className="group flex items-center justify-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 shrink-0 text-slate-400 bg-white/5 active:text-white active:bg-white/10 rounded-lg transition-all active:scale-95 cursor-pointer overflow-hidden border border-transparent active:border-white/10"
                        >
                          <ChevronLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5 transition-transform group-active:-translate-x-0.5" />
                          <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">
                            Volver
                          </span>
                        </button>
                      )}
                      <div className="relative flex-1 group">
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                          <Search
                            className={`w-3.5 h-3.5 transition-colors ${searchQuery ? "text-emerald-500/70" : "text-slate-500"}`}
                          />
                        </div>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
    setTrackListTab("search");
                            handleYoutubeSearch(e);
                          }}
                        >
                          <input
                            type="text"
                            placeholder={
                              trackListTab === "playlist"
                                ? `Buscar en ${selectedPlaylist?.name || "playlist"}...`
                                : trackListTab === "queue"
                                  ? "¿Qué hay en la cola?"
                                  : "¿Qué te apetece escuchar?..."
                            }
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              if (
                                !e.target.value &&
                                trackListTab === "search"
                              ) {
                                setYoutubeResults([]);
                              }
                            }}
                            className="w-full bg-[#111113]/80 border border-white/5 rounded-lg py-1 pl-7.5 pr-8 text-[11px] text-white placeholder-slate-500/80 focus:outline-none focus:border-emerald-500/20 focus:bg-white/[0.04] transition-all font-medium tracking-wide"
                          />
                        </form>
                        {searchQuery && (
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              if (trackListTab === "search") {
                                setYoutubeResults([]);
                              }
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 active:text-white p-1 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {trackListTab === "queue" && trackQueue.length > 0 && (
                        <button
                          onClick={() => {
                            setTrackQueue([]);
                            showNotification("Cola vaciada con éxito");
                          }}
                          className="shrink-0 py-1 px-2.5 text-[9.5px] font-bold uppercase text-red-400 bg-red-500/10 border border-red-500/10 active:border-red-500/20 rounded-md transition-all cursor-pointer"
                        >
                          Vaciar
                        </button>
                      )}
                      {trackListTab === "playlist" &&
                        selectedPlaylist?.ownerId === user?.uid && (
                          <button
                            onClick={() => {
                              setSearchQuery("");
    setTrackListTab("search");
                            }}
                            className="shrink-0 py-1.5 px-3 text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 active:bg-emerald-500/20 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 h-full"
                            title="Buscar canciones para añadir"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              Añadir Canciones
                            </span>
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col flex-1 min-h-0 bg-[#0a0a0b] relative overflow-hidden">
                {/* Unified ambient background glow matching FAIView (FLUX) tab */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60%] bg-gradient-to-b from-fuchsia-600/10 via-cyan-600/5 to-transparent blur-[120px] rounded-full pointer-events-none z-0" />
                <div
                  className={`flex-1 ${trackListTab === "entertainment" || trackListTab === "radio-fai" || trackListTab === "karaoke" ? "overflow-hidden pb-0" : "overflow-y-auto pb-[120px] sm:pb-0"} p-0 sm:p-0 premium-scrollbar relative flex flex-col`}
                >
                  {trackListTab === "karaoke" ? (
                    <React.Suspense
                      fallback={
                        <div className="p-12 text-center text-slate-500">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                        </div>
                      }
                    >
                      <LazyFluxKaraoke />
                    </React.Suspense>
                  ) : trackListTab === "entertainment" ? (
                    <React.Suspense
                      fallback={
                        <div className="p-12 text-center text-slate-500">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                        </div>
                      }
                    >
                      <LazyPodcastView
                        isVisible={true}
                        pauseBackgroundMusic={() => {
                          setIsPlaying(false);
                          expectedPlayingRef.current = false;
                          if (youtubePlayerRef.current) {
                            try {
                              const intPlayer =
                                youtubePlayerRef.current.getInternalPlayer();
                              if (
                                intPlayer &&
                                typeof intPlayer.pauseVideo === "function"
                              ) {
                                intPlayer.pauseVideo();
                              }
                            } catch (e) {}
                          }
                          if (fallbackSilentAudioRef.current) {
                            fallbackSilentAudioRef.current.pause();
                          }
                        }}
                      />
                    </React.Suspense>
                  ) : trackListTab === "radio-fai" ? (
                    <div className="flex-1 h-full overflow-hidden">
                      <FAIView 
                        isAdmin={isAdmin}
                        favorites={userPlaylists.find(pl => pl.name?.toLowerCase() === "favoritos")?.tracks || []}
                        topTracks={Object.values(getPlayHistory())
                          .sort((a, b) => b.playCount - a.playCount)
                          .slice(0, 30)
                          .map((h) => {
                            const dbT = ALL_DATABASE_TRACKS.find(t => t.id === h.trackId);
                            return {
                              id: h.trackId,
                              title: h.title,
                              artist: h.artist,
                              bpm: h.bpm,
                              url: h.url || (dbT ? dbT.url : `https://www.youtube.com/watch?v=${h.trackId}`),
                              duration: "N/A",
                            };
                          })}
                        allTracks={ALL_DATABASE_TRACKS}
                        currentTrack={overrideCurrentTrack || (currentTrackIndex !== -1 ? displayTracks[currentTrackIndex] : null)}
                        isPlaying={isPlaying}
                        onTogglePlay={togglePlayback}
                        onToggleFavorite={handleToggleFavorite}
                        onPlayTrack={(track) => {
                          expectedPlayingRef.current = true;
                          isBufferingRef.current = true;
                          setOverrideCurrentTrack(track);
                          setIsPlaying(true);
                          loadIframeVideoDirectly(track);
                        }}
                        volume={volume}
                        onVolumeChange={(val) => {
                          handleVolumeChange(val);
                        }}
                        position={position}
                        duration={duration > 0 ? duration / 1000 : 0}
                        triggerAiDj={playAiDj}
                      />
                    </div>
                  ) : trackListTab === "search" ? (
                    <div className="space-y-1">
                      {/* Search results view */}

                      {(searchQuery || youtubeResults.length > 0) && (
                        <div className="flex items-center justify-between px-2 py-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Resultados de Búsqueda
                          </span>
                        </div>
                      )}

                      {isSearchingYT && (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                      )}

                      {!isSearchingYT && youtubeResults.length === 0 && (
                        <div className="py-2.5 sm:py-4 px-2.5 sm:px-4">
                          {/* Las categorías redundantes fueron removidas a pedido del usuario */}

                          {searchQuery ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center">
                              <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest leading-relaxed">
                                No se encontraron resultados para tu búsqueda
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {/* 2. Pantalla o Esqueleto de Carga */}
                              {isLoadingExplore ? (
                                <div className="space-y-4 py-8">
                                  <div className="flex items-center gap-3 animate-pulse px-2">
                                    <div className="w-5 h-5 rounded-full bg-white/5" />
                                    <div className="h-4 w-40 bg-white/5 rounded" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 pb-4">
                                    <div className="h-28 bg-white/[0.02] rounded-2xl animate-pulse border border-white/5" />
                                    <div className="h-28 bg-white/[0.02] rounded-2xl animate-pulse border border-white/5" />
                                  </div>
                                  <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-5 h-5 text-emerald-500/50 animate-spin" />
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-6">
                                  <React.Suspense
                                    fallback={
                                      <div className="p-12 text-center text-slate-500">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                                      </div>
                                    }
                                  >
                                    <LazyExploreView
                                      exploreData={exploreData}
                                      customPlaylists={customExplorePlaylists}
                                      exploreLayout={exploreLayout}
                                      isAdmin={isAdmin}
                                      onAddCustomPlaylist={
                                        handleAddCustomExplorePlaylist
                                      }
                                      onDeleteCustomPlaylist={
                                        handleDeleteCustomExplorePlaylist
                                      }
                                      onUpdateExploreLayout={
                                        handleUpdateExploreLayout
                                      }
                                      setOverrideCurrentTrack={(track) => {
                                        setOverrideCurrentTrack(track);
                                        loadIframeVideoDirectly(track);
                                      }}
                                      setIsPlaying={setIsPlaying}
                                      showNotification={showNotification}
                                      addYoutubeTrackToPlaylist={
                                        addYoutubeTrackToPlaylist
                                      }
                                      loadPlaylistAndPlay={
                                        handleLoadExplorePlaylist
                                      }
                                      playTracksContext={(tracks, startIdx) => {
                                        const mapped = tracks.map((t: any) => ({
                                          id: t.id,
                                          title: t.title,
                                          artist: t.artist || "Artista",
                                          url: `https://www.youtube.com/watch?v=${t.id}`,
                                          duration: t.duration || "N/A",
                                          bpm: 120,
                                        }));
                                        setOverrideCurrentTrack(
                                          mapped[startIdx],
                                        );
                                        pendingSeekPosRef.current = null;
                                        setPosition(0);
                                        setDuration(0);
                                        setIsPlaying(true);
                                        loadIframeVideoDirectly(mapped[startIdx]);
                                        if (mapped.length > startIdx + 1) {
                                          const queue = mapped.slice(
                                            startIdx + 1,
                                          );
                                          setTrackQueue(queue);
                                          trackQueueRef.current = queue;
                                        }
                                        showNotification(
                                          `Reproduciendo: ${mapped[startIdx].title}`,
                                        );
                                      }}
                                      selectedCountry={selectedCountry}
                                      setSelectedCountry={(c: string) => {
                                        setSelectedCountry(c);
                                        localStorage.setItem(
                                          "gym_music_selected_country",
                                          c,
                                        );
                                        setExploreData(null);
                                      }}
                                      currentTrack={currentTrack}
                                      isPlaying={isPlaying}
                                    />
                                  </React.Suspense>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {youtubeResults.map((ytTrack, idx) => {
                        if (ytTrack.type === 'ArtistProfile') {
                           return (
                             <div key={ytTrack.id} className="relative group/yt flex items-center gap-3 p-3 rounded-xl bg-white/5 active:bg-white/10 transition-colors border border-white/5 cursor-pointer mb-2" onClick={() => {
                               fetch(`${API_BASE_URL}/api/youtube/artist?id=${ytTrack.id}`).then(r => r.json()).then(data => {
                                 setArtistDetails(data);
                               });
                               setTrackListTab("artist");
                             }}>
                                <img src={ytTrack.thumbnails[0]?.url} className="w-16 h-16 rounded-full object-cover" />
                                <div className="flex-1 min-w-0">
                                  <span className="bg-emerald-500/20 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">ARTISTA</span>
                                  <h4 className="text-[13px] font-bold text-white truncate leading-tight transition-colors uppercase tracking-tight mt-1">{ytTrack.title}</h4>
                                  <p className="text-[10px] text-white/50 truncate uppercase tracking-wider">{ytTrack.subtitle}</p>
                                </div>
                                <button className="w-10 h-10 rounded-full bg-emerald-500 active:bg-emerald-400 flex items-center justify-center shadow-lg transition-transform active:scale-110" onClick={(e) => {
                                  e.stopPropagation();
                                  handleLoadExplorePlaylist({
                                    id: ytTrack.radioId,
                                    title: `Radio de ${ytTrack.title}`,
                                    isPlaylist: true,
                                    subType: "mix"
                                  });
                                }}>
                                  <Play className="w-5 h-5 text-black fill-black ml-1" />
                                </button>
                             </div>
                           );
                        }
                        const isExpanded = expandedPlaylistId === ytTrack.id;

                        const renderBadge = () => {
                          if (ytTrack.isPlaylist) {
                            if (ytTrack.subType === "mix") {
                              return (
                                <span className="bg-purple-500/20 text-purple-400 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase shrink-0 tracking-wider">
                                  MIX PREMIUM
                                </span>
                              );
                            } else {
                              return (
                                <span className="bg-blue-500/20 text-blue-400 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase shrink-0 tracking-wider">
                                  PLAYLIST
                                </span>
                              );
                            }
                          } else {
                            if (ytTrack.subType === "mix") {
                              return (
                                <span className="bg-fuchsia-500/20 text-fuchsia-400 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase shrink-0 tracking-wider">
                                  MIX SESIÓN
                                </span>
                              );
                            } else {
                              return (
                                <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase shrink-0 tracking-wider">
                                  CANCIÓN
                                </span>
                              );
                            }
                          }
                        };

                        return (
                          <div
                            key={`yt-${ytTrack.id}-${idx}`}
                            className="flex flex-col gap-1 p-1.5 bg-white/[0.01] active:bg-white/[0.02] rounded-2xl border border-transparent active:border-white/5 transition-all text-left mb-2 group/yt"
                          >
                            <div className="flex items-center gap-3 p-1 relative">
                              <div
                                className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-black shadow-lg cursor-pointer group/thumb"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (ytTrack.isPlaylist) {
                                    // Trigger the playlist play logic
                                    const playBtn =
                                      e.currentTarget.parentElement?.querySelector(
                                        'button[title="Reproducir Playlist ahora"]',
                                      ) as HTMLButtonElement;
                                    if (playBtn) playBtn.click();
                                  } else {
                                    const trackId = `yt_temp_${ytTrack.id}`;
                                    const isCurrent =
                                      currentTrack &&
                                      (currentTrack.id === trackId ||
                                        currentTrack.url === ytTrack.url);

                                    if (isCurrent) {
                                      setIsPlaying(!isPlaying);
                                      return;
                                    }

                                    const selectedTrackObj = {
                                      id: `yt_temp_${ytTrack.id}`,
                                      title: ytTrack.title,
                                      artist: ytTrack.artist || "Flux",
                                      url: ytTrack.url,
                                      duration: ytTrack.duration || "N/A",
                                      bpm: 120,
                                    };
                                    setOverrideCurrentTrack(selectedTrackObj);
                                    pendingSeekPosRef.current = null;
                                    setPosition(0);
                                    setDuration(0);
                                    setIsPlaying(true);
                                    loadIframeVideoDirectly(selectedTrackObj);
                                    showNotification(`Reproduciendo: ${ytTrack.title}`);

                                    const artistName = ytTrack.artist && ytTrack.artist !== "Flux" ? ytTrack.artist : "";

                                    if (artistName && searchQuery && searchQuery.trim().length > 0) {
                                      // Buscar el repertorio del artista específicamente para no mezclar
                                      Promise.all([
                                        fetch(`${API_BASE_URL}/api/youtube/search?q=${encodeURIComponent(artistName + " exitos")}`).then(r => r.json()).catch(() => []),
                                        fetch(`${API_BASE_URL}/api/youtube/search?q=${encodeURIComponent(artistName + " audio")}`).then(r => r.json()).catch(() => []),
                                        fetch(`${API_BASE_URL}/api/youtube/search?q=${encodeURIComponent(artistName + " album completo")}`).then(r => r.json()).catch(() => [])
                                      ]).then(([exitosData, audioData, albumData]) => {
                                        const combined = [...(Array.isArray(exitosData) ? exitosData : []), ...(Array.isArray(audioData) ? audioData : []), ...(Array.isArray(albumData) ? albumData : [])];
                                        const uniqueMap = new Map();
                                        const targetIdWithPrefix = `yt_temp_${ytTrack.id}`;
                                        
                                        combined.forEach(t => {
                                          if (!t.isPlaylist && t.id !== ytTrack.id && t.id !== targetIdWithPrefix) {
                                            const tArtist = (t.artist || "").toLowerCase();
                                            const tTitle = (t.title || "").toLowerCase();
                                            const aNameLower = artistName.toLowerCase();
                                            // Filtro estricto: el nombre del artista debe estar en el campo de artista o en el título (para fts)
                                            if (tArtist.includes(aNameLower) || tTitle.includes(aNameLower)) {
                                              uniqueMap.set(t.id, t);
                                            }
                                          }
                                        });
                                        
                                        const radioQueue = Array.from(uniqueMap.values()).map((t: any) => ({
                                          ...t,
                                          id: t.id.startsWith('yt_temp_') ? t.id : `yt_temp_${t.id}`
                                        }));
                                        
                                        if (radioQueue.length > 0) {
                                          setTrackQueue(radioQueue);
                                          trackQueueRef.current = radioQueue;
                                          showNotification(`${radioQueue.length} éxitos de ${artistName} añadidos a la cola`);
                                        } else {
                                          // Fallback a los resultados actuales de la búsqueda
                                          const allTracksOnly = youtubeResults
                                            .filter((t) => !t.isPlaylist && t.id !== ytTrack.id)
                                            .map((t) => ({
                                              id: `yt_temp_${t.id}`,
                                              title: t.title,
                                              artist: t.artist || "Flux",
                                              url: t.url,
                                              duration: t.duration || "N/A",
                                              bpm: 120,
                                            }));
                                          setTrackQueue(allTracksOnly);
                                          trackQueueRef.current = allTracksOnly;
                                          showNotification(`${allTracksOnly.length} canciones añadidas a la cola`);
                                        }
                                      }).catch(() => {});
                                    } else {
                                      // Fallback original para otras listas o cuando no hay artista definido
                                      fetch(`${API_BASE_URL}/api/youtube/upnext?id=${ytTrack.id}`)
                                        .then(r => r.json())
                                        .then(data => {
                                          if (data && data.length > 0) {
                                            const targetIdWithPrefix = `yt_temp_${ytTrack.id}`;
                                            const radioQueue = data
                                              .filter((t: any) => t.id !== ytTrack.id && t.id !== targetIdWithPrefix)
                                              .map((t: any) => ({
                                                ...t,
                                                id: t.id.startsWith('yt_temp_') ? t.id : `yt_temp_${t.id}`
                                              }));
                                            setTrackQueue(radioQueue);
                                            trackQueueRef.current = radioQueue;
                                            showNotification(`${radioQueue.length} canciones similares añadidas a la cola`);
                                          } else {
                                            const allTracksOnly = youtubeResults
                                              .filter((t) => !t.isPlaylist)
                                              .map((t) => ({
                                                id: `yt_temp_${t.id}`,
                                                title: t.title,
                                                artist: t.artist || "Flux",
                                                url: t.url,
                                                duration: t.duration || "N/A",
                                                bpm: 120,
                                              }));
                                            const currentIdx = allTracksOnly.findIndex((t) => t.id === trackId);
                                            if (currentIdx !== -1 && allTracksOnly.length > currentIdx + 1) {
                                              const nextInSearch = allTracksOnly.slice(currentIdx + 1);
                                              setTrackQueue(nextInSearch);
                                              trackQueueRef.current = nextInSearch;
                                            }
                                          }
                                        }).catch(() => {});
                                    }

                                  }
                                }}
                              >
                                <img
                                  src={cleanUrl(ytTrack.thumbnail)}
                                  alt=""
                                  className="w-full h-full object-cover group-hover/yt:scale-110 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover/yt:bg-black/60 transition-colors flex items-center justify-center">
                                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center opacity-0 group-hover/yt:opacity-100 transition-all transform scale-75 group-hover/yt:scale-100 shadow-xl">
                                    {currentTrack &&
                                    (currentTrack.id ===
                                      `yt_temp_${ytTrack.id}` ||
                                      currentTrack.url === ytTrack.url) &&
                                    isPlaying ? (
                                      <Pause className="w-2.5 h-2.5 text-black fill-black" />
                                    ) : (
                                      <Play className="w-2.5 h-2.5 text-black fill-black ml-0.5" />
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <span className="flex items-center gap-1.5 mb-1 flex-wrap">
                                  {renderBadge()}
                                </span>
                                <h4 className="text-[11px] font-bold text-white truncate leading-tight transition-colors uppercase tracking-tight">
                                  {ytTrack.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5 font-bold uppercase tracking-widest flex items-center gap-2">
                                  <span>{ytTrack.artist}</span>
                                  {ytTrack.duration && (
                                    <span className="text-white/20">•</span>
                                  )}
                                  {ytTrack.duration && (
                                    <span>{ytTrack.duration}</span>
                                  )}
                                </p>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 pr-1">
                                {ytTrack.isPlaylist ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        handleToggleExpandPlaylist(
                                          ytTrack.id,
                                          ytTrack.title,
                                        )
                                      }
                                      title={
                                        isExpanded
                                          ? "Ocultar canciones"
                                          : "Ver canciones de la playlist"
                                      }
                                      className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider cursor-pointer ${
                                        isExpanded
                                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                          : "bg-white/5 border-transparent text-slate-400 active:text-white active:bg-white/10"
                                      }`}
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      )}
                                      <span className="hidden sm:inline">
                                        Explorar
                                      </span>
                                    </button>

                                    <button
                                      onClick={() =>
                                        addYoutubeTrackToPlaylist(ytTrack)
                                      }
                                      title="Importar / Añadir Playlist Completa a tu Biblioteca"
                                      className="p-1.5 bg-emerald-500/10 text-emerald-500 active:bg-emerald-500 active:text-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                                    >
                                      <ListPlus className="w-4 h-4" />
                                      <span className="hidden sm:inline text-[8.5px] font-black uppercase tracking-wider">
                                        Añadir Todo
                                      </span>
                                    </button>

                                    <button
                                      onClick={async (e) => {
                                        const isSamePlaylist =
                                          playingPlaylist?.id === ytTrack.id;
                                        if (isSamePlaylist) {
                                          setIsPlaying(!isPlaying);
                                          return;
                                        }

                                        showNotification(
                                          "Cargando playlist...",
                                        );
                                        try {
                                          const res = await fetch(
                                            `${API_BASE_URL}/api/youtube/playlist?id=${ytTrack.id}`,
                                          );
                                          if (res.ok) {
                                            const tracks = await res.json();
                                            if (tracks.length > 0) {
                                              const mapped = tracks.map(
                                                (t: any, i: number) => ({
                                                  id: `yt_temp_${t.id}_${i}`,
                                                  title: t.title,
                                                  artist: t.artist,
                                                  url: t.url,
                                                  duration: t.duration,
                                                  bpm: 120,
                                                }),
                                              );
                                              setOverrideCurrentTrack(
                                                mapped[0],
                                              );
                                              pendingSeekPosRef.current = null;
                                              setPosition(0);
                                              setDuration(0);
                                              setIsPlaying(true);
                                              loadIframeVideoDirectly(mapped[0]);
                                              if (mapped.length > 1) {
                                                const rest = mapped.slice(1);
                                                setTrackQueue(rest);
                                                trackQueueRef.current = rest;
                                              }
                                              setPlayingPlaylist({
                                                id: ytTrack.id,
                                                name: ytTrack.title,
                                                tracks: mapped,
                                                ownerId: "youtube",
                                                ownerName: ytTrack.artist,
                                              } as any);
                                              showNotification(
                                                `Reproduciendo: ${ytTrack.title}`,
                                              );
                                            }
                                          }
                                        } catch (err) {
                                          showNotification(
                                            "Error reproduciendo playlist",
                                          );
                                        }
                                      }}
                                      title="Reproducir Playlist ahora"
                                      className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center active:scale-105 transition-all shadow-lg active:scale-95 cursor-pointer ml-1"
                                    >
                                      {playingPlaylist?.id === ytTrack.id &&
                                      isPlaying ? (
                                        <Pause className="w-4 h-4 fill-black" />
                                      ) : (
                                        <Play className="w-4 h-4 fill-black ml-0.5" />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    {/* Spotify Style Add to Queue */}
                                    <button
                                      onClick={(e) => {
                                        const track: MusicTrack = {
                                          id: `yt_temp_${ytTrack.id}_q`,
                                          title: ytTrack.title,
                                          artist: ytTrack.artist,
                                          url: ytTrack.url,
                                          duration: ytTrack.duration,
                                          bpm: 120,
                                        };
                                        handleAddToQueue(track, e);
                                      }}
                                      title="Añadir a la cola"
                                      className="p-2 text-slate-400 active:text-[#1ED760] transition-colors cursor-pointer"
                                    >
                                      <PlusCircle className="w-[18px] h-[18px]" />
                                    </button>

                                    {/* Add to Playlist */}
                                    <button
                                      onClick={() =>
                                        addYoutubeTrackToPlaylist(ytTrack)
                                      }
                                      title="Añadir a Playlist"
                                      className="p-2 text-slate-400 active:text-[#1ED760] transition-colors cursor-pointer"
                                    >
                                      <ListPlus className="w-[18px] h-[18px]" />
                                    </button>

                                    {/* Favorite */}
                                    <button
                                      onClick={(e) => {
                                        const track: MusicTrack = {
                                          id: `yt_temp_${ytTrack.id}_f`,
                                          title: ytTrack.title,
                                          artist: ytTrack.artist,
                                          url: ytTrack.url,
                                          duration: ytTrack.duration,
                                          bpm: 120,
                                        };
                                        handleToggleFavorite(track, e);
                                      }}
                                      title="Me gusta"
                                      className="p-2 text-slate-400 active:text-pink-500 transition-colors cursor-pointer"
                                    >
                                      <Heart
                                        className={`w-[18px] h-[18px] transition-colors ${userPlaylists.find((p) => p.ownerId === user?.uid && (p.name.toLowerCase() === "favoritos" || p.name.toLowerCase() === "siguiente"))?.tracks.some((t) => t.url === ytTrack.url) ? "fill-pink-500 text-pink-500" : ""}`}
                                      />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Expandable playlist track selector */}
                            {isExpanded && (
                              <div className="mt-1 mb-1 mx-1.5 p-2 bg-black/60 border border-white/5 rounded-xl space-y-1.5 transition-all">
                                {isFetchingExpandedTracks ? (
                                  <div className="flex items-center gap-2 p-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest justify-center">
                                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                                    <span>
                                      Analizando pistas de audio premium...
                                    </span>
                                  </div>
                                ) : expandedPlaylistTracks.length === 0 ? (
                                  <div className="text-[9px] text-slate-500 p-3 text-center uppercase font-bold tracking-widest">
                                    No se encontraron pistas o mix de audio en
                                    esta playlist.
                                  </div>
                                ) : (
                                  <div className="space-y-0.5 max-h-[600px] overflow-y-auto premium-scrollbar pr-1">
                                    <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-white/5">
                                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">
                                        Pistas del Canal (
                                        {expandedPlaylistTracks.length})
                                      </p>
                                      <button
                                        onClick={() => {
                                          if (
                                            !selectedPlaylist?.id ||
                                            selectedPlaylist.id === "all"
                                          ) {
                                            showNotification(
                                              "Selecciona una playlist en tu biblioteca primero.",
                                            );
                                            return;
                                          }
                                          const tracksToAdd =
                                            expandedPlaylistTracks.map(
                                              (t, idx) => ({
                                                id: `yt_sub_${t.id}_${Date.now()}_${idx}`,
                                                title: t.title,
                                                artist: t.artist,
                                                url: t.url,
                                                duration: t.duration || "N/A",
                                                bpm: 120,
                                                thumbnail:
                                                  t.thumbnail ||
                                                  `https://i.ytimg.com/vi/${t.id}/mqdefault.jpg`,
                                              }),
                                            );
                                          importAllExpandedTracks(tracksToAdd);
                                        }}
                                        className="text-[8px] font-black uppercase text-emerald-400 active:text-white tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md cursor-pointer"
                                      >
                                        Añadir todas
                                      </button>
                                    </div>
                                    {expandedPlaylistTracks.map(
                                      (subTrack, subIdx) => (
                                        <div
                                          key={`sub-${subTrack.id}-${subIdx}`}
                                          className="flex items-center justify-between gap-3 p-1.5 rounded-lg bg-white/[0.01] active:bg-emerald-500/[0.04] border border-transparent active:border-emerald-500/5 transition-all text-left"
                                        >
                                          <div className="flex-1 min-w-0 pr-1">
                                            <p className="text-[10px] font-bold text-white truncate leading-tight uppercase tracking-tight">
                                              {subIdx + 1}. {subTrack.title}
                                            </p>
                                            <p className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                              {subTrack.artist}{" "}
                                              {subTrack.duration &&
                                                `• ${subTrack.duration}`}
                                            </p>
                                          </div>

                                          <div className="flex items-center gap-1 shrink-0">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const finalTrack: MusicTrack = {
                                                  id: `yt_sub_${subTrack.id}_${Date.now()}_${subIdx}`,
                                                  title: subTrack.title,
                                                  artist: subTrack.artist,
                                                  url: subTrack.url,
                                                  duration:
                                                    subTrack.duration || "N/A",
                                                  bpm: 120,
                                                  thumbnail:
                                                    subTrack.thumbnail ||
                                                    `https://i.ytimg.com/vi/${subTrack.id}/mqdefault.jpg`,
                                                };
                                                addSingleTrackToCurrentPlaylist(
                                                  finalTrack,
                                                );
                                              }}
                                              title="Añadir a playlist activa"
                                              className="p-1 px-2 bg-emerald-500/10 active:bg-emerald-500 text-emerald-500 active:text-black rounded-lg transition-all text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                                            >
                                              <Plus className="w-2.5 h-2.5" />
                                              <span>Añadir</span>
                                            </button>

                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const finalTrack: MusicTrack = {
                                                  id: `yt_sub_temp_${subTrack.id}_${Date.now()}_${subIdx}`,
                                                  title: subTrack.title,
                                                  artist: subTrack.artist,
                                                  url: subTrack.url,
                                                  duration: subTrack.duration,
                                                  bpm: 120,
                                                  thumbnail:
                                                    subTrack.thumbnail ||
                                                    `https://i.ytimg.com/vi/${subTrack.id}/mqdefault.jpg`,
                                                };

                                                if (
                                                  currentTrack &&
                                                  (currentTrack.id ===
                                                    finalTrack.id ||
                                                    currentTrack.url ===
                                                      finalTrack.url)
                                                ) {
                                                  setIsPlaying(!isPlaying);
                                                  return;
                                                }

                                                setOverrideCurrentTrack(
                                                  finalTrack,
                                                );
                                                pendingSeekPosRef.current =
                                                  null;
                                                setPosition(0);
                                                setDuration(0);
                                                setIsPlaying(true);
                                                loadIframeVideoDirectly(finalTrack);
                                                showNotification(
                                                  `Reproduciendo: ${subTrack.title}`,
                                                );
                                              }}
                                              title="Escuchar ahora"
                                              className="p-1 bg-white/5 text-slate-400 active:bg-white/10 active:text-white rounded-lg transition-all cursor-pointer"
                                            >
                                              {currentTrack &&
                                              currentTrack.url ===
                                                subTrack.url &&
                                              isPlaying ? (
                                                <Pause className="w-2.5 h-2.5 fill-current" />
                                              ) : (
                                                <Play className="w-2.5 h-2.5 fill-current" />
                                              )}
                                            </button>

                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const finalTrack: MusicTrack = {
                                                  id: `yt_sub_temp_${subTrack.id}_${Date.now()}`,
                                                  title: subTrack.title,
                                                  artist: subTrack.artist,
                                                  url: subTrack.url,
                                                  duration: subTrack.duration,
                                                  bpm: 120,
                                                  thumbnail:
                                                    subTrack.thumbnail ||
                                                    `https://i.ytimg.com/vi/${subTrack.id}/mqdefault.jpg`,
                                                };
                                                handleToggleFavorite(
                                                  finalTrack,
                                                  e,
                                                );
                                              }}
                                              title="Añadir a Favoritos"
                                              className="p-1 bg-white/5 text-slate-400 active:bg-pink-500/10 active:text-pink-500 rounded-lg transition-all cursor-pointer"
                                            >
                                              <Heart
                                                className={`w-2.5 h-2.5 transition-colors ${userPlaylists.find((p) => p.ownerId === user?.uid && (p.name.toLowerCase() === "favoritos" || p.name.toLowerCase() === "siguiente"))?.tracks.some((t) => t.url === subTrack.url) ? "fill-pink-500 text-pink-500" : ""}`}
                                              />
                                            </button>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div className="pt-4 border-t border-white/5 mt-4" />
                    </div>
                  ) : trackListTab === "artist" ? (
                    <div className="space-y-4 px-1 pb-20">
                      {artistDetails ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setTrackListTab("search")} className="p-2 bg-white/5 rounded-full active:bg-white/10 transition-colors">
                              <ChevronRight className="w-5 h-5 text-white transform rotate-180" />
                            </button>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">{artistDetails.header}</h2>
                          </div>
                          {artistDetails.sections.map((section: any, sIdx: number) => (
                            <div key={sIdx} className="mb-6">
                              <h3 className="text-[14px] font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                {section.title}
                              </h3>
                              <div className="flex overflow-x-auto pb-4 gap-3 snap-x scrollbar-hide">
                                {section.items.map((item: any, iIdx: number) => (
                                  <div key={iIdx} className="shrink-0 w-[140px] snap-start group/item cursor-pointer" onClick={() => {
                                      if (item.isPlaylist) {
                                        handleLoadExplorePlaylist(item);
                                      } else {
                                        const tempTrack = {
                                          id: 'yt_temp_' + item.id,
                                          title: item.title,
                                          artist: item.artist || artistDetails.header,
                                          duration: item.duration || "",
                                          url: item.url,
                                          bpm: 120
                                        };
                                        setOverrideCurrentTrack(tempTrack);
                                        pendingSeekPosRef.current = null;
                                        setPosition(0);
                                        setDuration(0);
                                        setIsPlaying(true);
                                        loadIframeVideoDirectly(tempTrack);
                                        showNotification(`Reproduciendo: ${item.title}`);

                                        fetch(`${API_BASE_URL}/api/youtube/upnext?id=${item.id}`)
                                          .then(r => r.json())
                                          .then(data => {
                                            if (data && data.length > 0) {
                                              const targetIdWithPrefix = `yt_temp_${item.id}`;
                                              const radioQueue = data
                                                .filter((t: any) => t.id !== item.id && t.id !== targetIdWithPrefix)
                                                .map((t: any) => ({
                                                  ...t,
                                                  id: t.id.startsWith('yt_temp_') ? t.id : `yt_temp_${t.id}`
                                                }));
                                              setTrackQueue(radioQueue);
                                              trackQueueRef.current = radioQueue;
                                              showNotification(`${radioQueue.length} canciones relacionadas añadidas a la cola`);
                                            }
                                          }).catch(() => {});
                                      }
                                  }}>
                                    <div className="relative aspect-square rounded-xl overflow-hidden mb-2 shadow-lg group-hover/item:shadow-emerald-500/20 transition-all duration-300">
                                      <img src={item.thumbnail} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                      <div className="absolute inset-0 bg-black/20 group-hover/item:bg-black/40 transition-colors flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all transform scale-75 group-hover/item:scale-100 shadow-xl">
                                          <Play className="w-5 h-5 text-black fill-black ml-1" />
                                        </div>
                                      </div>
                                    </div>
                                    <h4 className="text-[11px] font-bold text-white line-clamp-2 leading-tight uppercase">{item.title}</h4>
                                    <p className="text-[9px] text-white/50 truncate uppercase tracking-widest mt-1">{item.subType}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-white/50">
                          <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                          <p className="text-[10px] uppercase tracking-widest">Cargando artista...</p>
                        </div>
                      )}
                    </div>
                  ) : trackListTab === "queue" ? (
                    (() => {
                      const lowerQuery = searchQuery.toLowerCase().trim();
                      const filteredQueue = lowerQuery
                        ? trackQueue.filter(
                            (track) =>
                              track.title?.toLowerCase().includes(lowerQuery) ||
                              track.artist?.toLowerCase().includes(lowerQuery),
                          )
                        : trackQueue;

                      if (filteredQueue.length === 0) {
                        return (
                          <div className="p-12 text-center text-slate-400 text-xs font-medium space-y-3">
                            <ListMusic
                              className={`w-8 h-8 text-slate-600 mx-auto ${isEcoMode ? "" : "animate-pulse"}`}
                            />
                            <p>
                              {searchQuery
                                ? "No se encontraron coincidencias en la cola."
                                : "No hay canciones en la cola de reproducción."}
                            </p>
                            {!searchQuery && (
                              <p className="text-[10px] text-slate-500">
                                Añade canciones a la cola usando el botón{" "}
                                <span className="inline-flex items-center text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">
                                  <ListPlus className="w-3.5 h-3.5" />
                                </span>{" "}
                                en las pistas.
                              </p>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-1 w-full">
                          {filteredQueue.map((track, idx) => {
                            return (
                              <div
                                key={`queue_${track.id || idx}_${idx}`}
                                onClick={() => {
                                  if (currentTrack?.id === track.id) {
                                    setIsPlaying(!isPlaying);
                                    return;
                                  }
                                  expectedPlayingRef.current = true;
                                  setOverrideCurrentTrack(track);
                                  pendingSeekPosRef.current = null;
                                  setPosition(0);
                                  setDuration(0);
                                  setIsPlaying(true);
                                  loadIframeVideoDirectly(track);
                                  setTrackQueue((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  );
                                  showNotification(
                                    `Reproduciendo: ${track.title}`,
                                  );
                                }}
                                role="button"
                                className="group/track w-full flex items-center gap-2 sm:gap-3 px-2 py-1 sm:px-3 sm:py-1 transition-all text-left relative overflow-hidden rounded-lg cursor-pointer bg-transparent active:bg-white/[0.04]"
                              >
                                <div className="hidden sm:flex items-center justify-center w-6 shrink-0 relative z-10">
                                  <span className="text-[11px] font-medium text-slate-500 group-hover/track:text-emerald-400 transition-colors">
                                    {idx + 1}
                                  </span>
                                </div>

                                <div className="relative w-8 h-8 sm:w-9 sm:h-9 bg-white/5 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center shadow-lg group/thumb">
                                  {getTrackImage(track) ? (
                                    <img
                                      src={getTrackImage(track)!}
                                      alt=""
                                      className="w-full h-full object-cover group-hover/track:scale-110 transition-transform duration-500"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
                                  )}
                                  <div className="absolute inset-0 bg-black/20 group-hover/track:bg-black/40 transition-colors flex items-center justify-center">
                                    <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center opacity-0 group-hover/track:opacity-100 transition-all transform scale-75 group-hover/track:scale-100 shadow-xl">
                                      {currentTrack?.id === track.id &&
                                      isPlaying ? (
                                        <Pause className="w-2 h-2 text-black fill-black" />
                                      ) : (
                                        <Play className="w-2 h-2 text-black fill-black ml-0.5" />
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0 pr-3 relative z-10 flex flex-col justify-center">
                                  <p className="text-[11px] sm:text-xs font-semibold truncate leading-tight text-white group-hover/track:text-emerald-400 transition-colors uppercase tracking-wide">
                                    {track.title}
                                  </p>
                                  <p className="text-[9.5px] sm:text-[10px] font-normal truncate mt-0.5 text-slate-400 group-hover/track:text-white transition-colors">
                                    {track.artist ||
                                      track.author ||
                                      "Unknown Artist"}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 relative z-20">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setTrackQueue((prev) =>
                                        prev.filter((_, i) => i !== idx),
                                      );
                                      showNotification(
                                        `Quitada de la cola: ${track.title}`,
                                      );
                                    }}
                                    className="p-1.5 text-slate-400 active:text-red-400 rounded-md active:bg-red-500/10 cursor-pointer"
                                    title="Quitar de la cola"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : filteredDisplayTracks.length === 0 ? (
                    <div className="p-8 text-center text-white/30 text-xs font-medium">
                      No se encontraron resultados para "{searchQuery}"
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 w-full">
                      {filteredDisplayTracks.map(({ track, idx }) => {
                        const isActive =
                          playingPlaylist?.id === selectedPlaylist?.id &&
                          displayTrackIndex === idx;
                        const isReorderable =
                          !searchQuery.trim() &&
                          selectedPlaylist?.id &&
                          selectedPlaylist.id !== "all" &&
                          (isAdmin ||
                            savedSecurityCode === "ho82788278" ||
                            (user && selectedPlaylist.ownerId === user?.uid));
                        const isBeingDragged = draggedTrackIdx === idx;
                        const isBeingDraggedOver = dragOverTrackIdx === idx;

                        return (
                          <div
                            key={`list_trk_${track.id || "x"}_${idx}`}
                            onTouchStart={(e) => {
                              const touch = e.touches[0];
                              (e.currentTarget as any)._startX = touch.clientX;
                              (e.currentTarget as any)._startY = touch.clientY;
                            }}
                            onTouchEnd={(e) => {
                              const startX = (e.currentTarget as any)._startX;
                              const startY = (e.currentTarget as any)._startY;
                              if (
                                startX != null &&
                                startY != null &&
                                e.changedTouches &&
                                e.changedTouches.length > 0
                              ) {
                                const touch = e.changedTouches[0];
                                const diffX = touch.clientX - startX;
                                const diffY = Math.abs(touch.clientY - startY);
                                if (diffX < -50 && diffY < 40) {
                                  // Swipe left
                                  if (
                                    selectedPlaylist?.id &&
                                    selectedPlaylist.id !== "all" &&
                                    (isAdmin ||
                                      savedSecurityCode === "ho82788278" ||
                                      (user &&
                                        selectedPlaylist.ownerId === user?.uid))
                                  ) {
                                    setTrackToDeleteConfirm(track);
                                  }
                                }
                              }
                            }}
                            onClick={() => {
                              setOverrideCurrentTrack(null);
                              setTrackQueue([]);
                              trackQueueRef.current = [];
                              if (isActive) {
                                expectedPlayingRef.current = !isPlaying;
                                setIsPlaying(!isPlaying);
                              } else {
                                expectedPlayingRef.current = true;
                                setPlayingPlaylist(selectedPlaylist);
                                setCurrentTrackIndex(idx);
                                pendingSeekPosRef.current = null;
                                setPosition(0);
                                setDuration(0);
                                setIsPlaying(true);
                                if (selectedPlaylist && selectedPlaylist.tracks && selectedPlaylist.tracks[idx]) {
                                  loadIframeVideoDirectly(selectedPlaylist.tracks[idx]);
                                }
                              }
                            }}
                            draggable={Boolean(isReorderable)}
                            onDragStart={(e) => {
                              if (isReorderable) {
                                setDraggedTrackIdx(idx);
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData(
                                  "text/plain",
                                  idx.toString(),
                                );
                              }
                            }}
                            onDragOver={(e) => {
                              if (isReorderable) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "move";
                              }
                            }}
                            onDragEnter={(e) => {
                              if (isReorderable) {
                                e.preventDefault();
                                setDragOverTrackIdx(idx);
                              }
                            }}
                            onDragLeave={() => {
                              if (isReorderable && dragOverTrackIdx === idx) {
                                setDragOverTrackIdx(null);
                              }
                            }}
                            onDrop={(e) => {
                              if (isReorderable) {
                                handleDropTrack(idx, e);
                              }
                            }}
                            onDragEnd={() => {
                              setDraggedTrackIdx(null);
                              setDragOverTrackIdx(null);
                            }}
                            role="button"
                            className={`group/track w-full flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-0 transition-all text-left relative overflow-hidden rounded-lg cursor-pointer ${
                              isActive
                                ? "bg-white/[0.08] shadow-[inset_0_0_12px_rgba(255,255,255,0.02)] border-l-2 border-emerald-500"
                                : "bg-transparent active:bg-white/[0.04]"
                            } ${isBeingDragged ? "opacity-50" : ""} ${isBeingDraggedOver ? (draggedTrackIdx !== null && draggedTrackIdx > idx ? "border-t-2 border-t-emerald-500" : "border-b-2 border-b-emerald-500") : ""}`}
                          >
                            {/* Track Number & Hover/Active States (Spotify Style) */}
                            <div className="hidden sm:flex items-center justify-center w-5 sm:w-6 shrink-0 relative z-10">
                              {/* Default Track Number */}
                              <span
                                className={`text-[11px] font-medium transition-opacity duration-200 ${
                                  isActive
                                    ? "opacity-0 text-emerald-400"
                                    : "opacity-100 group-hover/track:opacity-0 text-slate-400"
                                }`}
                              >
                                {idx + 1}
                              </span>

                              {/* Play/Pause/EQ Icon overlay */}
                              <div
                                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                                  isActive
                                    ? "opacity-100"
                                    : "opacity-0 group-hover/track:opacity-100"
                                }`}
                              >
                                {isActive && isPlaying ? (
                                  <div className="flex gap-[2px] items-end h-[11px] shrink-0">
                                    {[...Array(3)].map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-[2px] bg-emerald-400 rounded-full ${!isEcoMode ? `animate-eq-bar-${i}` : ""} will-change-transform`}
                                        style={{
                                          height: "11px",
                                          transformOrigin: "bottom",
                                        }}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <Play
                                    className={`w-3.5 h-3.5 fill-current ${isActive ? "text-emerald-400" : "text-white"}`}
                                  />
                                )}
                              </div>
                            </div>

                            {/* Thumbnail */}
                            <div className="relative w-10 h-10 sm:w-9 sm:h-9 bg-white/5 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center shadow-lg group/thumb">
                              {getTrackImage(track) ? (
                                <img
                                  src={getTrackImage(track)!}
                                  alt=""
                                  className="w-full h-full object-cover group-hover/track:scale-110 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
                              )}

                              {/* Mobile Play Overlay (optional, kept from original design if active) */}
                              <div
                                className={`sm:hidden absolute inset-0 bg-black/40 flex items-center justify-center transition-all duration-300 ${isActive ? "opacity-100" : "opacity-0 group-hover/track:opacity-100"}`}
                              >
                                {isActive && isPlaying ? (
                                  <div className="flex gap-[1.5px] items-end h-[9px] shrink-0">
                                    {[...Array(3)].map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-[1.5px] bg-emerald-400 rounded-full ${!isEcoMode ? `animate-eq-bar-${i}` : ""} will-change-transform`}
                                        style={{
                                          height: "9px",
                                          transformOrigin: "bottom",
                                        }}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <Play className="w-3.5 h-3.5 ml-0.5 fill-white" />
                                )}
                              </div>
                            </div>

                            {/* Track Info */}
                            <div className="flex-1 min-w-0 pr-1.5 sm:pr-3 relative z-10 flex flex-col justify-center gap-0">
                              <p
                                className={`text-[11px] font-semibold truncate leading-none transition-colors duration-200 uppercase tracking-wide ${
                                  isActive
                                    ? "text-emerald-400 font-extrabold"
                                    : "text-white"
                                }`}
                              >
                                {track.title}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                <p
                                  className={`text-[9px] sm:text-[9.5px] font-normal truncate leading-none transition-colors duration-200 mt-[0.5px] ${
                                    isActive
                                      ? "text-emerald-500/80 font-bold"
                                      : "text-slate-400 group-hover/track:text-white"
                                  }`}
                                >
                                  {track.artist ||
                                    track.author ||
                                    "Unknown Artist"}
                                </p>
                                {track.description && (
                                  <>
                                    <span className="text-[9px] text-zinc-600 shrink-0">
                                      •
                                    </span>
                                    <p
                                      className="text-[9.5px] sm:text-[10px] text-emerald-400/60 font-medium truncate italic shrink-1"
                                      title={track.description}
                                    >
                                      {track.description}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Actions (Queue / Edit / Delete) */}
                            <div className="flex items-center gap-1.5 relative z-20 mr-1.5 shrink-0">
                              <button
                                onClick={(e) => handleToggleFavorite(track, e)}
                                className="p-1.5 sm:p-1 text-slate-400 active:text-pink-500 rounded-md active:bg-pink-500/10 cursor-pointer"
                                title="Añadir a Favoritos"
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 transition-colors ${userPlaylists.find((p) => p.ownerId === user?.uid && (p.name.toLowerCase() === "favoritos" || p.name.toLowerCase() === "siguiente"))?.tracks.some((t) => (track.id && t.id === track.id) || (track.url && t.url === track.url)) ? "fill-pink-500 text-pink-500" : ""}`}
                                />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addSingleTrackToCurrentPlaylist(track);
                                }}
                                className="p-1.5 sm:p-1 text-slate-400 active:text-[#1ED760] rounded-md active:bg-[#1ED760]/10 cursor-pointer"
                                title="Añadir a mi Playlist"
                              >
                                <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>

                              <button
                                onClick={(e) => handleAddToQueue(track, e)}
                                className="p-1.5 sm:p-1 text-slate-400 active:text-blue-400 rounded-md active:bg-emerald-500/10 cursor-pointer"
                                title="Añadir a la cola"
                              >
                                <ListPlus className="w-3.5 h-3.5" />
                              </button>
                              {selectedPlaylist?.id &&
                                selectedPlaylist.id !== "all" &&
                                (isAdmin ||
                                  savedSecurityCode === "ho82788278" ||
                                  (user &&
                                    selectedPlaylist.ownerId ===
                                      user?.uid)) && (
                                  <>
                                    <button
                                      onClick={(e) =>
                                        handleDeleteTrack(track, e)
                                      }
                                      className="p-1.5 sm:p-1 text-slate-400 active:text-red-400 rounded-md active:bg-red-500/10 cursor-pointer"
                                      title="Eliminar de la playlist"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                            </div>

                            {/* Duration / Options */}
                            <div className="hidden sm:flex items-center gap-2 shrink-0 relative z-10 text-[10.5px] font-medium text-slate-400">
                              {track.duration && (
                                <span className="w-9 text-right group-hover/track:text-white transition-colors">
                                  {track.duration}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {trackListTab !== "entertainment" && trackListTab !== "radio-fai" && trackListTab !== "karaoke" && (
                  <div className="bg-[#050505] border-t border-white/5 flex flex-col shrink-0">
                    <div className="px-3 py-1.5 flex justify-between items-center text-[7.5px] font-black uppercase text-slate-500 tracking-widest">
                      <span>Total: {viewedTracks.length || 0} canciones</span>
                      <span className="text-emerald-500/80">Flux Premium</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-transparent">
              <div className="w-24 h-24 border border-dashed border-white/10 rounded-full flex items-center justify-center mb-6">
                <Music className="w-9 h-9 text-white/5 animate-pulse" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-4">
                Listo para Escuchar
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setSelectedPlaylist(null);
    setTrackListTab("search");
                    setIsTrackListExpanded(true);
                    setMobileView("player");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="px-5 py-2.5 bg-emerald-500 text-black font-black uppercase text-[10px] rounded-lg active:scale-105 transition-all shadow-xl flex items-center gap-2"
                >
                  Explorar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unified Spotify-Style Mobile Mini-Player (Floats above bottom-nav when track list is expanded/player minimized) */}
      {currentTrack &&
        isTrackListExpanded &&
        trackListTab !== "entertainment" &&
        trackListTab !== "radio-fai" &&
        trackListTab !== "karaoke" && (
          <div className="md:hidden fixed bottom-[65px] left-1.5 right-1.5 z-[55]">
            <div
              onClick={() => {
                setMobileView("player");
                setIsTrackListExpanded(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#0e0e11]/98 backdrop-blur-md border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.8)] active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden"
            >
              {/* Progress Bar background */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.05]">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{
                    width: `${duration > 0 ? (position / duration) * 100 : 0}%`,
                  }}
                />
              </div>

              {/* Artwork */}
              <div className="relative w-10 h-10 shrink-0 rounded-md overflow-hidden bg-[#1a1a20]">
                <img
                  src={displayArtwork}
                  className="w-full h-full object-cover"
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>

              {/* Metadata info */}
              <div className="flex flex-col min-w-0 flex-1 text-left pb-0.5">
                <h4 className="text-[12.5px] font-bold text-white truncate tracking-tight">
                  {displayTitle}
                </h4>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5 tracking-wide truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 inline-block"></span>
                  {displayArtist}
                </p>
              </div>

              {/* Actions: Heart & Play/Pause */}
              <div
                className="flex items-center gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => handleToggleFavorite(currentTrack, e)}
                  className="p-2 text-slate-300 active:text-white transition-colors"
                  title="Añadir a Favoritos"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      userPlaylists
                        .find(
                          (p) =>
                            p.ownerId === user?.uid &&
                            (p.name.toLowerCase() === "favoritos" ||
                              p.name.toLowerCase() === "siguiente"),
                        )
                        ?.tracks.some(
                          (t) =>
                            (currentTrack.id && t.id === currentTrack.id) ||
                            (currentTrack.url && t.url === currentTrack.url),
                        )
                        ? "fill-[#1ED760] text-[#1ED760]"
                        : ""
                    }`}
                  />
                </button>

                <button
                  onClick={togglePlayback}
                  className="p-2 text-white active:scale-90 transition-transform cursor-pointer"
                  title="Reproducir/Pausar"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex h-[62px] bg-[#0c0c0d]/95 border-t border-white/5 shrink-0 justify-around items-center px-2 pb-1.5 pt-1.5 gap-1.5 z-[60] shadow-[0_-4px_16px_rgba(0,0,0,0.5)]">
        
        {/* Explorar */}
        {(() => {
          const isExploreActive = mobileView === "player" && trackListTab === "search" && !selectedPlaylist && !showLibrary;
          return (
            <button
              onClick={() => {
                setSelectedPlaylist(null);
                setTrackListTab("search");
                setIsTrackListExpanded(true);
                setMobileView("player");
                setShowLibrary(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl text-center transition-all active:scale-95 cursor-pointer ${
                isExploreActive
                  ? "bg-white/10 backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                  : "bg-transparent active:bg-white/5"
              }`}
            >
              <div className="relative">
                <Compass className={`w-4 h-4 transition-transform ${isExploreActive ? "scale-110" : ""} text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]`} />
                {hasNewExplore && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-[#0c0c0d] shadow-[0_0_5px_rgba(239,68,68,0.8)]" />}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest mt-0.5 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Explorar
              </span>
            </button>
          );
        })()}

        {/* FLUX */}
        {(() => {
          const isFluxActive = trackListTab === "radio-fai" && !showLibrary && mobileView === "player";
          return (
            <button
              onClick={() => {
                setSearchQuery("");
                setYoutubeResults([]);
                setPreviewPlaylist(null);
                setTrackListTab("radio-fai");
                setIsTrackListExpanded(true);
                setShowLibrary(false);
                setMobileView("player");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl text-center transition-all active:scale-95 cursor-pointer ${
                isFluxActive
                  ? "bg-white/10 backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                  : "bg-transparent active:bg-white/5"
              }`}
            >
              <div className="relative">
                <Radio className={`w-4 h-4 transition-transform ${isFluxActive ? "scale-110" : ""} text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]`} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest mt-0.5 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                FLUX
              </span>
            </button>
          );
        })()}

        {/* Mi Biblioteca */}
        {(() => {
          const isLibraryActive = mobileView === "playlists" && !showLibrary;
          return (
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setShowLibrary(false);
                if (mobileView === "playlists") {
                  setMobileView("player");
                } else {
                  setMobileView("playlists");
                  setIsTrackListExpanded(true);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl text-center transition-all active:scale-95 cursor-pointer ${
                isLibraryActive
                  ? "bg-white/10 backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                  : "bg-transparent active:bg-white/5"
              }`}
            >
              <Library className={`w-4 h-4 transition-transform ${isLibraryActive ? "scale-110" : ""} text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]`} />
              <span className="text-[8px] font-black uppercase tracking-widest mt-0.5 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Biblioteca
              </span>
            </button>
          );
        })()}

        {/* Reproductor / Activo */}
        {(() => {
          const isActiveTrackActive = mobileView === "player" && (currentTrack || isPlaying || overrideCurrentTrack) && !isTrackListExpanded && !showLibrary;
          return (
            <button
              onClick={() => {
                setShowLibrary(false);
                setMobileView("player");
                if (currentTrack || isPlaying || overrideCurrentTrack) {
                  setIsTrackListExpanded(false);
                }
              }}
              className={`relative group flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl text-center transition-all active:scale-95 cursor-pointer ${
                isActiveTrackActive
                  ? "bg-white/10 backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                  : "bg-transparent active:bg-white/5"
              }`}
            >
              {isPlaying && (mobileView !== "player" || isTrackListExpanded || showLibrary) && (
                <div className="absolute top-1 right-2 w-2 h-2 bg-emerald-500 rounded-full border border-[#0c0c0d]" />
              )}
              <Music className={`w-4 h-4 transition-transform relative z-10 ${isActiveTrackActive ? "scale-110" : ""} text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]`} />
              <span className="text-[8px] font-black uppercase tracking-widest mt-0.5 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Activo
              </span>
            </button>
          );
        })()}
      </div>

      {showNicknameModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 ">
          <div className="w-full max-w-sm bg-[#0d0d0f] border border-emerald-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(30,215,96,0.15)] text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-emerald-500 via-[#1ED760] to-teal-500" />
            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">
              Configura tu Nickname
            </h3>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-6">
              Para interactuar en Novedades y que tu email no sea público, elige
              un nombre de usuario.
            </p>
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              placeholder="Ej: DJ FLUX"
              className="w-full text-center py-3 bg-[#121214] border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 mb-4"
              autoFocus
            />
            <button
              onClick={handleSaveNickname}
              disabled={!nicknameInput.trim()}
              className="w-full py-3 bg-emerald-500 font-black uppercase text-[11px] tracking-wider text-black rounded-xl active:bg-emerald-400 disabled:opacity-50 transition-colors"
            >
              Guardar y Continuar
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY: LIBRARY MODAL */}
      <AnimatePresence>
        {showLibrary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute top-[49px] bottom-0 right-0 left-0 md:left-0 bg-[#070708] z-[40] flex items-start justify-center p-0 md:p-0 overflow-hidden shadow-2xl`}
          >
            <div className="w-full h-full flex flex-col bg-[#070708] overflow-hidden relative">
              {/* Starry Background for Library */}
              <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-emerald-500/[0.04] to-transparent pointer-events-none" />

              <div className="flex justify-between items-center px-4 py-4 sm:px-8 relative z-10 shrink-0 border-b border-white/5">
                <div>
                  <h3 className="text-sm sm:text-lg font-black uppercase tracking-[0.4em] text-emerald-400 mb-1 flex items-center gap-2">
                    Novedades
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full border border-emerald-500/30">Comunidad</span>
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium max-w-md leading-relaxed mt-1">
                    Explora y guarda playlists creadas por otros usuarios en la comunidad. <strong className="text-emerald-400">Descubre nueva música para tus rutinas.</strong>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowLibrary(false)}
                    className="p-2 sm:p-3 bg-white/5 active:bg-white/10 rounded-full transition-all border border-white/10 text-slate-400 active:text-white"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col md:flex-row min-h-0 min-w-0 relative z-10 overflow-hidden">
                {/* 1) Playlist Sidebar/Selector or Grid Column */}
                <div
                  className={`${previewPlaylist ? "hidden md:flex md:w-[320px] bg-black/45 border-r border-white/5" : "flex-1 min-h-0"} flex flex-col overflow-y-auto px-4 pb-24 sm:px-8 scrollbar-none relative z-10 touch-pan-y`}
                >
                  {previewPlaylist && (
                    <div className="pt-2 pb-4 shrink-0">
                      <button
                        onClick={() => setPreviewPlaylist(null)}
                        className="flex items-center gap-2 py-2 px-3.5 rounded-full bg-white/5 border border-white/5 text-[#1ED760] font-black active:bg-white/10 active:scale-95 transition-all text-[9.5px] uppercase tracking-wider cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 stroke-[3px]" />
                        <span>Ver todas las playlist</span>
                      </button>
                    </div>
                  )}

                  <div
                    className={`grid ${previewPlaylist ? "grid-cols-1 gap-2.5" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"} w-full justify-center`}
                  >
                    {communityPlaylists.map((pl, idx) => {
                      const isPreviewing = previewPlaylist?.id === pl.id;
                      return (
                        <motion.div
                          key={pl.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="relative group flex flex-col"
                        >
                          <div
                            onClick={() => setPreviewPlaylist(pl)}
                            className={`w-full flex ${previewPlaylist ? "flex-row items-center gap-2.5 p-2 rounded-xl" : "flex-col gap-2 p-3 rounded-2xl aspect-[4/5]"} border transition-all duration-300 text-left relative cursor-pointer ${
                              isPreviewing
                                ? "bg-emerald-500/10 border-emerald-500/35 shadow-inner scale-[0.98]"
                                : pl.isAdminContent
                                  ? "bg-emerald-500/[0.04] border-emerald-500/20 shadow-[0_4px_20px_rgba(16,185,129,0.05)] active:bg-emerald-500/[0.08] active:border-[#1ED760]/55 active:shadow-[0_12px_32px_rgba(30,215,96,0.18)] active:-translate-y-1"
                                  : "bg-white/[0.03] border-white/5 active:border-[#1ED760]/40 active:bg-white/[0.07] active:shadow-[0_12px_32px_rgba(0,0,0,0.5)] active:-translate-y-1"
                            }`}
                          >
                            <div
                              className={`${previewPlaylist ? "w-10 h-10 rounded-lg" : "w-full aspect-square rounded-xl"} bg-gradient-to-tr ${getPlaylistGradientClass(pl.name)} flex items-center justify-center text-md sm:text-l shadow-lg relative overflow-hidden shrink-0 transition-transform duration-500`}
                            >
                              <>
                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                                <span className="relative z-10 shrink-0 select-none filter drop-shadow flex items-center justify-center">
                                  {pl.icon &&
                                  pl.icon !== "📂" &&
                                  pl.icon !== "📁" &&
                                  pl.icon !== "🎵" ? (
                                    pl.icon
                                  ) : (
                                    <Headphones
                                      className={`${previewPlaylist ? "w-4 h-4" : "w-8 h-8"} text-white/90`}
                                    />
                                  )}
                                </span>
                                {getPlaylistImage(pl) && (
                                  <img
                                    src={getPlaylistImage(pl)!}
                                    alt={pl.name}
                                    className="absolute inset-0 w-full h-full object-cover z-20 bg-[#0d0d0f] transition-transform duration-500 ease-out group-active:scale-110"
                                    
                                    referrerPolicy="no-referrer"
                                    onError={(e) => handlePlaylistImageError(e, pl)}
                                  />
                                )}
                              </>

                              {!previewPlaylist && (
                                <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1 z-30">
                                  {(() => {
                                    let isNew = false;
                                    if (pl.createdAt) {
                                      const ms = pl.createdAt.toMillis?.() || (pl.createdAt.seconds ? pl.createdAt.seconds * 1000 : 0) || new Date(pl.createdAt).getTime() || 0;
                                      isNew = (Date.now() - ms) < 24 * 60 * 60 * 1000;
                                    }
                                    return isNew ? (
                                      <div className="px-2.5 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center gap-1.5 animate-pulse mb-0.5">
                                        <Sparkles className="w-2.5 h-2.5" />
                                        Novedad
                                      </div>
                                    ) : null;
                                  })()}
                                  <div
                                    className={`px-2.5 py-1 ${pl.isAdminContent ? "bg-[#1ED760] text-black ring-2 ring-[#1ED760]/20 shadow-[0_0_15px_rgba(30,215,96,0.4)]" : "bg-emerald-500 text-black"} text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg flex items-center gap-1.5`}
                                  >
                                    {pl.isAdminContent && (
                                      <BadgeCheck className="w-2.5 h-2.5 fill-black" />
                                    )}
                                    {pl.isAdminContent
                                      ? "VERIFICADA"
                                      : "Comunidad"}
                                  </div>
                                  <div className="px-2 py-0.5 bg-black/85 rounded-md text-[9px] sm:text-[10.5px] font-extrabold text-white uppercase tracking-widest border border-white/10 shadow-md">
                                    {pl.tracks.length} P •{" "}
                                    {calculatePlaylistDuration(pl.tracks)}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <p
                                className={`text-xs ${previewPlaylist ? "sm:text-xs font-bold" : "sm:text-[14px] font-bold"} truncate text-white leading-tight transition-colors duration-300 group-active:text-[#1ED760]`}
                              >
                                {pl.name}
                              </p>
                              {!previewPlaylist && (
                                <p
                                  className="text-[10.5px] sm:text-[12px] text-slate-400 font-medium truncate mt-1 normal-case tracking-wide opacity-100 placeholder-opacity-50"
                                  title={pl.description || "Sin descripción"}
                                >
                                  {pl.description ||
                                    "Canal personalizado de música"}
                                </p>
                              )}
                              {pl.ownerName && (
                                <p className="text-[9.5px] text-slate-400 font-semibold tracking-wide mt-1 line-clamp-2 leading-tight">
                                  <span className="hidden sm:inline">Publicada por: </span><span className="sm:hidden">Por: </span>
                                  <span
                                    className={
                                      pl.isAdminContent
                                        ? "text-[#1ED760] font-black inline-flex items-center gap-1"
                                        : "text-[#1ED760] font-bold inline-flex items-center gap-1"
                                    }
                                  >
                                    {pl.isAdminContent
                                      ? "#fluxmusicoficial"
                                      : (pl.ownerName || "")
                                            .toLowerCase()
                                            .includes("flux") ||
                                          (pl.ownerName || "")
                                            .toLowerCase()
                                            .includes("oficial") ||
                                          (pl.ownerName || "").toLowerCase() ===
                                            "administrador"
                                        ? "Socio Premium"
                                        : sanitizeOwnerName(pl.ownerName)}
                                    {pl.isAdminContent && (
                                      <BadgeCheck className="w-2.5 h-2.5 fill-current" />
                                    )}
                                  </span>
                                </p>
                              )}
                              {!previewPlaylist && (
                                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1.5 pt-1.5 border-t border-white/[0.04] overflow-hidden">
                                  <span className="text-[7.5px] bg-[#1ED760]/10 text-[#1ED760] font-black px-1.5 py-0.5 rounded uppercase tracking-wider border border-[#1ED760]/10 shrink-0 select-none">
                                    {getPlaylistGenre(pl)}
                                  </span>
                                  <span
                                    className="text-[8.5px] text-amber-400 font-extrabold flex items-center gap-0.5 shrink-0"
                                    title="Valoración / Popularidad"
                                  >
                                    ★ {getPlaylistPopularity(pl).rating}
                                  </span>
                                </div>
                              )}
                              {previewPlaylist && (
                                <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                                  {pl.tracks.length}{" "}
                                  {pl.tracks.length === 1 ? "Pista" : "Pistas"}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-[50] opacity-100 sm:opacity-0 sm:group-active:opacity-100 transition-all">
                            {(() => {
                              const alreadySaved = userPlaylists.some(
                                (p) =>
                                  p.ownerId === user?.uid && p.name === pl.name,
                              );
                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!alreadySaved)
                                      saveCommunityPlaylistToLibrary(pl);
                                  }}
                                  className={`w-9 h-9 flex items-center justify-center bg-black/95  rounded-lg border shadow-2xl transition-all ${alreadySaved ? "text-[#1ED760] border-[#1ED760]/30 cursor-default" : "text-slate-400 active:text-[#1ED760] border-white/10 active:border-[#1ED760]/30 cursor-pointer active:scale-110 active:scale-95"}`}
                                  title={
                                    alreadySaved
                                      ? "En tu biblioteca"
                                      : "Añadir a mi Biblioteca"
                                  }
                                >
                                  {alreadySaved ? (
                                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                  ) : (
                                    <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                                  )}
                                </button>
                              );
                            })()}
                            {isAdmin && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(pl);
                                  }}
                                  className="w-9 h-9 flex items-center justify-center bg-black/95  rounded-lg text-slate-400 active:text-blue-400 border border-white/10 active:border-emerald-500/30 shadow-2xl transition-all cursor-pointer active:scale-110 active:scale-95"
                                  title="Editar"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startDeleting(pl.id);
                                  }}
                                  className="w-9 h-9 flex items-center justify-center bg-black/95  rounded-lg text-slate-400 active:text-red-400 border border-white/10 active:border-red-500/30 shadow-2xl transition-all cursor-pointer active:scale-110 active:scale-95"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* 2) Playlist Tracks Detail Pane (Interactive Playlist Previewing) */}
                {previewPlaylist && (
                  <div className="flex-1 flex flex-col min-h-0 bg-[#070708] border-l border-white/5 relative overflow-y-auto premium-scrollbar touch-pan-y pb-[120px] sm:pb-0">
                    {/* Header glass panel */}
                    <div className="p-5 sm:p-7 bg-gradient-to-b from-white/[0.02] to-transparent border-b border-white/5 shrink-0 flex flex-col sm:flex-row items-center gap-5 relative">
                      {/* Back button for mobile */}
                      <button
                        onClick={() => setPreviewPlaylist(null)}
                        className="md:hidden absolute top-4 left-4 p-2 bg-white/5 active:bg-white/10 rounded-full border border-white/10 text-slate-300 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr ${getPlaylistGradientClass(previewPlaylist.name)} flex items-center justify-center text-3xl shadow-2xl overflow-hidden shrink-0 relative border border-white/10`}
                      >
                        <>
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                          <Headphones className="w-10 h-10 text-white/95 relative z-10" />
                          {getPlaylistImage(previewPlaylist) && (
                            <img
                              src={getPlaylistImage(previewPlaylist)!}
                              alt={previewPlaylist.name}
                              className="absolute inset-0 w-full h-full object-cover z-20 bg-[#0d0d0f]"
                              
                              referrerPolicy="no-referrer"
                              onError={(e) => handlePlaylistImageError(e, previewPlaylist)}
                            />
                          )}
                        </>
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-[#1ED760] rounded text-[8px] font-black text-black uppercase tracking-wider">
                          PREVIEW
                        </div>
                      </div>

                      <div className="flex-1 text-center sm:text-left min-w-0 flex flex-col justify-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1ED760] mb-0.5">
                          Playlist Compartida
                        </p>
                        <h2 className="text-sm sm:text-lg font-black text-white tracking-tight leading-snug uppercase truncate">
                          {previewPlaylist.name}
                        </h2>
                        {previewPlaylist.description && (
                          <p className="text-[11px] text-slate-400 mt-1 font-medium leading-relaxed max-w-xl line-clamp-1">
                            {previewPlaylist.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 mt-2 text-[10px] font-bold text-slate-500">
                          {previewPlaylist.ownerName && (
                            <span className="text-[#1ED760] font-black uppercase tracking-wider">
                              Por{" "}
                              {previewPlaylist.isAdminContent
                                ? "#fluxmusicoficial"
                                : (previewPlaylist.ownerName || "")
                                      .toLowerCase()
                                      .includes("flux") ||
                                    (previewPlaylist.ownerName || "")
                                      .toLowerCase()
                                      .includes("oficial") ||
                                    (
                                      previewPlaylist.ownerName || ""
                                    ).toLowerCase() === "administrador"
                                  ? "Socio Premium"
                                  : sanitizeOwnerName(
                                      previewPlaylist.ownerName,
                                    )}
                            </span>
                          )}
                          {previewPlaylist.ownerName && (
                            <span className="text-white/10">•</span>
                          )}
                          <span>
                            {previewPlaylist.tracks.length}{" "}
                            {previewPlaylist.tracks.length === 1
                              ? "Pista"
                              : "Pistas"}
                          </span>
                          <span className="text-white/10">•</span>
                          <span className="text-[#1ED760] font-extrabold">
                            {calculatePlaylistDuration(previewPlaylist.tracks)}
                          </span>
                        </div>

                        {/* Intelligent Statistics Row / Info Cards */}
                        <div className="mt-4 grid grid-cols-2 sm:flex sm:flex-wrap items-stretch justify-center sm:justify-start gap-2 max-w-2xl select-none">
                          {/* Genre card */}
                          <div className="bg-white/[0.02] border border-white/5 rounded-xl px-3 py-1.5 flex flex-col items-center sm:items-start shrink-0 text-center sm:text-left min-w-[100px] transition-colors duration-300 active:bg-white/[0.04]">
                            <span className="text-[7px] xl:text-[7.5px] uppercase tracking-wider text-slate-500 font-bold">
                              Género Musical
                            </span>
                            <span className="text-[10.5px] text-emerald-400 font-black uppercase tracking-wide mt-0.5 truncate max-w-[120px]">
                              {getPlaylistGenre(previewPlaylist)}
                            </span>
                          </div>
                          {/* Popularity rating */}
                          <div className="bg-white/[0.02] border border-white/5 rounded-xl px-3 py-1.5 flex flex-col items-center sm:items-start shrink-0 text-center sm:text-left min-w-[100px] transition-colors duration-300 active:bg-white/[0.04]">
                            <span className="text-[7px] xl:text-[7.5px] uppercase tracking-wider text-slate-500 font-bold">
                              Popularidad
                            </span>
                            <span className="text-[10.5px] text-amber-400 font-black flex items-center gap-1 mt-0.5">
                              ★ {getPlaylistPopularity(previewPlaylist).rating}{" "}
                              <span className="text-[8px] text-slate-500 font-bold">
                                ({getPlaylistPopularity(previewPlaylist).score}
                                %)
                              </span>
                            </span>
                          </div>
                          {/* Saves count */}
                          <div className="bg-white/[0.02] border border-white/5 rounded-xl px-3 py-1.5 flex flex-col items-center sm:items-start shrink-0 text-center sm:text-left min-w-[100px] transition-colors duration-300 active:bg-white/[0.04]">
                            <span className="text-[7px] xl:text-[7.5px] uppercase tracking-wider text-[#1ED760] font-black tracking-widest">
                              En Biblioteca
                            </span>
                            <span className="text-[10.5px] text-slate-300 font-bold mt-0.5">
                              {getPlaylistSaves(
                                previewPlaylist,
                                userPlaylists,
                                user,
                              )}{" "}
                              veces listado
                            </span>
                          </div>
                        </div>

                        {/* Premium Action Row */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 shrink-0">
                          {previewPlaylist.tracks.length > 0 && (
                            <button
                              onClick={() =>
                                playPreviewTrack(previewPlaylist, 0)
                              }
                              className="md:scale-100 active:scale-105 active:scale-95 flex items-center justify-center gap-1.5 bg-[#1ED760] text-black active:bg-white font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-full transition-all duration-300 shadow-xl cursor-pointer"
                              title="Reproducir este canal"
                            >
                              {playingPlaylist?.id === previewPlaylist.id &&
                              isPlaying ? (
                                <Pause className="w-3.5 h-3.5 fill-black stroke-[3px]" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-black stroke-[3px]" />
                              )}
                              <span>
                                {playingPlaylist?.id === previewPlaylist.id &&
                                isPlaying
                                  ? "Pausar"
                                  : "Reproducir"}
                              </span>
                            </button>
                          )}

                          {(() => {
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Tracks container */}
                    <div className="flex-1 px-2 py-3 sm:px-6">
                      {previewPlaylist.tracks.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center text-slate-500">
                          <Music className="w-8 h-8 opacity-40 mb-2" />
                          <p className="text-xs uppercase font-bold tracking-wider">
                            Esta playlist no tiene canciones
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {previewPlaylist.tracks.map((track, trackIdx) => {
                            const isCurrentlyActiveInPlayer =
                              playingPlaylist?.id === previewPlaylist.id &&
                              currentTrackIndex === trackIdx;
                            const isCurrentlyPlaying =
                              isCurrentlyActiveInPlayer && isPlaying;
                            const favPlaylist = userPlaylists.find(
                              (p) =>
                                p.ownerId === user?.uid &&
                                (p.name.toLowerCase() === "favoritos" ||
                                  p.name.toLowerCase() === "siguiente"),
                            );
                            const isLiked = favPlaylist?.tracks.some(
                              (t) =>
                                (track.id && t.id === track.id) ||
                                (track.url && t.url === track.url),
                            );

                            return (
                              <div
                                key={`prev_trk_${track.id || "x"}_${trackIdx}`}
                                onClick={() => {
                                  playPreviewTrack(previewPlaylist, trackIdx);
                                }}
                                className={`w-full flex items-center justify-between p-1.5 rounded-xl border transition-all cursor-pointer text-left ${
                                  isCurrentlyActiveInPlayer
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-white"
                                    : "bg-white/[0.01] active:bg-white/[0.04] border-transparent text-slate-300 active:text-white"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {/* Play/Index Indicator */}
                                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                    {isCurrentlyActiveInPlayer ? (
                                      isCurrentlyPlaying ? (
                                        <div className="flex items-end gap-0.5 h-2.5">
                                          <div
                                            className={`w-0.5 bg-[#1ED760] h-full ${isEcoMode ? "" : "animate-bounce"}`}
                                            style={{
                                              animationDelay: "0.1s",
                                              animationDuration: "0.8s",
                                            }}
                                          />
                                          <div
                                            className={`w-0.5 bg-[#1ED760] h-2/3 ${isEcoMode ? "" : "animate-bounce"}`}
                                            style={{
                                              animationDelay: "0.3s",
                                              animationDuration: "0.5s",
                                            }}
                                          />
                                          <div
                                            className={`w-0.5 bg-[#1ED760] h-1/2 ${isEcoMode ? "" : "animate-bounce"}`}
                                            style={{
                                              animationDelay: "0s",
                                              animationDuration: "0.7s",
                                            }}
                                          />
                                        </div>
                                      ) : (
                                        <Play className="w-3 h-3 text-[#1ED760] fill-[#1ED760]" />
                                      )
                                    ) : (
                                      <span className="text-[10px] font-bold text-slate-500">
                                        {trackIdx + 1}
                                      </span>
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <p
                                      className={`text-[11.5px] sm:text-xs font-bold truncate tracking-tight ${isCurrentlyActiveInPlayer ? "text-[#1ED760]" : "text-slate-150"}`}
                                    >
                                      {track.title}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                                      {track.artist || "Artista Desconocido"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0 ml-2">
                                  {isCurrentlyActiveInPlayer && (
                                    <span className="hidden xs:inline-block text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#1ED760] bg-emerald-500/10 border border-emerald-500/15 px-1.5 py-0.2 rounded-full">
                                      {isCurrentlyPlaying
                                        ? "REPRODUCIENDO"
                                        : "PAUSADO"}
                                    </span>
                                  )}

                                  {/* Hover Actions Block */}
                                  <div className="flex items-center gap-1 relative z-20">
                                    {/* Action 1: Me gusta (Heart) */}
                                    <button
                                      onClick={(e) =>
                                        handleToggleFavorite(track, e)
                                      }
                                      className="p-1.5 text-slate-400 active:text-pink-500 active:bg-pink-500/10 rounded-lg transition-all cursor-pointer"
                                      title={
                                        isLiked
                                          ? "Quitar de Favoritos"
                                          : "Me gusta"
                                      }
                                    >
                                      <Heart
                                        className={`w-3.5 h-3.5 transition-colors ${isLiked ? "text-pink-500 fill-pink-500" : ""}`}
                                      />
                                    </button>

                                    {/* Action 2: Añadir canción (Plus) */}
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        addSingleTrackToCurrentPlaylist(track);
                                      }}
                                      className="p-1.5 text-slate-400 active:text-[#1ED760] active:bg-[#1ED760]/10 rounded-lg transition-all cursor-pointer"
                                      title="Añadir a mi Playlist"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Action 3: Añadir a la Cola (ListPlus o similar) */}
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const mappedTrack: MusicTrack = {
                                          id: track.id || `preview_${trackIdx}`,
                                          title: track.title,
                                          artist: track.artist || "Flux",
                                          url: track.url,
                                          duration: track.duration || "N/A",
                                          bpm: 120,
                                        };
                                        handleAddToQueue(mappedTrack, e);
                                      }}
                                      className="p-1.5 text-slate-400 active:text-[#1ED760] active:bg-[#1ED760]/10 rounded-lg transition-all cursor-pointer"
                                      title="Añadir a la cola"
                                    >
                                      <PlusCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <span className="font-bold text-[10px] font-mono text-slate-400 min-w-[35px] text-right">
                                    {track.duration || "3:30"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY: EDIT PLAYLIST MODAL */}
      <AnimatePresence>
        {editingId && (
          <motion.div
            initial={{
              opacity: 0,
              backdropFilter: isEcoMode ? "none" : "blur(8px)",
            }}
            animate={{
              opacity: 1,
              backdropFilter: isEcoMode ? "none" : "blur(8px)",
            }}
            exit={{
              opacity: 0,
              backdropFilter: isEcoMode ? "none" : "blur(8px)",
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80"
          >
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-[40px] p-6 sm:p-12 shadow-[0_0_100px_rgba(16,185,129,0.1)] relative"
            >
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/20 blur-[120px] rounded-full" />

              <div className="flex justify-between items-center mb-10 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                    <Edit2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase text-white tracking-[0.3em]">
                      Editar Canal
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      Actualizar Metadatos
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-3 bg-white/5 active:bg-white/10 rounded-2xl text-slate-400 active:text-white transition-all transform active:rotate-90"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="space-y-8 relative z-10">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-3 block">
                      Nombre del Canal
                    </label>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      placeholder="Nombre del Canal"
                      className="w-full bg-black/40 border border-white/5 rounded-[24px] px-6 py-4 text-sm outline-none focus:border-emerald-500/50 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-3 block">
                      Descripción
                    </label>
                    <textarea
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      placeholder="Breve descripción..."
                      className="w-full bg-black/40 border border-white/5 rounded-[24px] px-6 py-4 text-sm outline-none focus:border-emerald-500/50 transition-all font-medium h-32 resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-3 block">
                      URL de la Foto de Portada
                    </label>
                    <input
                      type="text"
                      value={editingCover}
                      onChange={(e) => setEditingCover(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-black/40 border border-white/5 rounded-[24px] px-6 py-4 text-sm outline-none focus:border-emerald-500/50 transition-all font-medium"
                    />
                  </div>

                  {!isAdmin && !isBlocked && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] px-3 block">
                        Código Maestro de Seguridad
                      </label>
                      <input
                        type="password"
                        value={authCode}
                        onChange={(e) => setAuthCode(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-[24px] px-6 py-4 text-sm outline-none focus:border-emerald-500 transition-all font-mono"
                      />
                    </div>
                  )}

                  {isBlocked && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                        Acceso Bloqueado permanentemente
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={saveEdit}
                    className="w-full bg-emerald-500 text-black py-6 rounded-[30px] text-xs font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:bg-white active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
                  >
                    Guardar Cambios
                    <Save className="w-5 h-5 group-active:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY: EDIT TRACK MODAL */}
      <AnimatePresence>
        {editingTrack && (
          <motion.div
            initial={{
              opacity: 0,
              backdropFilter: isEcoMode ? "none" : "blur(8px)",
            }}
            animate={{
              opacity: 1,
              backdropFilter: isEcoMode ? "none" : "blur(8px)",
            }}
            exit={{
              opacity: 0,
              backdropFilter: isEcoMode ? "none" : "blur(8px)",
            }}
            className="fixed inset-0 z-[105] flex items-center justify-center p-4 sm:p-6 bg-black/85"
          >
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-[40px] p-6 sm:p-12 shadow-[0_0_100px_rgba(16,185,129,0.1)] relative text-left"
            >
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/20 blur-[120px] rounded-full" />

              <div className="flex justify-between items-center mb-10 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                    <Edit2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase text-white tracking-[0.3em]">
                      Editar Canción
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      Renombrar y agregar descripción
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingTrack(null)}
                  className="p-3 bg-white/5 active:bg-white/10 rounded-2xl text-slate-400 active:text-white transition-all transform active:rotate-90"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="space-y-8 relative z-10">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-3 block">
                      Nombre / Título de la Canción
                    </label>
                    <input
                      type="text"
                      value={editingTrackTitle}
                      onChange={(e) => setEditingTrackTitle(e.target.value)}
                      placeholder="Ej. Phonk Remix"
                      className="w-full bg-black/40 border border-white/5 rounded-[24px] px-6 py-4 text-sm outline-none focus:border-emerald-500/50 transition-all font-medium text-white"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-3 block">
                      Artista / Distribuidor / Autor
                    </label>
                    <input
                      type="text"
                      value={editingTrackArtist}
                      onChange={(e) => setEditingTrackArtist(e.target.value)}
                      placeholder="Ej. M83"
                      className="w-full bg-black/40 border border-white/5 rounded-[24px] px-6 py-4 text-sm outline-none focus:border-emerald-500/50 transition-all font-medium text-white"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-3 block">
                      Descripción o Detalles
                    </label>
                    <textarea
                      value={editingTrackDescription}
                      onChange={(e) =>
                        setEditingTrackDescription(e.target.value)
                      }
                      placeholder="Escribe una nota, descripción o dedicatoria para esta canción..."
                      className="w-full bg-black/40 border border-white/5 rounded-[24px] px-6 py-4 text-sm outline-none focus:border-emerald-500/50 transition-all font-medium h-32 resize-none text-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={saveTrackEdit}
                    className="w-full bg-emerald-500 text-black py-6 rounded-[30px] text-xs font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:bg-white active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
                  >
                    Guardar Cambios
                    <Save className="w-5 h-5 group-active:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY: DELETE TRACK CONFIRMATION MODAL */}
      <AnimatePresence>
        {trackToDeleteConfirm && (
          <motion.div
            initial={{
              opacity: 0,
              backdropFilter: isEcoMode ? "none" : "blur(8px)",
            }}
            animate={{
              opacity: 1,
              backdropFilter: isEcoMode ? "none" : "blur(8px)",
            }}
            exit={{
              opacity: 0,
              backdropFilter: isEcoMode ? "none" : "blur(8px)",
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80"
          >
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[40px] p-6 sm:p-10 shadow-[0_0_100px_rgba(239,68,68,0.1)] relative"
            >
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-red-500/10 blur-[120px] rounded-full" />

              <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-500/10 rounded-xl">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase text-white tracking-[0.3em]">
                      Eliminar Canción
                    </h2>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      Confirmar Eliminación
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTrackToDeleteConfirm(null)}
                  className="p-3 bg-white/5 active:bg-white/10 rounded-2xl text-slate-400 active:text-white transition-all transform active:rotate-90 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 relative z-10 text-left">
                <p className="text-xs sm:text-sm text-slate-300 font-medium px-2 leading-relaxed">
                  ¿Estás seguro de que deseas eliminar la canción{" "}
                  <span className="text-blue-400 font-bold">
                    "{trackToDeleteConfirm.title}"
                  </span>{" "}
                  de la playlist{" "}
                  <span className="text-white font-bold">
                    "{selectedPlaylist?.name}"
                  </span>
                  ? Esta acción no se puede deshacer.
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setTrackToDeleteConfirm(null)}
                    className="flex-1 bg-white/5 text-white py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 active:bg-white/10 transition-all cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={executeDeleteTrack}
                    className="flex-1 bg-red-500 text-black active:bg-red-400 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(239,68,68,0.2)] transition-all cursor-pointer text-center"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY: DELETE PLAYLIST MODAL */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{
              opacity: 0,
              backdropFilter: isEcoMode ? "none" : "blur(8px)",
            }}
            animate={{
              opacity: 1,
              backdropFilter: isEcoMode ? "none" : "blur(8px)",
            }}
            exit={{
              opacity: 0,
              backdropFilter: isEcoMode ? "none" : "blur(8px)",
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80"
          >
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-red-500/20 rounded-[40px] p-6 sm:p-12 shadow-[0_0_100px_rgba(239,68,68,0.1)] relative"
            >
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-red-500/20 blur-[120px] rounded-full" />

              <div className="flex justify-between items-center mb-10 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-500/10 rounded-xl">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase text-white tracking-[0.3em]">
                      Eliminar Canal
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      Acción Irreversible
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDeletingId(null)}
                  className="p-3 bg-white/5 active:bg-white/10 rounded-2xl text-slate-400 active:text-white transition-all transform active:rotate-90"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="space-y-8 relative z-10">
                <p className="text-sm text-slate-400 font-medium px-2">
                  ¿Estás seguro de que deseas eliminar este canal? Esta acción
                  borrará todos los datos asociados de forma permanente.
                </p>

                <div className="space-y-6">
                  {(() => {
                    const pl = userPlaylists.find((p) => p.id === deletingId);
                    const isOwner = user && pl && pl.ownerId === user.uid;
                    const isSystemMasterPlaylist =
                      pl && pl.adminSecret === "ho82788278";
                    const needsPasscode =
                      isSystemMasterPlaylist && !isAdmin && !isOwner;
                    return needsPasscode && !isBlocked ? (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-red-500/60 uppercase tracking-[0.2em] px-3 block">
                          Código Maestro de Seguridad
                        </label>
                        <input
                          type="password"
                          value={authCode}
                          onChange={(e) => setAuthCode(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-red-500/5 border border-red-500/20 rounded-[24px] px-6 py-4 text-sm outline-none focus:border-red-500 transition-all font-mono"
                        />
                      </div>
                    ) : null;
                  })()}

                  {isBlocked && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                        Acceso Bloqueado permanentemente
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDeletingId(null)}
                    className="bg-white/5 text-white/60 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] active:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={executeDelete}
                    disabled={isDeleting}
                    className={`bg-red-500 text-white py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${
                      isDeleting
                        ? "opacity-50 cursor-not-allowed"
                        : "active:bg-red-600 active:scale-95"
                    }`}
                  >
                    {isDeleting ? "Borrando..." : "Eliminar"}
                    {!isDeleting && <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY: ADD TO LIBRARY MODAL (Spotify Style) */}
      <AnimatePresence>
        {isAddingToPlaylistModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 "
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#1ED760]/10 rounded-lg">
                    <ListMusic className="w-4 h-4 text-[#1ED760]" />
                  </div>
                  <h3 className="text-[11px] font-black uppercase text-white tracking-[0.2em]">
                    {trackToAddDestination
                      ? "Añadir a Biblioteca"
                      : "Crear Playlist"}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsAddingToPlaylistModalOpen(false);
                    setTrackToAddDestination(null);
                  }}
                  className="p-1.5 active:bg-white/10 rounded-full text-slate-400 active:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content Container */}
              <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
                {/* Track Preview Card (only if adding a track) */}
                {trackToAddDestination && (
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3">
                    {trackToAddDestination.thumbnail ? (
                      <img
                        src={cleanUrl(trackToAddDestination.thumbnail)}
                        alt={trackToAddDestination.title}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center">
                        <Music className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[8px] font-black text-[#1ED760] bg-[#1ED760]/10 px-1.5 py-0.5 rounded leading-none uppercase tracking-widest border border-[#1ED760]/20">
                          {trackToAddDestination.isPlaylist
                            ? "Playlist"
                            : "Canción"}
                        </span>
                        {trackToAddDestination.duration && (
                          <span className="text-[9px] text-slate-500 font-bold">
                            {trackToAddDestination.duration}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">
                        {trackToAddDestination.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {trackToAddDestination.artist}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tabs selection (Only if we have a track to add) */}
                {trackToAddDestination && (
                  <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 overflow-hidden">
                    <button
                      onClick={() =>
                        setModalSelectedPlaylistId(
                          userPlaylists.filter((p) => p.ownerId === user?.uid)
                            .length > 0
                            ? userPlaylists.filter(
                                (p) => p.ownerId === user?.uid,
                              )[0].id
                            : "new",
                        )
                      }
                      className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl ${modalSelectedPlaylistId !== "new" ? "bg-white/10 text-white shadow-xl" : "text-slate-500 active:text-slate-400"}`}
                    >
                      Playlist Existente
                    </button>
                    <button
                      onClick={() => setModalSelectedPlaylistId("new")}
                      className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl ${modalSelectedPlaylistId === "new" ? "bg-[#1ED760] text-black shadow-xl" : "text-slate-500 active:text-slate-400"}`}
                    >
                      Nueva Playlist
                    </button>
                  </div>
                )}

                {/* Display form for new or selection for existing */}
                {modalSelectedPlaylistId === "new" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block px-1">
                        Nombre de la playlist
                      </label>
                      <input
                        type="text"
                        value={modalNewPlaylistName}
                        onChange={(e) =>
                          setModalNewPlaylistName(e.target.value)
                        }
                        placeholder={
                          trackToAddDestination
                            ? `Playlist de ${trackToAddDestination.artist || "Favoritos"}`
                            : "Mi nueva lista..."
                        }
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white outline-none focus:border-[#1ED760]/30 focus:bg-white/[0.05] transition-all font-bold"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block px-1">
                        Descripción (opcional)
                      </label>
                      <textarea
                        value={modalNewPlaylistDesc}
                        onChange={(e) =>
                          setModalNewPlaylistDesc(e.target.value)
                        }
                        placeholder="Escribe algo sobre este canal..."
                        rows={2}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white outline-none focus:border-[#1ED760]/30 focus:bg-white/[0.05] transition-all font-medium resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block px-1">
                      Selecciona destino
                    </label>
                    {userPlaylists
                      .filter(
                        (p) =>
                          p.ownerId === user?.uid &&
                          p.name.toLowerCase() !== "favoritos",
                      )
                      .map((pl) => (
                        <button
                          key={pl.id}
                          onClick={() => setModalSelectedPlaylistId(pl.id)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border transition-all text-left ${modalSelectedPlaylistId === pl.id ? "bg-[#1ED760]/10 border-[#1ED760]/30" : "bg-white/[0.02] border-transparent active:bg-white/[0.04]"}`}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center bg-[#333]">
                            <ListMusic className="w-4 h-4 text-slate-500 absolute" />
                            {getPlaylistImage(pl) && (
                              <img
                                src={getPlaylistImage(pl)!}
                                className="absolute inset-0 w-full h-full object-cover z-10"
                                referrerPolicy="no-referrer"
                                onError={(e) => handlePlaylistImageError(e, pl)}
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              className={`text-[11px] font-black truncate ${modalSelectedPlaylistId === pl.id ? "text-[#1ED760]" : "text-white"}`}
                            >
                              {pl.name}
                            </p>
                            <p className="text-[9px] text-slate-500 font-bold">
                              {pl.tracks?.length || 0} canciones
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-5 flex items-center justify-between border-t border-white/5 bg-white/[0.02]">
                <button
                  onClick={() => {
                    setIsAddingToPlaylistModalOpen(false);
                    setTrackToAddDestination(null);
                  }}
                  className="text-[10px] font-black uppercase text-slate-500 active:text-white transition-colors tracking-widest cursor-pointer px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  disabled={
                    isProcessingModalAdd ||
                    (modalSelectedPlaylistId === "new" &&
                      !modalNewPlaylistName.trim())
                  }
                  onClick={() =>
                    executeModalAddTrack(
                      modalSelectedPlaylistId,
                      modalSelectedPlaylistId === "new",
                    )
                  }
                  className="bg-[#1ED760] active:bg-emerald-400 text-black px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#1ED760]/10 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale cursor-pointer"
                >
                  {isProcessingModalAdd ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                  )}
                  <span>
                    {modalSelectedPlaylistId === "new"
                      ? "Crear ahora"
                      : "Añadir ahora"}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY: LEGACY SYSTEM REMOVED */}

      {isAdminPanelOpen && (
        <React.Suspense fallback={null}>
          <LazyUserManagementAdmin onClose={() => setIsAdminPanelOpen(false)} />
        </React.Suspense>
      )}

      {isAdminPanelOpen && (
        <React.Suspense fallback={null}>
          <LazyUserManagementAdmin onClose={() => setIsAdminPanelOpen(false)} />
        </React.Suspense>
      )}
      {isProfileModalOpen && (
        <React.Suspense fallback={null}>
          <LazyUserProfileModal onClose={() => setIsProfileModalOpen(false)} />
        </React.Suspense>
      )}

      <AnimatePresence>
        {sessionHijacked && (
          <motion.div
            initial={{
              opacity: 0,
              backdropFilter: isEcoMode ? "none" : "blur(8px)",
            }}
            animate={{
              opacity: 1,
              backdropFilter: isEcoMode ? "none" : "blur(8px)",
            }}
            exit={{
              opacity: 0,
              backdropFilter: isEcoMode ? "none" : "blur(8px)",
            }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/90"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="w-full max-w-sm bg-[#121212] border border-[#1ED760]/30 rounded-3xl p-6 sm:p-8 shadow-[0_24px_60px_rgba(30,215,96,0.2)] flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-[#1ED760]/20 blur-[50px] pointer-events-none rounded-full" />

              <div className="w-16 h-16 bg-black rounded-full border border-white/10 flex items-center justify-center mb-5 relative z-10">
                <Headphones className="w-8 h-8 text-[#1ED760]" />
              </div>

              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2 relative z-10">
                Reproducción Pausada
              </h2>
              <p className="text-sm text-slate-400 font-medium mb-6 relative z-10 leading-relaxed">
                Tu cuenta está activa en otro dispositivo. Solo se permite 1
                usuario simultáneo en tu plan actual.
              </p>

              <button
                onClick={() => setSessionHijacked(false)}
                className="w-full bg-[#1ED760] active:bg-[#1fdf64] text-black py-3.5 rounded-full font-black uppercase text-xs tracking-widest shadow-[0_10px_30px_rgba(30,215,96,0.3)] active:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer relative z-10"
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {false && (
        <div className="absolute inset-0 z-[99999] bg-black/70 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 text-center overscroll-none select-none overflow-y-auto">
          {/* Authentic Spotify premium subtle ambient green glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[#1ED760]/10 blur-[120px] pointer-events-none animate-pulse" />

          <div className="relative z-10 max-w-sm w-full bg-[#121212] border border-white/10 rounded-2xl sm:rounded-[28px] p-4 sm:p-8 shadow-[0_30px_100px_rgba(0,0,0,0.9)] flex flex-col items-center">
            {/* Spotify Brand Emblem / Tech Vibe Dot */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-full border border-[#1ED760]/20 flex items-center justify-center mb-4 sm:mb-6 shadow-inner relative group">
              <span className="absolute inset-0 rounded-full bg-[#1ED760]/10 blur-sm group-active:bg-[#1ED760]/20 transition-all pointer-events-none" />
              <Headphones className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#1ED760] relative z-10 animate-bounce" />
            </div>

            {!user ? (
              <>
                <p className="text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest text-[#1ED760] mb-3 sm:mb-4 px-3 bg-[#1ED760]/10 py-1 rounded-full border border-[#1ED760]/20">
                  Música Premium Interminable
                </p>
                {/* Spotify-style premium interactive dropdown block */}
                <div className="w-full mb-4 sm:mb-5 text-center relative z-30">
                  <h3 className="text-white font-bold text-lg sm:text-xl mb-2 drop-shadow-md">
                    Bienvenido a Flux Music
                  </h3>
                  <p className="text-slate-200 text-xs sm:text-[13px] leading-relaxed max-w-sm mx-auto font-medium drop-shadow">
                    Descubre una experiencia sin límites. Escucha millones de
                    canciones, crea playlists personalizadas, encuentra las
                    mejores tendencias de tu país y sincroniza tu música en
                    todos tus dispositivos en calidad óptima.
                  </p>
                </div>

                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="w-full bg-[#1ED760] active:bg-[#1fdf64] text-black py-2.5 sm:py-3.5 rounded-full font-black uppercase text-[10px] sm:text-xs tracking-wider sm:tracking-widest shadow-[0_10px_30px_rgba(30,215,96,0.3)] active:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar Sesión / Registro</span>
                </button>
              </>
            ) : (
              <>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase mb-1 font-sans">
                  {accessData.plan === "none" && accessData.trialStart === null
                    ? "Acceso Restringido"
                    : accessData.plan !== "none" && accessData.plan !== "free"
                    ? "Suscripción Finalizada"
                    : "Gracias por probar Flux Music."}
                </h1>

                <p className="text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest text-[#1ED760] mb-3 sm:mb-5 px-3 bg-[#1ED760]/10 py-0.5 rounded-full border border-[#1ED760]/20">
                  {accessData.plan === "none" && accessData.trialStart === null
                    ? "Privado • Pendiente de Alta"
                    : "Membresía Expirada"}
                </p>

                <p className="text-[#a7a7a7] max-w-xs mx-auto mb-4 sm:mb-6 text-[10.5px] sm:text-xs font-medium leading-relaxed">
                  {accessData.plan === "none" && accessData.trialStart === null
                    ? "Para garantizar máxima estabilidad y baja latencia, controlamos manualmente el aforo. Adquiere o solicita tu prueba."
                    : accessData.plan !== "none" && accessData.plan !== "free"
                    ? "Tu suscripción ya finalizó. Continúa escuchando sin anuncios por solo 5 €/mes."
                    : "Tu prueba gratuita ya finalizó. Continúa escuchando sin anuncios por solo 5 €/mes."}
                </p>

                <div className="flex flex-col gap-3 w-full">
                  {/* Siempre mostramos el boton de contactar */}
                  <button
                    onClick={async () => {
                      window.dispatchEvent(new CustomEvent('open-sidebar-menu', { detail: { openSupport: true, message: 'Hola.\n\nHe utilizado mi prueba gratuita de Flux Music y quiero activar la suscripción Premium de 5 €/mes.\n\nQuedo pendiente.' } }));
                    }}
                    className="w-full bg-gradient-to-r from-emerald-500 to-[#1ED760] active:from-emerald-400 active:to-[#1fdf64] text-black py-2.5 sm:py-3 px-3 sm:px-4 rounded-full font-black uppercase text-[10px] sm:text-[10.5px] tracking-wider shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/20"
                  >
                    <span>⚡ SOLICITAR PREMIUM (ABRIR MENÚ LATERAL)</span>
                  </button>
                  
                  {user && (
                    <div className="flex flex-col gap-2 mt-4 w-full">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setAuthModalOpen(true)}
                          className="w-full py-2 bg-white/5 active:bg-white/10 text-white text-[9px] uppercase font-bold tracking-widest rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-white/5"
                        >
                          <LogIn className="w-3 h-3" />
                          <span>Iniciar Sesión</span>
                        </button>
                        <button
                          onClick={() => setAuthModalOpen(true)}
                          className="w-full py-2 bg-white/5 active:bg-white/10 text-white text-[9px] uppercase font-bold tracking-widest rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-white/5"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Registro</span>
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          localStorage.setItem('flux_voluntary_logout', 'true');
                          signOut(auth);
                        }}
                        className="py-2 text-white/40 active:text-white/80 transition-colors text-[9px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5 w-full mt-1"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      )}
      
      
    </div>
  );
}
