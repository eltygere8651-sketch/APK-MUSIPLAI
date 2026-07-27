async function main() {
  const r = await fetch("https://music.youtube.com/watch?v=jNQXAC9IVRw");
  const html = await r.text();
  const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/);
  if (match) {
    const data = JSON.parse(match[1]);
    console.log(data.playabilityStatus?.status);
    const m4a = data.streamingData?.adaptiveFormats?.find((f: any) => f.itag === 140);
    console.log("M4A:", !!m4a?.url);
    if (m4a?.url) console.log(m4a.url.substring(0, 50));
  } else {
    console.log("No match");
  }
}
main();
