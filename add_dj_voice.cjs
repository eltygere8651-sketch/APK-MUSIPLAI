const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const newEndpoint = `
app.post("/api/dj/voice", async (req, res) => {
  try {
    const { context } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
    
    const styles = [
      "Cuenta un chiste corto y diferente sobre la actualidad o la música.",
      "Da un dato curioso muy breve sobre un artista o género musical actual.",
      "Haz un comentario gracioso y breve sobre la vida diaria, el clima o la tecnología.",
      "Menciona que la radio es tu mejor compañía de forma rápida y súper natural."
    ];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    
    const prompt = \`\${randomStyle} Eres la locutora estrella de nuestra app de música, llamada F.A.I. No repitas chistes clásicos, sé súper natural, inteligente, actual y breve (máximo 2 oraciones, menos de 10 segundos hablados). El contexto musical actual es: \${context || "variado"}.\`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" } // Using Kore as a good female voice
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      return res.status(500).json({ error: "No audio generated" });
    }
    
    res.json({ audio: base64Audio });
  } catch (err: any) {
    const errorMsg = err?.message || "Rate limit or generation error";
    if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      console.warn("DJ AI Voice Quota reached.");
      return res.status(429).json({ error: "Límite de cuota de IA alcanzado." });
    }
    console.error("DJ AI Voice Error:", errorMsg);
    res.status(500).json({ error: errorMsg });
  }
});

async function startServer() {`;

code = code.replace(/async function startServer\(\) \{/, newEndpoint);
fs.writeFileSync('server.ts', code);
