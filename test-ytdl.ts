import ytdl from '@distube/ytdl-core';

async function main() {
  try {
    const info = await ytdl.getInfo("jNQXAC9IVRw");
    const m4a = ytdl.chooseFormat(info.formats, { quality: '140' });
    console.log("M4A:", !!m4a?.url);
    const webm = ytdl.chooseFormat(info.formats, { quality: '251' });
    console.log("WEBM:", !!webm?.url);
    if (m4a?.url) {
      console.log(m4a.url.substring(0, 50));
    }
  } catch (e: any) {
    console.log("Error:", e.message);
  }
}
main();
