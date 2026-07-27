async function main() {
  try {
    const res = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Origin": "https://cobalt.tools",
        "Referer": "https://cobalt.tools/"
      },
      body: JSON.stringify({
        url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
        isAudioOnly: true,
        aFormat: "m4a"
      })
    });
    const data = await res.json();
    console.log(data);
  } catch(e: any) {
    console.log("Error:", e.message);
  }
}
main();
