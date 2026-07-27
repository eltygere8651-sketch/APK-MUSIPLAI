async function test() {
  const req = await fetch("https://raw.githubusercontent.com/TeamPiped/Piped-Instances/main/instances.json");
  if (req.ok) {
     const instances = await req.json();
     for (const i of instances) {
        if(i.api_url) console.log(i.api_url);
     }
  }
}
test();
