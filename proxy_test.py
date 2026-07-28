import urllib.request
import subprocess

req = urllib.request.urlopen("https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=5000&country=all&ssl=yes&anonymity=elite")
proxies = req.read().decode('utf-8').strip().split('\r\n')
print(f"Found {len(proxies)} proxies")

for p in proxies[:20]:
    print(f"Testing {p}")
    res = subprocess.run(["./yt-dlp", "--proxy", f"http://{p}", "--dump-json", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"], capture_output=True, text=True)
    if res.returncode == 0:
        print(f"SUCCESS with {p}")
        break
