async function main() {
  try {
    const res = await fetch("https://api.invidious.io/instances.json");
    const instances = await res.json();
    const urls = instances.map((i: any) => i[1].uri);
    console.log(`Found ${urls.length} instances`);
    for (const url of urls) {
      try {
        const r = await fetch(`${url}/api/v1/videos/jNQXAC9IVRw`, { signal: AbortSignal.timeout(3000) });
        if (r.ok) {
          const data = await r.json();
          const m4a = data.adaptiveFormats?.find((f: any) => f.itag === "140");
          if (m4a?.url) {
            console.log("WORKING INSTANCE:", url);
            return;
          }
        }
      } catch (e: any) {
      }
    }
    console.log("No working instance found");
  } catch(e: any) {
    console.log("Error fetching list:", e.message);
  }
}
main();
