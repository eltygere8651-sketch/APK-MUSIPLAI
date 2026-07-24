export const isReasonableTrack = (duration: string | undefined | null, title: string | undefined | null): boolean => {
  if (!duration || duration === "N/A" || duration === "0:00") return false;
  const parts = duration.split(":");
  if (parts.length >= 3) return false; // 1 hour or more is too long
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (mins > 8) return false; // More than 8 minutes is likely a compilation/mix
    if (mins === 0 && secs < 50) return false; // Less than 50 seconds is a short/intro
  } else if (parts.length === 1) {
    return false; // usually just seconds, definitely a short
  }
  
  if (title) {
    const t = title.toLowerCase();
    // Rejects compilations, megamixes, mashups, hour-long mixes
    if (
      t.includes("compilation") || 
      t.includes("mashup") || 
      t.includes("megamix") || 
      t.includes("1 hour") || 
      t.includes("1 hora") ||
      t.includes("10 hours") ||
      t.includes("best of") ||
      t.includes("mix 202") || 
      t.includes("mix 201")
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
