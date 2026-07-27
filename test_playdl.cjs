const play = require('play-dl');
async function test() {
  try {
    const info = await play.video_info('V4Sg2IpBq5k');
    const formats = info.format;
    let targetFormat = formats.find(f => f.itag === 140);
    console.log("Play-dl M4A:", targetFormat.url);
  } catch(e) {
    console.error("play-dl error:", e);
  }
}
test();
