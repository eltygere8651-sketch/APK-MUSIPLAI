const youtubedl = require('youtube-dl-exec');

async function test() {
  try {
    const res = await youtubedl('https://www.youtube.com/watch?v=V4Sg2IpBq5k', {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
    });
    const formats = res.formats || [];
    const target = formats.find(f => f.format_id === '140' || f.format_id === '251');
    if (target) {
      console.log("URL from yt-dlp:", target.url.substring(0, 50));
    } else {
      console.log("No formats found");
    }
  } catch(e) {
    console.error("Error with yt-dlp", e);
  }
}
test();
