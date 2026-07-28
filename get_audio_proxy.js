const { spawnSync } = require('child_process');
const fs = require('fs');

async function testProxies() {
  console.log("Fetching proxies...");
  const res = await fetch("https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all");
  const text = await res.text();
  const proxies = text.split("\n").map(p => p.trim()).filter(p => p);
  console.log(`Found ${proxies.length} proxies.`);
  
  for (const proxy of proxies.slice(0, 20)) {
    console.log(`Testing ${proxy}...`);
    const p = spawnSync('./yt-dlp', ['--proxy', `http://${proxy}`, '--dump-json', '--max-time', '15', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ']);
    if (p.status === 0) {
      console.log(`Success with proxy ${proxy}`);
      return;
    }
  }
}
testProxies().catch(console.error);
