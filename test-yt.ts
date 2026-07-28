import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  const ytClient = await Innertube.create({ cache: new UniversalCache(false) });
  try {
    const info = await ytClient.getBasicInfo('jNQXAC9IVRw');
    console.log("Title:", info.basic_info.title);
    
    // Test download stream creation
    const stream = await ytClient.download('jNQXAC9IVRw', {
      type: 'audio',
      quality: 'best',
      format: 'any'
    });
    console.log("Got stream");
  } catch (e) {
    console.error("Error", e);
  }
}
test();
