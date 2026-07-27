async function test() {
  try {
    const res = await fetch("https://piped-instances.kavin.rocks/");
    const data = await res.json();
    const urls = data.map(d => d.api_url);
    for (const url of urls) {
      if(!url) continue;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const r = await fetch(url + "/streams/V4Sg2IpBq5k", { signal: controller.signal });
        clearTimeout(timeoutId);
        if (r.ok) {
           const info = await r.json();
           if (info.audioStreams && info.audioStreams.length > 0) {
             console.log("Working instance:", url);
           }
        }
      } catch(e) {}
    }
    console.log("Done");
  } catch(e) { console.error(e); }
}
test();
