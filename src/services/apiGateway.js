import axios from 'axios';

const BASE_URL = "https://yagmur-apim.azure-api.net";
const API_URL = `${BASE_URL}/mobile-bill-payment/api/v1`;
let authToken = "";

export const loginAndGetToken = async () => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            subscriberNo: "998877", 
            pin: "1234" 
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': '9a98c20ebd004a8892920be98691cc87'
            }
        });
        authToken = response.data.token;
        return authToken;
    } catch (error) {
        console.error("Login Hatası:", error.message);
    }
};

export const callMidtermAPI = async (intent, params) => {
    if (!authToken) await loginAndGetToken();

    const config = { 
        headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Ocp-Apim-Subscription-Key': '9a98c20ebd004a8892920be98691cc87',
            'subscriberNo': '998877' // Swagger'da header'da istendiği için buraya ekledik
        } 
    };

    let dbMonth = "2025-01-01"; // Default Ocak
    const userMonth = params.month ? params.month.toLowerCase() : "";

    if (userMonth.includes("aralık") || userMonth.includes("december")) {
        dbMonth = "2025-12-01";
    } else if (userMonth.includes("şubat") || userMonth.includes("february")) {
        dbMonth = "2025-02-01"; // ŞUBAT BURAYA GELDİ!
    } else if (userMonth.includes("ocak") || userMonth.includes("january")) {
        dbMonth = "2025-01-01";
    }else if (userMonth.includes("mart") || userMonth.includes("march")) {
        dbMonth = "2025-03-01";
    }

    if (intent === "QUERY_BILL") {
        return axios.get(`${API_URL}/bills/query?month=${dbMonth}`, config);
    } 
    //details
    // apiGateway.js içindeki ilgili satır
else if (intent === "QUERY_BILL_DETAILED") {
    // Backend query içinden month, limit ve offset bekliyor
    return axios.get(`${API_URL}/bills/detailed?month=${dbMonth}&limit=10&offset=0`, config);
}
else if (intent === "PAY_BILL") {
    // Swagger'daki POST yapısına tam uyum
    const paymentData = {
        subscriberNo: "998877", //
        month: dbMonth,         // Dinamik tarih (Örn: 2025-01-01)
        amount: params.amount || 100           // Örnek tutar (Swagger'daki gibi)
    };
    return axios.post(`${API_URL}/payment/pay`, paymentData, config);
}
else if (intent === "BANKING_QUERY") {
    // Backend: router.get("/banking/unpaid", authMiddleware, bankingQueryBill);
    return axios.get(`${API_URL}/bills/banking/unpaid`, config);
}
};