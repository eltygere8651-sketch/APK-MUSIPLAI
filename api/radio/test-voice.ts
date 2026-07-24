export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  // CORS Headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-elevenlabs-api-key, x-elevenlabs-voice-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const elApiKey = (req.headers["x-elevenlabs-api-key"] as string) || process.env.ELEVENLABS_API_KEY;
    const elVoiceId = (req.headers["x-elevenlabs-voice-id"] as string) || process.env.ELEVENLABS_VOICE_ID || "jBpfuIE2acCO8zBIW8W7";

    if (!elApiKey || !elApiKey.trim()) {
      return res.status(400).json({ valid: false, error: "No se ha proporcionado la API Key de ElevenLabs." });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${elVoiceId}`, {
      headers: {
        "xi-api-key": elApiKey.trim(),
        "accept": "application/json"
      }
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({ valid: true, name: data.name, category: data.category });
    } else {
      const errBody = await response.text();
      let parsedErr = "Error de ElevenLabs";
      try {
        const parsed = JSON.parse(errBody);
        parsedErr = parsed.detail?.message || parsed.message || errBody;
      } catch (e) {
        parsedErr = errBody || `Status ${response.status}`;
      }
      return res.status(response.status).json({ valid: false, error: parsedErr });
    }
  } catch (err: any) {
    return res.status(500).json({ valid: false, error: err?.message || String(err) });
  }
}
