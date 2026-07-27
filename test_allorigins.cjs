const { Innertube } = require('youtubei.js');

async function test() {
  const originalFetch = globalThis.fetch;
  const proxyFetch = async (input, init) => {
    let url = typeof input === 'string' ? input : input.url;
    url = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
    return originalFetch(url, init);
  };

  try {
    const yt = await Innertube.create({ 
       fetch: proxyFetch,
       generate_session_locally: true 
    });
    const info = await yt.getInfo('V4Sg2IpBq5k');
    const formats = info.streaming_data?.adaptive_formats || [];
    console.log("Formats:", formats.length);
  } catch(e) {
    console.error("Error:", e.message.substring(0, 200));
  }
}
test();
