import { Innertube } from "youtubei.js";

async function main() {
  const yt = await Innertube.create({ 
    generate_session_locally: true,
  });
  
  // try different client
  yt.session.context.client.clientName = 'ANDROID_TESTSUITE';
  
  const info = await yt.getInfo("jNQXAC9IVRw", "ANDROID");
  console.log(info.playability_status);
  
  if (info.streaming_data) {
    const formats = info.streaming_data?.adaptive_formats || [];
    const m4a = formats.find((f: any) => f.itag === 140);
    if (m4a) {
      console.log("M4A URL:", m4a.url || m4a.signature_cipher);
      console.log("Deciphered:", m4a.decipher(yt.session.player));
    }
  }
}
main().catch(console.error);
