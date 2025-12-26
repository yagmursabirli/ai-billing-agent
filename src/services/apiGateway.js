import axios from 'axios';

// 1. Yeni Render URL'in (Azure APIM yerine doğrudan Render Gateway'e gidiyoruz)
const BASE_URL = "https://bill-api-se4458-midterm.onrender.com";
const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api/v1`;
const GATEWAY_KEY = process.env.REACT_APP_GATEWAY_KEY; 

let authToken = "";

export const loginAndGetToken = async () => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            subscriberNo: "998877", 
            pin: "1234" 
        }, {
            headers: {
                'Content-Type': 'application/json',
                // Azure header ismini koruyoruz ki mimari dökümanla uyumlu kalsın
                'Ocp-Apim-Subscription-Key': GATEWAY_KEY,
                'subscriberNo': '998877'
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
            'Ocp-Apim-Subscription-Key': GATEWAY_KEY,
            'subscriberNo': '998877' 
        } 
    };

    // Tarih Mantığı (Neon DB'deki formatla uyumlu: YYYY-MM-DD)
    let dbMonth = "2025-01-01"; 
    const userMonth = params.month ? params.month.toLowerCase() : "";

    if (userMonth.includes("aralık") || userMonth.includes("december")) {
        dbMonth = "2025-12-01";
    } else if (userMonth.includes("şubat") || userMonth.includes("february")) {
        dbMonth = "2025-02-01";
    } else if (userMonth.includes("ocak") || userMonth.includes("january")) {
        dbMonth = "2025-01-01";
    } else if (userMonth.includes("mart") || userMonth.includes("march")) {
        dbMonth = "2025-03-01";
    }

    // Niyetlere göre API çağrıları
    if (intent === "QUERY_BILL") {
        return axios.get(`${API_URL}/bills/query?month=${dbMonth}`, config);
    } 
    else if (intent === "QUERY_BILL_DETAILED") {
        return axios.get(`${API_URL}/bills/detailed?month=${dbMonth}&limit=10&offset=0`, config);
    }
    else if (intent === "PAY_BILL") {
        const paymentData = {
            subscriberNo: "998877",
            month: dbMonth,
            amount: parseFloat(params.amount) || 100
        };
        return axios.post(`${API_URL}/payment/pay`, paymentData, config);
    }
    else if (intent === "BANKING_QUERY") {
        // Backend'deki yeni rota yapınla uyumlu
        return axios.get(`${API_URL}/bills/banking/unpaid`, config);
    }
};