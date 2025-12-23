import { GoogleGenerativeAI } from "@google/generative-ai";

// Google AI Studio'dan aldığın key'i kullanır
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

export const parseUserIntent = async (userInput) => {
  // lowerInput değişkenini burada tanımlıyoruz ki her yerde kullanılabilsin
  const lowerInput = userInput.toLowerCase();

  try {
    // 404 hatasını önlemek için "models/" ön ekini ve "v1beta" sürümünü ekledik
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" }, { apiVersion: "v1beta" });

    const systemInstruction = `Sen bir Billing Assistant'sın. Kullanıcı mesajından niyet ve parametre çıkar.
      Sadece şu formatta JSON dön: {"intent": "QUERY_BILL", "parameters": {"month": "January"}}
      Niyetler: QUERY_BILL, QUERY_BILL_DETAILED, PAY_BILL, GREETING.`;

    const prompt = `${systemInstruction}\n\nKullanıcı Mesajı: ${userInput}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Markdown temizliği
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);
    
    console.log("Gemini Success:", parsed);
    return parsed;
  } catch (error) {
    console.error("Gemini Error Detail:", error);
    
    // Önce en spesifik olan "DETAY" kontrolünü yapıyoruz
    if (lowerInput.includes("detay") || lowerInput.includes("ayrıntı")) {
        let month = "January"; 
        if (lowerInput.includes("şubat") || lowerInput.includes("february")) month = "February";
        if (lowerInput.includes("aralık") || lowerInput.includes("december")) month = "December";
        
        return { intent: "QUERY_BILL_DETAILED", parameters: { month: month } };
    }
    
    // Eğer detay istenmiyorsa genel sorguya bakıyoruz
    if (lowerInput.includes("fatura") || lowerInput.includes("borç") || lowerInput.includes("sorgula")) {
        let month = "January"; 
        if (lowerInput.includes("şubat") || lowerInput.includes("february")) month = "February";
        // ... diğer aylar ...
        return { intent: "QUERY_BILL", parameters: { month: month } };
    }
    throw error;
}
};