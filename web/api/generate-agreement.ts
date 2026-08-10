import { GoogleGenAI } from "@google/genai";

export const config = { runtime: "nodejs" };

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { propertyTitle, rent, deposit, tenantName, ownerName, durationMonths, customClauses } = req.body;
    if (!propertyTitle || !rent || !tenantName) {
      return res.status(400).json({ error: "Property title, Rent, and Tenant Name are required." });
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

    const prompt = `Draft a professional, legally-rigorous peer-to-peer Residential Rent Agreement for a property in Chennai, Tamil Nadu under the Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act.
      
      Details:
      - Property / Asset: ${propertyTitle}
      - Landlord / Owner Name: ${ownerName || "Direct Owner"}
      - Tenant Name: ${tenantName}
      - Monthly Rent: ₹${rent.toLocaleString()}/month (Direct settlement, zero agency commission)
      - Security Deposit: ₹${deposit ? deposit.toLocaleString() : "Not Specified"}
      - Lease Term / Duration: ${durationMonths || 11} Months
      - Custom Clauses / Special Terms: ${customClauses || "Standard peaceable enjoyment, no commercial subletting, pet-friendly."}

      Ensure it includes:
      1. A "PEER-TO-PEER CLAUSE" explicitly stating that no brokers, intermediaries, or agency commissions are involved or due.
      2. Clear deposit security refund guidelines upon handover at lease completion.
      3. Formal legalese structure with section headings (Rent Payment, Maintenance, Tenure, Covenants).
      4. Placeholders for signatures of both parties.
      
      Format with elegant typography, spacing, and structured clauses. Output only the final document text without any markdown fence brackets (like \`\`\`markdown or similar).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    const replyText = response.text || "Failed to generate agreement draft. Please try again.";
    return res.status(200).json({ agreement: replyText });
  } catch (error: any) {
    console.error("Gemini Agreement Generator Server Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate rent agreement draft." });
  }
}
