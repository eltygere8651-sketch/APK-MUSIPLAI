async function test() {
  const req = await fetch("https://instances.cobalt.best/api/instances");
  const data = await req.json();
  console.log(data);
}
test();
