import axios from 'axios';


//const BASE_URL = "https://bill-api-se4458-midterm.onrender.com";
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
    else if (userMonth.includes("nisan") || userMonth.includes("april")) {
        dbMonth = "2025-04-01";
    } else if (userMonth.includes("mayıs") || userMonth.includes("may")) {
        dbMonth = "2025-05-01";
    } else if (userMonth.includes("haziran") || userMonth.includes("june")) {
        dbMonth = "2025-06-01";
    } else if (userMonth.includes("temmuz") || userMonth.includes("july")) {
        dbMonth = "2025-07-01";
    } else if (userMonth.includes("ağustos") || userMonth.includes("august")) {
        dbMonth = "2025-08-01";
    } else if (userMonth.includes("eylül") || userMonth.includes("september")) {
        dbMonth = "2025-09-01";
    } else if (userMonth.includes("ekim") || userMonth.includes("october")) {
        dbMonth = "2025-10-01";
    } else if (userMonth.includes("kasım") || userMonth.includes("november")) {
        dbMonth = "2025-11-01";
    }


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
        return axios.get(`${API_URL}/bills/banking/unpaid`, config);
    }
};