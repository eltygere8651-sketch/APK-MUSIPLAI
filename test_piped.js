async function test() {
  const instances = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.syncpundit.io',
    'https://piped-api.garudalinux.org',
    'https://pipedapi.privacydev.net'
  ];
  for (const api of instances) {
    try {
      const res = await fetch(`${api}/streams/dQw4w9WgXcQ`);
      const data = await res.json();
      if (data.audioStreams && data.audioStreams.length > 0) {
        console.log("Success with", api);
        console.log(data.audioStreams[0].url.substring(0, 100));
        return;
      }
    } catch(e) {}
  }
  console.log("None worked");
}
test();
