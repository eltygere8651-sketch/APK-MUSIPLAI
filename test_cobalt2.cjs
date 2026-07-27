async function test() {
  try {
    const res = await fetch("https://api.cobalt.tools", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: "https://www.youtube.com/watch?v=V4Sg2IpBq5k",
        isAudioOnly: true,
        aFormat: "mp3"
      })
    });
    console.log(res.status);
    const data = await res.json();
    console.log(data);
  } catch(e) {
    console.error(e);
  }
}
test();
