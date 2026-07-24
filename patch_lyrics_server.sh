sed -i '/async function startServer()/i \
app.get("/api/lyrics/search", async (req, res) => {\
  try {\
    const query = req.query.q as string;\
    if (!query) {\
      return res.status(400).json({ error: "Missing query" });\
    }\
    const response = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);\
    if (!response.ok) {\
      return res.status(response.status).json({ error: "Failed to fetch from lrclib" });\
    }\
    const data = await response.json();\
    return res.json(data);\
  } catch (error) {\
    console.error("Lyrics proxy error:", error);\
    return res.status(500).json({ error: "Internal server error" });\
  }\
});\
' server.ts
