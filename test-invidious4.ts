async function main() {
  const r = await fetch("https://api.invidious.io/instances.json?sort_by=health");
  const data = await r.json();
  const instances = data.map((d: any) => d[1].uri);
  console.log("Found", instances.length);
  for (const uri of instances.slice(0, 5)) {
     try {
       const res = await fetch(`${uri}/api/v1/videos/jNQXAC9IVRw`);
       if (res.ok) {
         const json = await res.json();
         if (json.formatStreams || json.adaptiveFormats) {
           console.log("WORKING:", uri);
           return;
         }
       }
     } catch(e) {}
  }
}
main();
