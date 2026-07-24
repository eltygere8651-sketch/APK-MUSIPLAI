import { MusicTrack } from "../types";

export interface PlayHistoryItem {
  trackId: string;
  url?: string;
  title: string;
  artist: string;
  bpm: number;
  timestamp: number;
  playCount: number;
  skipCount: number;
}

export interface TasteDiagnostics {
  topArtists: string[];
  preferredBpm: number;
  tempoCategory: string;
  dominantStyle: string;
  totalPlaysCount: number;
}

export interface RecommendedTrack extends MusicTrack {
  affinityScore: number;
  affinityReason: string;
}

// Helper to get play history from localStorage
export function getPlayHistory(): Record<string, PlayHistoryItem> {
  try {
    const raw = localStorage.getItem("flux_music_taste_history");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Error reading taste history:", e);
    return {};
  }
}

// Helper to save play history to localStorage
function savePlayHistory(history: Record<string, PlayHistoryItem>): void {
  try {
    localStorage.setItem("flux_music_taste_history", JSON.stringify(history));
  } catch (e) {
    console.warn("Error saving taste history:", e);
  }
}

// Log a track play event (highly weighted)
export function recordTrackPlay(track: MusicTrack): void {
  if (!track || (!track.id && !track.url)) return;
  const key = track.url || track.id;
  const history = getPlayHistory();

  if (!history[key]) {
    history[key] = {
      trackId: track.id,
      url: track.url,
      title: track.title,
      artist: track.artist || "Artista Desconocido",
      bpm: track.bpm || 120,
      timestamp: Date.now(),
      playCount: 1,
      skipCount: 0,
    };
  } else {
    history[key].playCount += 1;
    history[key].timestamp = Date.now();
  }

  savePlayHistory(history);
}

// Log a track skip event (heavy penalty if skipped early)
export function recordTrackSkip(track: MusicTrack): void {
  if (!track || (!track.id && !track.url)) return;
  const key = track.url || track.id;
  const history = getPlayHistory();

  if (!history[key]) {
    history[key] = {
      trackId: track.id,
      url: track.url,
      title: track.title,
      artist: track.artist || "Artista Desconocido",
      bpm: track.bpm || 120,
      timestamp: Date.now(),
      playCount: 0,
      skipCount: 1,
    };
  } else {
    history[key].skipCount += 1;
  }

  savePlayHistory(history);
}

// Compute Taste Diagnostics
export function getTasteDiagnostics(
  favoritesList: MusicTrack[]
): TasteDiagnostics {
  const history = getPlayHistory();
  const historyList = Object.values(history);

  // 1. Calculate top artists based on play affinity and favorites
  const artistScores: Record<string, number> = {};
  
  // Weights from favorites
  favoritesList.forEach((t) => {
    if (t.artist) {
      artistScores[t.artist] = (artistScores[t.artist] || 0) + 10;
    }
  });

  // Weights from plays & minus penalty from skips
  historyList.forEach((h) => {
    if (h.artist) {
      const playWeight = h.playCount * 3;
      const skipPenalty = h.skipCount * 2;
      artistScores[h.artist] = (artistScores[h.artist] || 0) + playWeight - skipPenalty;
    }
  });

  // Sort and extract top 3 artists with positive scores
  const topArtists = Object.entries(artistScores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([artist]) => artist)
    .slice(0, 3);

  if (topArtists.length === 0) {
    topArtists.push("Explorador Flux");
  }

  // 2. Preferred BPM Calculation (weighted average)
  let totalBpmWeight = 0;
  let weightedBpmSum = 0;

  favoritesList.forEach((t) => {
    if (t.bpm) {
      weightedBpmSum += t.bpm * 5;
      totalBpmWeight += 5;
    }
  });

  historyList.forEach((h) => {
    if (h.bpm && h.playCount > 0) {
      const weight = Math.max(1, h.playCount - h.skipCount);
      weightedBpmSum += h.bpm * weight;
      totalBpmWeight += weight;
    }
  });

  const preferredBpm = totalBpmWeight > 0 ? Math.round(weightedBpmSum / totalBpmWeight) : 124;

  // Tempo category label
  let tempoCategory = "Moderado (Equilibrado)";
  if (preferredBpm >= 135) {
    tempoCategory = "Hiper-Energético (Alta Intensidad)";
  } else if (preferredBpm >= 120) {
    tempoCategory = "Electro Ritmo (Dinámico)";
  } else if (preferredBpm < 110) {
    tempoCategory = "Chill & Relax (Baja Velocidad)";
  }

  // Dominant style classification
  let phonkScore = 0;
  let progressiveScore = 0;
  let chillScore = 0;

  const checkStyle = (title: string, artist: string, factor: number) => {
    const text = `${title} ${artist}`.toLowerCase();
    if (text.includes("phonk") || text.includes("drift")) phonkScore += factor;
    else if (text.includes("faded") || text.includes("chill") || text.includes("relax") || text.includes("intro") || text.includes("midnight")) chillScore += factor;
    else progressiveScore += factor;
  };

  favoritesList.forEach((t) => checkStyle(t.title, t.artist || "", 5));
  historyList.forEach((h) => checkStyle(h.title, h.artist || "", h.playCount));

  let dominantStyle = "EDM Progresivo & House";
  if (phonkScore > progressiveScore && phonkScore > chillScore) {
    dominantStyle = "Drift Phonk & Bass Boosted";
  } else if (chillScore > progressiveScore && chillScore > phonkScore) {
    dominantStyle = "Synthwave, Chillout & Indie";
  }

  const totalPlays = historyList.reduce((acc, curr) => acc + curr.playCount, 0);

  return {
    topArtists,
    preferredBpm,
    tempoCategory,
    dominantStyle,
    totalPlaysCount: totalPlays,
  };
}

// Core Recommendation Engine using advanced affinity scoring
export function getMusicRecommendations(
  poolTracks: MusicTrack[],
  favoritesList: MusicTrack[]
): RecommendedTrack[] {
  if (!poolTracks || poolTracks.length === 0) return [];
  
  const history = getPlayHistory();
  const diagnostics = getTasteDiagnostics(favoritesList);
  
  // Filter unique tracks in pool (dedup by url or id)
  const seen = new Set<string>();
  const uniquePool = poolTracks.filter((track) => {
    const key = track.url || track.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const recommended: RecommendedTrack[] = uniquePool.map((track) => {
    const key = track.url || track.id;
    const itemHistory = history[key];
    
    // Default base score with slight deterministic pseudo-random variation to keep list dynamic
    const strSeed = `${track.title}-${track.artist}`;
    let hash = 0;
    for (let i = 0; i < strSeed.length; i++) {
      hash = strSeed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seedVariation = Math.abs(hash % 10); // 0 to 9 pts
    
    let score = 40 + seedVariation; // Initial safe baseline score
    const reasons: string[] = [];

    // Factor 1: Is in Favorites list? (Highest weight!)
    const isFav = favoritesList.some((t) => {
      const matchId = track.id && t.id === track.id;
      const matchUrl = track.url && t.url === track.url;
      return matchId || matchUrl;
    });

    if (isFav) {
      score += 25;
      reasons.push("Canción en tus Favoritos");
    }

    // Factor 2: Plays count benefit
    if (itemHistory) {
      if (itemHistory.playCount > 0) {
        const playBonus = Math.min(15, itemHistory.playCount * 3);
        score += playBonus;
        reasons.push(`Reproducida frecuentemente (${itemHistory.playCount}x)`);
      }
      
      // Heavy punishment for skips
      if (itemHistory.skipCount > 0) {
        const skipPenalty = Math.min(30, itemHistory.skipCount * 8);
        score -= skipPenalty;
        reasons.push(`Omitida recientemente (-${itemHistory.skipCount}x)`);
      }
    }

    // Factor 3: Artist match benefit
    if (track.artist && diagnostics.topArtists.includes(track.artist)) {
      score += 15;
      reasons.push(`De tu artista favorito: ${track.artist}`);
    }

    // Factor 4: BPM proximity (Gaussian/triangle matching distance to preferred BPM)
    if (track.bpm && diagnostics.preferredBpm) {
      const bpmDistance = Math.abs(track.bpm - diagnostics.preferredBpm);
      if (bpmDistance <= 8) {
        score += 15;
        reasons.push("Tempo óptimo para tu ritmo de escucha");
      } else if (bpmDistance <= 15) {
        score += 8;
        reasons.push("Velocidad de pista compatible");
      } else {
        score -= 5; // Slight mismatch penalty for outliers
      }
    }

    // Factor 5: Title / Style string similarity match with favorite tracks
    let titleKeywordMatch = false;
    const trackLowerTitle = track.title.toLowerCase();
    
    // Check key vibe keywords
    const vibes = ["phonk", "drift", "remix", "faded", "chill", "avicii", "tiësto", "blinding"];
    vibes.forEach((v) => {
      const inTrack = trackLowerTitle.includes(v) || (track.artist?.toLowerCase().includes(v));
      const inFavs = favoritesList.some((f) => f.title.toLowerCase().includes(v) || f.artist?.toLowerCase().includes(v));
      if (inTrack && inFavs) {
        titleKeywordMatch = true;
      }
    });

    if (titleKeywordMatch) {
      score += 10;
      reasons.push("Estilo y vibración similar a tus temas favoritos");
    }

    // Cap score strictly between 15% and 99% (leaving 100% only for a perfect custom match)
    const finalScore = Math.min(99, Math.max(15, score));
    
    // Compile single friendly explanation reason or fallback
    let finalReason = reasons[0] || "Recomendado por sintonía con tu perfil de Flux";
    if (isFav) {
      finalReason = "Tu pista predilecta • Destacada";
    }

    return {
      ...track,
      affinityScore: finalScore,
      affinityReason: finalReason,
    };
  });

  // Sort descending by score, returning top 10 recommended items
  return recommended
    .sort((a, b) => b.affinityScore - a.affinityScore)
    .slice(0, 10);
}
