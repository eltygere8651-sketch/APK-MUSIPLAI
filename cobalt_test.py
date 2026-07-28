import urllib.request
import json
import time

try:
    req = urllib.request.urlopen("https://instances.cobalt.tools/instances.json")
    # Wait, the URL is probably different or it's a website. Let's see if we can get working cobalt instances from github
except:
    pass
