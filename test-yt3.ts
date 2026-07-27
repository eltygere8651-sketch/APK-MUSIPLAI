import { Innertube } from "youtubei.js";

async function main() {
  const yt = await Innertube.create();
  
  const clients = ['IOS', 'WEB_EMBEDDED', 'TV_EMBEDDED', 'YTMUSIC_ANDROID', 'TV', 'MWEB'];
  for (const client of clients) {
    try {
      console.log("Testing client:", client);
      const info = await yt.getInfo("jNQXAC9IVRw", { client: client as any });
      console.log("Playability:", info.playability_status?.status);
      const m4a = info.streaming_data?.adaptive_formats?.find((f: any) => f.itag === 140);
      if (m4a?.url || m4a?.decipher?.(yt.session.player)) {
         console.log("SUCCESS!", client);
         return;
      }
    } catch(e: any) {
      console.log("Error:", e.message);
    }
  }
}
main().catch(console.error);
