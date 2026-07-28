async function go() {
  const uri = "https://api.piped.private.coffee";
  const res = await fetch(`${uri}/streams/dQw4w9WgXcQ`);
  const data = await res.json();
  const audio = data.audioStreams.find(s => s.mimeType === "audio/webm" || s.mimeType === "audio/mp4" || s.mimeType === "audio/mpeg");
  console.log("Audio URL:", audio.url.substring(0, 50));
  
  const streamRes = await fetch(audio.url, { method: 'HEAD' });
  console.log("Stream CORS:", streamRes.headers.get('access-control-allow-origin'));
}
go();
