import { GoogleGenAI } from "@google/genai";

export const config = { runtime: "nodejs" };

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { message, history, inventory } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key is not configured on the server. Please add it in Vercel Project Settings → Environment Variables." });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const inventoryContext = Array.isArray(inventory) && inventory.length > 0
      ? `\n\nCURRENT VERIFIED INVENTORY (Direct from Owners):\n${JSON.stringify(inventory, null, 2)}`
      : "";

    const systemInstruction = `You are "NestDirect Guru", a high-end Chennai rental advisor and real estate AI. 
Help users navigate the Chennai rental scene (localities like Adyar, Mylapore, OMR, Velachery, Besant Nagar, Sholinganallur).
Explain how to bypass the standard 1-month brokerage fee, negotiate security deposits, verify landlord listings, prepare documentation, and plan commutes.

If users ask for recommendations or specific properties, refer to the following inventory. Always explain that these are direct-to-owner listings with zero brokerage fee.${inventoryContext}

Keep your answers beautifully structured, scannable, professional, and Chennai-savvy. Use elegant bullet points and formatting. Highlight the active, direct-to-owner benefits of NestDirect.`;

    const formattedContents = [
      ...(Array.isArray(history) ? history.map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.text }]
      })) : []),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    let attempts = 0;
    const maxAttempts = 3;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.7,
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: 13.0827,
                  longitude: 80.2707
                }
              }
            }
          }
        });

        const replyText = response.text || "I was unable to generate a detailed response. Please try reframing your question.";
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;
        return res.status(200).json({ reply: replyText, groundingMetadata });
      } catch (error: any) {
        lastError = error;
        attempts++;

        const isRetryable = error.message?.includes("503") ||
          error.message?.includes("high demand") ||
          error.message?.includes("UNAVAILABLE");

        if (isRetryable && attempts < maxAttempts) {
          const delay = Math.pow(2, attempts) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        break;
      }
    }

    throw lastError;
  } catch (error: any) {
    console.error("Gemini Real-Estate Guru Server Error:", error);

    if (error.message?.includes("503") || error.message?.includes("high demand")) {
      return res.status(503).json({
        error: "The Real-Estate Guru is currently handling high volume from other Chennai users. Please try sending your message again in a few seconds."
      });
    }

    res.status(500).json({ error: error.message || "Failed to communicate with Chennai Real-Estate Guru." });
  }
}
