export const maxDuration = 60;
import { GoogleGenAI } from "@google/genai";

const SOFIA_WELCOME_PHRASES = [
  "¡Qué pasa! 🔥 Soy Sofía DJ. Traigo un set de locos, ¡sube el volumen y dale mambo! ⚡️",
  "¡Ey! ⚡️ Soy Sofía. Hoy solo pelotazos que rompen en TikTok. ¡A tope! 🎧",
  "¡Buenas! 👋 Prepárate para el subidón. ¡Soy Sofía DJ and esto va a arder! 🔥",
  "¡Al loro gente! 🎧 Sofía en directo con lo más gordo. ¡Let's go! 🚀",
  "¡Wassup! 🚀 Soy Sofía DJ. Menudo arsenal de graves traigo hoy. ¡Dale caña! 🔊",
  "¡Boom! 💯 Sofía DJ al aparato. Solo lo mejor de lo mejor. ¡Fuego puro! 🔥",
  "¿Habéis visto lo último de Rosalía? ✨ ¡Vaya locura! Pero para locura, el set que os traigo. ¡Dale! 🎧",
  "¡Oye! Que dice Bizarrap que ya no sabe qué número ponerle a la siguiente... 🔥 ¡Mientras, disfruta esto! 🚀",
  "¡Hola, hola! 👋 ¿Buscando el trend de TikTok? Aquí lo tienes todo antes que nadie. ¡Siente el beat! 🔊",
  "¡Fuego puro! 🔥 Ni la inteligencia artificial pincha tan bien como yo. ¡Atento a lo que viene! ⚡️",
  "¡Buenas! 👋 Dicen que el house ha vuelto, pero yo digo que nunca se fue. ¡Escucha este pelotazo! 🎧",
  "¡Wassup! 🚀 No te rayes con el algoritmo, aquí mando yo. ¡Sube los graves que despegamos! 🔥",
  "¡Ey! ⚡️ ¿Listos para el salseo? Hoy pinchamos lo más top de España y del mundo entero. ¡Dale mambo! 🔊",
  "¡Boom! 💯 Sofía DJ. Menudo meme es la vida, pero esta música es cosa seria. ¡A tope! 🚀",
  "¡Qué pasa! 🔥 ¿Has escuchado lo nuevo de Quevedo? ¡Es canela en rama! Pero ojo a lo que traigo... ⚡️",
  "¡Al loro! 🎧 Que si el rímel, que si el maquillaje... ¡Aquí lo que importa es el ritmo! ¡Fuego! 🔥",
  "¡Hola! 👋 Sofía DJ al mando. Olvida los problemas y que la música hable por ti. ¡Let's go! 🚀",
  "¡Ey, familia! ⚡️ Traigo más energía que un vídeo de gatitos viral. ¡Sube el volumen ya! 🔊",
  "¡Fuego! 🔥 ¿Sabías que Rauw ya está en otra galaxia? ¡Pues nosotros vamos detrás! 🚀",
  "¡Oye! 🎧 No aceptes imitaciones, la Sofía auténtica está aquí con los hits más frescos. ¡Dale! ⚡️",
  "¡Wassup! 🔥 ¿Has visto el último beef en Twitter? 🐦 Aquí preferimos el buen rollo y los bajos potentes. ¡Dale! 🔊",
  "¡Boom! 🚀 Sofía DJ. Traigo un ritmo tan pegadizo que hasta tu abuela va a querer perrear. ¡Dale mambo! 💃",
  "¡Ey! ⚡️ ¿Listos para el salseo máximo? Hoy pinchamos los temas que están rompiendo todos los récords. ¡Let's go! 🎧",
  "¡Buenas! 👋 Soy Sofía. He filtrado lo mejor de las tendencias para que tú solo disfrutes. ¡Siente la vibra! 🔥",
  "¡Fuego! 💯 ¿Quién dijo miedo? Aquí venimos a por todas. ¡Sube el volumen que esto revienta! 🔊",
  "¡Hola, hola! ✨ Sofía al aparato. Prepárate porque lo que viene te va a dejar loquísimo. ¡A tope! ⚡️",
  "¡Oye! 🎧 Que dice el DJ de la acera de enfrente que quiere mi set... ¡Ni en sueños! ¡Disfruta esto! 🔥",
  "¡Al loro! 🚀 Sofía DJ pinchando en exclusiva lo que va a sonar mañana en todas partes. ¡Adelántate! 🔊",
  "¡Wassup! 👋 ¿Energía al 100%? Si no la tienes, te la pongo yo con este pelotazo. ¡Dale caña! ⚡️",
  "¡Boom! 🔥 Soy Sofía y hoy no acepto un no por respuesta. ¡Baila como si nadie te viera! 💃",
  "¡Ey! ⚡️ ¿Habéis visto a Bad Bunny con el pelo así? 🐰 Vaya pintas, pero vaya temazos se marca. ¡Subidón! 🚀",
  "¡Fuego! 🔥 Dicen que la inteligencia artificial nos va a quitar el trabajo... ¡pero nadie pincha con tanto flow como yo! 🎧",
  "¡Oye! 🔊 ¿Buscando el trend de TikTok? Aquí lo tienes antes de que sea viral. ¡Dale mambo! ⚡️",
  "¡Wassup! 🚀 Se viene salseo del bueno. Ni en los mejores hilos de Twitter vas a encontrar este ritmo. 🔥",
  "¡Buenas! 👋 Sofía DJ al mando. ¿Sabías que el reggaetón es la nueva religión? Pues aquí somos muy devotos. 🔊",
  "¡Boom! 💯 Si te sientes un poco meme hoy, no te preocupes, esta música te arregla el día. ¡Let's go! 🚀",
  "¡Al loro! 🎧 ¿Has visto el video viral del gatito DJ? 🐈 Pues yo soy la versión humana y con más graves. ¡Dale! ⚡️",
  "¡Hola, hola! 👋 Ni Shakira tiene tantas ganas de revancha como yo de pinchar este pelotazo. 🔥",
  "¡Ey! ⚡️ Olvídate del algoritmo y sintoniza a la verdadera jefa. ¡Sofía DJ en directo! 🔊"
];

const welcomeAudioCache: Record<string, string> = {};

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
    const index = Math.floor(Math.random() * SOFIA_WELCOME_PHRASES.length);
    const selectedText = SOFIA_WELCOME_PHRASES[index];

    // Extract dynamic keys if sent from frontend
    const elApiKey = (req.headers["x-elevenlabs-api-key"] as string) || process.env.ELEVENLABS_API_KEY;
    const elVoiceId = (req.headers["x-elevenlabs-voice-id"] as string) || process.env.ELEVENLABS_VOICE_ID || "jBpfuIE2acCO8zBIW8W7";

    const cacheKey = `${index}_${elVoiceId}`;

    if (welcomeAudioCache[cacheKey]) {
      return res.json({ text: selectedText, audio: welcomeAudioCache[cacheKey] });
    }

    // Attempt ElevenLabs if the API Key is defined
    if (elApiKey) {
      try {
        const elResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elVoiceId}`, {
          method: "POST",
          headers: {
            "xi-api-key": elApiKey,
            "Content-Type": "application/json",
            "accept": "audio/mpeg"
          },
          body: JSON.stringify({
            text: selectedText,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.35,
              similarity_boost: 0.85,
              style: 0.45,
              use_speaker_boost: true
            }
          })
        });

        if (elResponse.ok) {
          const arrayBuffer = await elResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Audio = "data:audio/mpeg;base64," + buffer.toString("base64");
          welcomeAudioCache[cacheKey] = base64Audio;
          return res.json({ text: selectedText, audio: base64Audio });
        }
      } catch (elErr) {
        console.error("[Diagnostic] ElevenLabs fetch exception:", elErr);
      }
    }

    // Fallback to Gemini 3.1 TTS if ElevenLabs key is not set or failed
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-8b",
      contents: [{
        parts: [{
          text: `Please speak the following text with an extremely energetic, high-tempo, youthful, fast-paced (under 8 seconds), cool and exciting female music DJ voice ("cañera a tope"). Use a modern, enthusiastic, and fast tempo, with a bright, dynamic Gen-Z vibe. Absolutely natural inflection, zero robotism, like a professional FM radio DJ or club host. Speak in native Spanish (Spain) with maximum power, punchy delivery, and excitement: ${selectedText}`
        }]
      }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" }
          }
        }
      }
    });

    const rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    let wavBase64: string | null = null;
    if (rawBase64) {
      const pcmBuffer = Buffer.from(rawBase64, "base64");
      const sampleRate = 24000;
      const numChannels = 1;
      const wavBuffer = Buffer.alloc(44 + pcmBuffer.length);
      wavBuffer.write('RIFF', 0);
      wavBuffer.writeUInt32LE(36 + pcmBuffer.length, 4);
      wavBuffer.write('WAVE', 8);
      wavBuffer.write('fmt ', 12);
      wavBuffer.writeUInt32LE(16, 16); 
      wavBuffer.writeUInt16LE(1, 20); 
      wavBuffer.writeUInt16LE(numChannels, 22);
      wavBuffer.writeUInt32LE(sampleRate, 24);
      wavBuffer.writeUInt32LE(sampleRate * numChannels * 2, 28); 
      wavBuffer.writeUInt16LE(numChannels * 2, 32); 
      wavBuffer.writeUInt16LE(16, 34); 
      wavBuffer.write('data', 36);
      wavBuffer.writeUInt32LE(pcmBuffer.length, 40);
      pcmBuffer.copy(wavBuffer, 44);
      
      wavBase64 = "data:audio/wav;base64," + wavBuffer.toString("base64");
      welcomeAudioCache[index.toString()] = wavBase64;
    }

    res.json({ text: selectedText, audio: wavBase64 || null });
  } catch (err: any) {
    // Final fallback to Google Translate TTS or just text
    try {
      const index = Math.floor(Math.random() * SOFIA_WELCOME_PHRASES.length);
      const selectedText = SOFIA_WELCOME_PHRASES[index];
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=es&client=tw-ob&q=${encodeURIComponent(selectedText)}`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = "data:audio/mpeg;base64," + buffer.toString("base64");
        return res.json({ text: selectedText, audio: base64Audio });
      }
    } catch (fallbackErr) {}
    
    const index = Math.floor(Math.random() * SOFIA_WELCOME_PHRASES.length);
    res.json({ text: SOFIA_WELCOME_PHRASES[index], audio: null });
  }
}
