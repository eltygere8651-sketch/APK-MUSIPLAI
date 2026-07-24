const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const oldJokeCatch = `  } catch (err: any) {
    console.error("DJ AI Joke Error:", err?.message || "Rate limit or generation error");
    res.status(500).json({ error: err?.message || "Failed to generate DJ joke" });
  }`;

const newJokeCatch = `  } catch (err: any) {
    const errorMsg = err?.message || "Rate limit or generation error";
    if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      console.warn("DJ AI Joke Quota reached.");
      return res.status(429).json({ error: "Límite de cuota de IA alcanzado. Por favor, inténtalo de nuevo en un minuto." });
    }
    console.error("DJ AI Joke Error:", errorMsg);
    res.status(500).json({ error: errorMsg });
  }`;

code = code.replace(oldJokeCatch, newJokeCatch);

const oldTestCatch = `  } catch (err: any) {
    console.error("DJ AI Test Voice Error:", err?.message || "Rate limit or generation error");
    res.status(500).json({ error: err?.message || "Failed to generate test voice" });
  }`;

const newTestCatch = `  } catch (err: any) {
    const errorMsg = err?.message || "Rate limit or generation error";
    if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
      console.warn("DJ AI Test Voice Quota reached.");
      return res.status(429).json({ error: "Límite de cuota de IA alcanzado. Por favor, inténtalo de nuevo en un minuto." });
    }
    console.error("DJ AI Test Voice Error:", errorMsg);
    res.status(500).json({ error: errorMsg });
  }`;

code = code.replace(oldTestCatch, newTestCatch);

fs.writeFileSync('server.ts', code);
