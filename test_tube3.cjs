const { Innertube } = require('youtubei.js');
async function test() {
  const clients = ['WEB', 'ANDROID', 'YTMUSIC', 'WEB_REMIX', 'IOS', 'TV_EMBEDDED'];
  for (const client of clients) {
    try {
      const yt = await Innertube.create({ generate_session_locally: true, clientType: client });
      const info = await yt.getInfo('V4Sg2IpBq5k');
      const formats = info.streaming_data?.adaptive_formats || [];
      console.log(`Client: ${client} -> Formats: ${formats.length}`);
      const target = formats.find(f => f.itag === 140 || f.itag === 251);
      if (target) {
         const url = target.url || (target.decipher ? target.decipher(yt.session.player) : null);
         if (url) {
             console.log(`  Got URL!`);
         }
      }
    } catch(e) {
      console.log(`Client: ${client} -> Error: ${e.message.substring(0, 100)}`);
    }
  }
}
test();
