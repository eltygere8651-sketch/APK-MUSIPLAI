async function main() {
  const res = await fetch("https://raw.githubusercontent.com/TeamPiped/Piped/main/instances.json");
  const instances = await res.json();
  const urls = instances.map((i: any) => i.api_url);
  
  for (const url of urls) {
    try {
      const start = Date.now();
      const r = await fetch(`${url}/streams/jNQXAC9IVRw`, { signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const text = await r.text();
        if (text.startsWith("{")) {
          const data = JSON.parse(text);
          const m4a = data.audioStreams?.find((s: any) => s.itag === 140);
          if (m4a?.url) {
             console.log("WORKING INSTANCE:", url, "Time:", Date.now() - start);
             return;
          }
        }
      }
    } catch(e) {}
  }
  console.log("No working instance found");
}
main();
