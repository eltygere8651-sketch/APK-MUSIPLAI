const isReasonableTrack = (duration, title) => {
  if (!duration || duration === "N/A") return false;
  const parts = duration.split(":");
  if (parts.length >= 3) return false; // 1 hour or more
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (mins > 8) return false; // More than 8 minutes is likely a compilation/mix
    if (mins === 0 && secs < 60) return false; // Less than 1 minute is a short
  } else if (parts.length === 1) {
    return false; // usually "seconds"
  }
  
  if (title) {
    const t = title.toLowerCase();
    if (t.includes("mix") || t.includes("compilation") || t.includes("mashup") || t.includes("megamix") || t.includes("remis")) {
      // allow official remixes? user said "sin mierdas de remis de compilaciones", meaning bad remixes of compilations.
      // Let's just block "compilation", "mashup", "megamix" and strict "mix".
      if (t.includes("compilation") || t.includes("mashup") || t.includes("megamix") || t.includes("1 hour") || t.includes("1 hora")) return false;
      // if it has "mix" but not "remix"?
      if (t.includes(" mix") || t.includes("mix ") || t === "mix") return false;
    }
  }
  return true;
};
