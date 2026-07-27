async function main() {
  const instances = [
    "https://vid.puffyan.us",
    "https://invidious.flokinet.to",
    "https://yewtu.be",
    "https://invidious.projectsegfau.lt",
    "https://invidious.nerdvpn.de",
    "https://inv.tux.pizza"
  ];
  
  for (const instance of instances) {
    try {
      console.log("Testing Invidious:", instance);
      const res = await fetch(`${instance}/api/v1/videos/jNQXAC9IVRw`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        const m4a = data.adaptiveFormats?.find((f: any) => f.itag === "140");
        if (m4a?.url) {
          console.log("SUCCESS:", instance, m4a.url.substring(0, 100));
          return;
        }
      }
    } catch(e: any) {
      console.log("Failed:", instance);
    }
  }
}
main();
