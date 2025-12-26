import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

export const parseUserIntent = async (userInput) => {
  try {
    // En güncel model ismini kullanıyoruz
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }); 
    
    console.log("🚀 Gemini'ye Saf İstek Gönderiliyor: ", userInput);

    const systemInstruction = `
      Sen profesyonel bir fatura asistanısın. 
      Kullanıcının mesajını analiz et ve SADECE JSON formatında yanıt ver. 
      Başka hiçbir metin ekleme.

      Niyetler (intent): 
      - QUERY_BILL: Belirli ayın fatura tutarı.
      - QUERY_BILL_DETAILED: Fatura kalemleri/ayrıntılar.
      - PAY_BILL: Ödeme yapma.
      - BANKING_QUERY: Ödenmemiş tüm borçları listeleme.
      - GREETING: Selamlaşma.

      Parametreler (parameters):
      - month: (Örn: "January", "February", "March"...)
      - amount: (Ödeme için sayısal değer, yoksa "0")

      Örnek: {"intent": "QUERY_BILL", "parameters": {"month": "March", "amount": "0"}}
    `;

    const prompt = `${systemInstruction}\n\nKullanıcı Mesajı: ${userInput}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("🤖 Gemini'den Gelen Ham Yanıt:", text);

    // Markdown işaretlerini temizleyip parse ediyoruz
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    // Manuel fallback'i kaldırdığımız için hata durumunda UNKNOWN dönüyoruz
    console.error("❌ Gemini Gerçek Hata:", error.message);
    return { intent: "UNKNOWN", parameters: {} };
  }
};