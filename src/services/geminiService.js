import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

export const parseUserIntent = async (userInput) => {
  const lowerInput = userInput.toLowerCase();

  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" }, { apiVersion: "v1beta" });
    const systemInstruction = `Sen bir Billing Assistant'sın. JSON dön: {"intent": "QUERY_BILL", "parameters": {"month": "January"}}`;
    const prompt = `${systemInstruction}\n\nKullanıcı: ${userInput}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Gemini Error:", error);
    
    // --- MANUEL FALLBACK (Hatanın Çözüldüğü Yer) ---
    // Ayı en başta bir kez belirliyoruz ki tüm kontroller kullanabilsin
    let detectedMonth = "January"; 
    if (lowerInput.includes("aralık") || lowerInput.includes("december")) detectedMonth = "December";
    if (lowerInput.includes("şubat") || lowerInput.includes("february")) detectedMonth = "February";
    if (lowerInput.includes("mart") || lowerInput.includes("march")) detectedMonth = "March";

    // 1. Önce en özel niyet olan "DETAY" kontrolü
    if (lowerInput.includes("detay") || lowerInput.includes("ayrıntı")) {
        return { intent: "QUERY_BILL_DETAILED", parameters: { month: detectedMonth } };
    }
    //unpaid
    if (lowerInput.includes("borçlarım") || lowerInput.includes("listele") || lowerInput.includes("tüm faturalar")) {
    return { intent: "BANKING_QUERY", parameters: {} }; // Parametre gerekmiyor, tümünü listeleyecek
}
    // 2. ÖDEME kontrolü
    if (lowerInput.includes("öde") || lowerInput.includes("pay")) {
    // Mesajın içindeki rakamı bulan basit bir regex
    const amountMatch = lowerInput.match(/\d+/); 
    const amount = amountMatch ? amountMatch[0] : "100"; // Rakam yoksa varsayılan 100

    return { 
        intent: "PAY_BILL", 
        parameters: { month: detectedMonth, amount: amount } 
    };
}
    // 3. GENEL FATURA sorgusu
    if (lowerInput.includes("fatura") || lowerInput.includes("borç") || lowerInput.includes("sorgula")) {
        return { intent: "QUERY_BILL", parameters: { month: detectedMonth } };
    }

    

    return { intent: "GREETING", parameters: {} };
  }
};