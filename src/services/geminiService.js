import { GoogleGenerativeAI } from "@google/generative-ai";

// API Key'i .env dosyasından alıyoruz
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

export const parseUserIntent = async (userInput) => {
  const lowerInput = userInput.toLowerCase();

  try {
    // 1. KRİTİK DÜZELTME: 'models/' ön ekini ve 'apiVersion' zorlamasını kaldırıyoruz.
    // SDK zaten en doğru URL'i kendisi oluşturur.
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }); 
    
    console.log("🚀 Gemini'ye İstek Gönderiliyor: ", userInput);

    const systemInstruction = `
      Sen bir Billing Assistant'sın. Kullanıcının niyetini analiz et ve SADECE JSON dön.
      İmkanlar: 
      1. QUERY_BILL: Belirli ayın toplam tutarı.
      2. QUERY_BILL_DETAILED: Harcama detayları.
      3. PAY_BILL: Ödeme işlemi (tutar ve ay gerekir).
      4. BANKING_QUERY: Tüm ödenmemişleri listele.
      
      Örnek Format: {"intent": "QUERY_BILL", "parameters": {"month": "January", "amount": "0"}}
    `;

    const prompt = `${systemInstruction}\n\nKullanıcı Mesajı: ${userInput}`;
    
    // İstek gönderiliyor
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("🤖 Gemini'den Gelen Yanıt:", text);

    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    // 404 veya diğer hatalar buraya düşer
    console.error("❌ Gemini Bağlantı Hatası:", error.message);
    console.warn("⚠️ Manuel Fallback Devreye Giriyor...");

    // --- MANUEL FALLBACK (YEDEK MEKANİZMA) ---
    let detectedMonth = "January"; 
    if (lowerInput.includes("ocak") || lowerInput.includes("january")) detectedMonth = "January";
    if (lowerInput.includes("şubat") || lowerInput.includes("february")) detectedMonth = "February";
    if (lowerInput.includes("mart") || lowerInput.includes("march")) detectedMonth = "March";
    if (lowerInput.includes("nisan") || lowerInput.includes("april")) detectedMonth = "April";
    if (lowerInput.includes("mayıs") || lowerInput.includes("may")) detectedMonth = "May";
    if (lowerInput.includes("haziran") || lowerInput.includes("june")) detectedMonth = "June";
    if (lowerInput.includes("temmuz") || lowerInput.includes("july")) detectedMonth = "July";
    if (lowerInput.includes("ağustos") || lowerInput.includes("august")) detectedMonth = "August";
    if (lowerInput.includes("eylül") || lowerInput.includes("september")) detectedMonth = "September";
    if (lowerInput.includes("ekim") || lowerInput.includes("october")) detectedMonth = "October";
    if (lowerInput.includes("kasım") || lowerInput.includes("november")) detectedMonth = "November";
    if (lowerInput.includes("aralık") || lowerInput.includes("december")) detectedMonth = "December";

    if (lowerInput.includes("öde") || lowerInput.includes("pay") || lowerInput.includes("yatır")) {
      const amountMatch = lowerInput.match(/\d+/);
      const amount = amountMatch ? amountMatch[0] : "100";
      return { intent: "PAY_BILL", parameters: { month: detectedMonth, amount: amount } };
    }

    if (lowerInput.includes("detay") || lowerInput.includes("ayrıntı")) {
      return { intent: "QUERY_BILL_DETAILED", parameters: { month: detectedMonth } };
    }

    if (lowerInput.includes("listele") || lowerInput.includes("borçlarım") || lowerInput.includes("ödenmemiş")) {
      return { intent: "BANKING_QUERY", parameters: {} };
    }

    if (lowerInput.includes("fatura") || lowerInput.includes("borç") || lowerInput.includes("sorgula")) {
      return { intent: "QUERY_BILL", parameters: { month: detectedMonth } };
    }

    return { intent: "GREETING", parameters: {} };
  }
};