const PIPED_INSTANCES = [
  "https://api.piped.projectsegfau.lt",
  "https://pipedapi.in.projectsegfau.lt",
  "https://pipedapi.lunar.icu",
];

async function main() {
  for (const instance of PIPED_INSTANCES) {
    try {
      console.log("Testing", instance);
      const res = await fetch(`${instance}/streams/jNQXAC9IVRw`);
      console.log("Status:", res.status);
      if (res.ok) {
        const data = await res.json();
        const m4a = data.audioStreams?.find((s: any) => s.itag === 140);
        const webm = data.audioStreams?.find((s: any) => s.itag === 251);
        console.log("Success with", instance);
        console.log("M4A URL:", !!m4a?.url);
        console.log("WEBM URL:", !!webm?.url);
        
        // Fetch headers to see if it's playable
        if (m4a?.url) {
          const hres = await fetch(m4a.url, { method: "HEAD" });
          console.log("M4A Headers:", hres.status, hres.headers.get("content-type"), hres.headers.get("accept-ranges"));
        }
        return;
      }
    } catch (e: any) {
      console.log("Failed", instance, e.message);
    }
  }
}
main();
