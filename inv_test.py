import urllib.request
import json
import time

try:
    req = urllib.request.urlopen("https://api.invidious.io/instances.json")
    instances = json.loads(req.read().decode('utf-8'))

    for inst in instances:
        uri = inst[1]['uri']
        try:
            url = f"{uri}/api/v1/videos/dQw4w9WgXcQ"
            print(f"Testing {url}")
            req_inst = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            res = urllib.request.urlopen(req_inst, timeout=5)
            data = json.loads(res.read().decode('utf-8'))
            if 'formatStreams' in data:
                print(f"SUCCESS: {uri}")
        except Exception as e:
            print(f"Failed {uri}: {e}")
except Exception as e:
    print(e)
