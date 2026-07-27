const { Innertube } = require('youtubei.js');
async function test() {
  const yt = await Innertube.create();
  try {
    const info = await yt.getInfo('V4Sg2IpBq5k');
    const formats = info.streaming_data?.adaptive_formats || [];
    console.log("Formats available:", formats.map(f => f.itag));
    
    let targetFormat = formats.find((f) => f.itag === 140) || formats.find(f => f.itag === 251);
    if (targetFormat) {
      console.log("Found:", targetFormat.itag);
      const url = targetFormat.url || (targetFormat.decipher ? targetFormat.decipher(yt.session.player) : null);
      console.log("URL:", url ? "Yes" : "No");
    } else {
        console.log("No audio formats found.");
    }
  } catch (e) {
    console.error("Innertube error:", e);
  }
}
test();
