import { Innertube } from "youtubei.js";

async function main() {
  const yt = await Innertube.create({ generate_session_locally: true });
  const info = await yt.getInfo("jNQXAC9IVRw");
  console.log(info.playability_status);
}
main().catch(console.error);
