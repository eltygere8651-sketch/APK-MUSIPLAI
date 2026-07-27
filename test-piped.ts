const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.ytmous.com",
  "https://piped.video/api",
];

async function main() {
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}/streams/jNQXAC9IVRw`);
      if (res.ok) {
        const data = await res.json();
        const m4a = data.audioStreams?.find((s: any) => s.itag === 140);
        const webm = data.audioStreams?.find((s: any) => s.itag === 251);
        console.log("Success with", instance);
        console.log("M4A URL:", m4a?.url);
        console.log("WEBM URL:", webm?.url);
        return;
      }
    } catch (e) {
      console.log("Failed", instance);
    }
  }
}
main();
