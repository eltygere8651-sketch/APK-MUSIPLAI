import { Innertube } from "youtubei.js";

const PIPED_INSTANCES = [
  "https://api.piped.projectsegfau.lt",
  "https://pipedapi.in.projectsegfau.lt",
  "https://pipedapi.lunar.icu",
];

async function main() {
  const videoId = "jNQXAC9IVRw";
  let yt = await Innertube.create({ generate_session_locally: true });
  
  try {
    const info = await yt.getInfo(videoId);
    const formats = info.streaming_data?.adaptive_formats || [];
    
    let targetFormat = formats.find((f: any) => f.itag === 140);
    if (!targetFormat) {
      targetFormat = formats.find((f: any) => f.itag === 251);
    }
    
    if (targetFormat) {
      const audioUrl = targetFormat.url || (targetFormat.decipher ? targetFormat.decipher(yt.session.player) : null);
      if (audioUrl) {
         console.log("Found in youtubei:", audioUrl.substring(0, 50));
         return;
      }
    }
  } catch (e: any) {
    console.log("yt info error:", e.message);
  }
  
  for (const instance of PIPED_INSTANCES) {
    try {
      const pRes = await fetch(`${instance}/streams/${videoId}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        const pFormats = pData.audioStreams || [];
        let pTarget = pFormats.find((f: any) => f.itag === 140);
        if (!pTarget) pTarget = pFormats.find((f: any) => f.itag === 251);
        
        if (pTarget && pTarget.url) {
           console.log("Found in piped:", pTarget.url.substring(0, 50));
           return;
        }
      }
    } catch (err) {
    }
  }
  
  console.log("NO_AUDIO_STREAM_FOUND");
}
main();
