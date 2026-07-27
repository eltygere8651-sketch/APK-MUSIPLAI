const { Innertube } = require('youtubei.js');
async function test() {
  const yt = await Innertube.create();
  try {
    const info = await yt.getInfo('V4Sg2IpBq5k');
    const formats = info.streaming_data?.adaptive_formats || [];
    let targetFormat = formats.find((f) => f.itag === 140);
    if (targetFormat) {
      console.log("M4A:", targetFormat.url || (targetFormat.decipher ? targetFormat.decipher(yt.session.player) : null));
    }
  } catch (e) {
    console.error("Innertube error:", e);
  }
}
test();
