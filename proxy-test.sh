curl -s "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt" | head -n 50 > proxies.txt
while read p; do
  echo "Testing proxy $p"
  if curl -s --proxy "http://$p" --max-time 3 "https://www.youtube.com/watch?v=dQw4w9WgXcQ" | grep -q "title"; then
    echo "Found working proxy: $p"
    ./yt-dlp -v --proxy "http://$p" 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' --dump-json | grep title && break
  fi
done < proxies.txt
