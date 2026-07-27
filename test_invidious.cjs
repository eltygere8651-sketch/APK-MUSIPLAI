async function test() {
  try {
    const res = await fetch("https://api.invidious.io/instances.json");
    const instances = await res.json();
    for (const item of instances) {
      const url = item[1].uri;
      if (item[1].api) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const r = await fetch(url + "/api/v1/videos/V4Sg2IpBq5k", { signal: controller.signal });
          clearTimeout(timeoutId);
          if (r.ok) {
             const info = await r.json();
             if (info.formatStreams && info.formatStreams.length > 0) {
               console.log("Working instance:", url);
             }
          }
        } catch(e) {}
      }
    }
    console.log("Done");
  } catch(e) { console.error(e); }
}
test();
