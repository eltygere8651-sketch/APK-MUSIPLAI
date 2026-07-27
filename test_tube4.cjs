const { Innertube } = require('youtubei.js');
async function test() {
  const clients = ['WEB_EMBEDDED', 'WEB_KIDS', 'TV', 'MWEB', 'ANDROID_VR', 'TV_SIMPLY'];
  for (const client of clients) {
    try {
      const yt = await Innertube.create({ generate_session_locally: true, clientType: client });
      const info = await yt.getInfo('V4Sg2IpBq5k');
      const formats = info.streaming_data?.adaptive_formats || [];
      console.log(`Client: ${client} -> Formats: ${formats.length}`);
    } catch(e) {
      console.log(`Client: ${client} -> Error: ${e.message.substring(0, 100)}`);
    }
  }
}
test();
