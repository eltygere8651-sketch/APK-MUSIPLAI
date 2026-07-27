async function main() {
  try {
    const res = await fetch("https://instances.hyperblack.xyz/instances.json");
    const instances = await res.json();
    const urls = instances.map((i: any) => i.api);
    
    for (const url of urls) {
      try {
        console.log("Testing", url);
        const r = await fetch(`${url}/json`, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
            isAudioOnly: true,
            aFormat: "m4a"
          }),
          signal: AbortSignal.timeout(3000)
        });
        if (r.ok) {
          const data = await r.json();
          if (data.url) {
            console.log("WORKING INSTANCE:", url, data.url.substring(0, 50));
            return;
          }
        }
      } catch (e: any) {
      }
    }
    console.log("No working instance found");
  } catch(e: any) {
    console.log("Failed to fetch list", e.message);
  }
}
main();
