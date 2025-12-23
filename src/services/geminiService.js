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
    
    // --- MANUEL FALLBACK (GÜÇLENDİRİLMİŞ SIRALAMA) ---
    let detectedMonth = "January"; 
    if (lowerInput.includes("aralık") || lowerInput.includes("december")) detectedMonth = "December";
    if (lowerInput.includes("şubat") || lowerInput.includes("february")) detectedMonth = "February";
    if (lowerInput.includes("mart") || lowerInput.includes("march")) detectedMonth = "March";

    // 1. ADIM: ÖNCE ÖDEME KONTROLÜ (En kritik aksiyon)
    // Eğer cümlede 'öde' veya 'yatır' varsa, diğer kelimelere bakmadan PAY_BILL dönmeliyiz.
    if (lowerInput.includes("öde") || lowerInput.includes("pay") || lowerInput.includes("yatır")) {
        const amountMatch = lowerInput.match(/\d+/); 
        const amount = amountMatch ? amountMatch[0] : "100"; 
        return { 
            intent: "PAY_BILL", 
            parameters: { month: detectedMonth, amount: amount } 
        };
    }

    // 2. ADIM: DETAY KONTROLÜ
    if (lowerInput.includes("detay") || lowerInput.includes("ayrıntı")) {
        return { intent: "QUERY_BILL_DETAILED", parameters: { month: detectedMonth } };
    }

    // 3. ADIM: TÜM BORÇLARI LİSTELEME (BANKING)
    // 'ödenmemiş' kelimesini buraya ekledik.
    if (lowerInput.includes("listele") || lowerInput.includes("borçlarım") || lowerInput.includes("ödenmemiş") || lowerInput.includes("tüm faturalar")) {
        return { intent: "BANKING_QUERY", parameters: {} };
    }

    // 4. ADIM: GENEL FATURA SORGUSU
    if (lowerInput.includes("fatura") || lowerInput.includes("borç") || lowerInput.includes("sorgula")) {
        return { intent: "QUERY_BILL", parameters: { month: detectedMonth } };
    }

    return { intent: "GREETING", parameters: {} };
  }
};