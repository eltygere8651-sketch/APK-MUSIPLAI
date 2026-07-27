import play from 'play-dl';

async function main() {
  try {
    const info = await play.video_info("jNQXAC9IVRw");
    const m4a = info.format.find(f => f.itag === 140);
    const webm = info.format.find(f => f.itag === 251);
    console.log("M4A:", m4a?.url);
    console.log("WEBM:", webm?.url);
  } catch(e: any) {
    console.log("Error:", e.message);
  }
}
main();
