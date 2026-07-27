const ytdl = require('@distube/ytdl-core');

async function test() {
  try {
    const info = await ytdl.getInfo('V4Sg2IpBq5k');
    const formats = info.formats;
    let targetFormat = ytdl.chooseFormat(formats, { quality: '140' }) || ytdl.chooseFormat(formats, { quality: 'highestaudio' });
    if (targetFormat) {
      console.log("URL from ytdl-core:", targetFormat.url.substring(0, 50));
    } else {
      console.log("No formats found");
    }
  } catch(e) {
    console.error("Error with ytdl-core", e);
  }
}
test();
