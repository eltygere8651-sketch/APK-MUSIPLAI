import { MusicTrack } from "../types";

export interface DJConfig {
  discoveryLevel: number; // 0 to 100 (for backward compatibility if needed)
  genreMode?: boolean;
  selectedGenre?: string;
  topRatio?: number;
  favRatio?: number;
  discRatio?: number;
}

/**
 * Selects the next track based on the AI DJ logic:
 * - Uses configured or stored ratios for Top Tracks, Favorite Tracks, and Discovery.
 * - Defaults to: 30% Top Songs, 20% Favorite Songs, 50% New Discovery.
 */
export function selectNextDJTrack(
  topTracks: MusicTrack[],
  favorites: MusicTrack[],
  discoveryPool: MusicTrack[],
  config: DJConfig
): MusicTrack | null {
  // If genre mode is active, filter all pools by genre (if a genre is selected)
  let currentTop = topTracks;
  let currentFavs = favorites;
  let currentDisc = discoveryPool;

  if (config.genreMode && config.selectedGenre) {
    const genreFilter = (t: MusicTrack) => 
      t.title?.toLowerCase().includes(config.selectedGenre!.toLowerCase()) || 
      t.artist?.toLowerCase().includes(config.selectedGenre!.toLowerCase());

    currentTop = topTracks.filter(genreFilter);
    currentFavs = favorites.filter(genreFilter);
    currentDisc = discoveryPool.filter(genreFilter);
    
    // If no tracks found with that genre in top/favs, fallback to discovery for that genre
    if (currentTop.length === 0 && currentFavs.length === 0 && currentDisc.length === 0) {
      // In worst case, just fallback to discovery pool without strict genre but we tried
      currentDisc = discoveryPool;
    }
  }

  // Determine user parameters with strict fallback to default (30, 20, 50)
  let topRatio = 32;
  let favRatio = 18;
  let discRatio = 50;

  // Retrieve from localStorage if available in browser
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const savedTop = window.localStorage.getItem("fai_top_ratio");
      const savedFav = window.localStorage.getItem("fai_fav_ratio");
      const savedDisc = window.localStorage.getItem("fai_disc_ratio");
      if (savedTop !== null) topRatio = parseInt(savedTop, 10);
      if (savedFav !== null) favRatio = parseInt(savedFav, 10);
      if (savedDisc !== null) discRatio = parseInt(savedDisc, 10);
    } catch (e) {
      console.warn("Could not read ratios from localStorage:", e);
    }
  }

  // Override from passed config if explicitly defined
  if (config.topRatio !== undefined) topRatio = config.topRatio;
  if (config.favRatio !== undefined) favRatio = config.favRatio;
  if (config.discRatio !== undefined) discRatio = config.discRatio;

  // Normalize so that the ratios are converted to probabilities summing to 1.0
  const total = topRatio + favRatio + discRatio;
  const wTop = total > 0 ? topRatio / total : 0.32;
  const wFav = total > 0 ? favRatio / total : 0.18;
  const wDisc = total > 0 ? discRatio / total : 0.50;

  const rand = Math.random();

  let selected: MusicTrack | null = null;

  if (rand < wDisc && currentDisc.length > 0) {
    selected = currentDisc[Math.floor(Math.random() * currentDisc.length)];
  } else if (rand < wDisc + wTop && currentTop.length > 0) {
    selected = currentTop[Math.floor(Math.random() * currentTop.length)];
  } else if (currentFavs.length > 0) {
    selected = currentFavs[Math.floor(Math.random() * currentFavs.length)];
  } else {
    // Fallback logic if some lists are empty
    let fallbackPool = [...currentTop, ...currentFavs, ...currentDisc];
    if (fallbackPool.length === 0) {
      fallbackPool = [...topTracks, ...favorites, ...discoveryPool];
    }
    if (fallbackPool.length === 0) return null;
    selected = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  }

  if (selected && !selected.url) {
    const dbFallback = discoveryPool.find(t => t.id === selected!.id);
    if (dbFallback && dbFallback.url) {
      selected = { ...selected, url: dbFallback.url };
    } else {
      selected = { ...selected, url: `https://www.youtube.com/watch?v=${selected.id}` };
    }
  }

  return selected;
}

export const FLUX_PAYOLA = [
  "¡Recuerda que FLX Radio es la casa del mejor sonido! No te despegues.",
  "FLX Radio: donde el ritmo nunca muere y la IA siempre pincha lo mejor.",
  "Si te gusta lo que escuchas, comparte FLX Radio con tus amigos.",
  "Aquí en FLX Radio, siempre tenemos lo mejor para tu entrenamiento.",
  "Tu DJ, mezclando para ti en FLX Radio."
];

export const DJ_GENRES = [
  "La mezcla de Sofia",
  "Variado Mix",
  "Reggaeton",
  "Phonk",
  "EDM",
  "Pop",
  "Hip Hop",
  "Hardstyle",
  "Techno",
  "Rock",
  "Metal",
  "Trap",
  "House",
  "Afrobeat"
];
export const isReasonableTrack = (duration: string | undefined | null, title: string | undefined | null): boolean => {
  if (!duration || duration === "N/A" || duration === "0:00") return false;
  const parts = duration.split(":");
  if (parts.length >= 3) return false; // 1 hour or more is too long
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (mins > 6) return false; // More than 6 minutes is likely a compilation or extended version for a radio
    if (mins === 0 && secs < 60) return false; // Less than 60 seconds is too short
    if (mins === 1 && secs < 30) return false; // Less than 1:30 is usually an intro
  } else if (parts.length === 1) {
    return false; // usually just seconds
  }
  
  if (title) {
    const t = title.toLowerCase();
    if (
      t.includes("compilation") || 
      t.includes("mashup") || 
      t.includes("megamix") || 
      t.includes("1 hour") || 
      t.includes("1 hora") ||
      t.includes("10 hours") ||
      t.includes("best of") ||
      t.includes("mix 202") || 
      t.includes("mix 201") ||
      t.includes("top 50") ||
      t.includes("top 100") ||
      t.includes("top 40") ||
      t.includes("mas vistas") ||
      t.includes("más vistas") ||
      t.includes("las canciones") ||
      t.includes("los exitos") ||
      t.includes("los éxitos") ||
      t.includes("en vivo") ||
      t.includes("live at") ||
      t.includes("concert") ||
      t.includes("playlist") ||
      t.includes("full album")
    ) {
      return false;
    }
    // Strict block for just "mix" if it's not "remix"
    // Many mixes have " mix", "mix " but let's just reject if it has "mix" and is NOT a remix?
    // User hates "compilaciones imcompletos" and "remis de compilaciones".
    // We'll trust the duration filter mostly for mixes! (8 minute max).
    // If it's <= 8 mins and has "mix" in the title, it's likely a normal remix or short DJ mix, which is fine.
  }
  return true;
};
