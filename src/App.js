import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Paper, TextField, IconButton, Box, Typography, 
  List, ListItem, ListItemText, CircularProgress, Divider 
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './services/firebase';
import { parseUserIntent } from './services/geminiService';
import { loginAndGetToken, callMidtermAPI } from './services/apiGateway';
import { deleteAllMessages } from './services/firebase';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loginAndGetToken();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  // App.js içindeki mevcut useEffect'lerin yanına ekle
useEffect(() => {
  const startFreshChat = async () => {
    try {
      // 1. Önce mevcut Firestore koleksiyonunu temizle (Hocanın istediği taze başlangıç) [cite: 64, 65]
      await deleteAllMessages(); 

      // 2. Kısa bir bekleme (Firebase senkronizasyonu için)
      setTimeout(async () => {
        // 3. İlk selamlama mesajını bot olarak ekle [cite: 9, 10, 75]
        await addDoc(collection(db, "messages"), {
          text: "Merhaba! Ben Billing Assistant. Bugün size nasıl yardımcı olabilirim? Faturanızı sorgulayabilir veya ödeme yapabilirsiniz.",
          sender: 'bot',
          timestamp: new Date()
        });
      }, 500);
      
    } catch (error) {
      console.error("Başlangıç hatası:", error);
    }
  };

  startFreshChat();
  // Boş bağımlılık dizisi [], bunun sadece uygulama ilk açıldığında çalışmasını sağlar
}, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setInput('');
    setLoading(true);

    try {
      await addDoc(collection(db, "messages"), {
        text: userMessage,
        sender: 'user',
        timestamp: new Date()
      });

      const aiResponse = await parseUserIntent(userMessage);
      
      let apiResultText = "";
      if (aiResponse.intent !== "GREETING") {
        // App.js handleSend içinde
const response = await callMidtermAPI(aiResponse.intent, aiResponse.parameters);
const data = response.data;

if (aiResponse.intent === "QUERY_BILL") {
    const amount = data.totalAmount || "0.00";
    apiResultText = `${aiResponse.parameters.month} ayı faturanız: ${amount} TL.`;
} 
else if (aiResponse.intent === "QUERY_BILL_DETAILED") {
    // Backend tam olarak "details" anahtarıyla liste dönüyor
    const detailsList = data.details; 
    
    if (Array.isArray(detailsList) && detailsList.length > 0) {
        let detailsText = `${aiResponse.parameters.month} ayı harcama detaylarınız:\n`;
        detailsList.forEach(item => {
            // DB kolon isimleri: type ve amount
            detailsText += `• ${item.type}: ${item.amount} TL\n`;
        });
        apiResultText = detailsText;
    } else {
        apiResultText = "Bu aya ait harcama detayı bulunamadı.";
    }
}
else if (aiResponse.intent === "PAY_BILL") {
          // Swagger yapısına göre ödeme kontrolü
          console.log("Payment API Response:", data);
          const status = data.paymentStatus; 
          const remaining = data.remainingAmount;
          
          if (status === "Successful") {
        apiResultText = `${aiResponse.parameters.month} ayı faturanız için ${aiResponse.parameters.amount} TL ödeme yapılmıştır. \nKalan Borç: ${remaining} TL.`;
    }else {
            apiResultText = "Ödeme işlemi sırasında bir sorun oluştu.";
          }
        }
        else if (aiResponse.intent === "BANKING_QUERY") {
    // Backend tam olarak bu anahtarı dönüyor: unpaidBills
    const unpaidList = data.unpaidBills; 
    
    if (Array.isArray(unpaidList) && unpaidList.length > 0) {
        let listText = "Ödenmemiş faturalarınız listeleniyor:\n";
        unpaidList.forEach(bill => {
            // Backend'den gelen alan isimlerine tam uyum
            listText += `• Tarih: ${bill.month} | Tutar: ${bill.total_amount} TL | Kalan: ${bill.remaining_amount} TL\n`;
        });
        apiResultText = listText;
    } else {
        apiResultText = "Harika! Ödenmemiş herhangi bir faturanız bulunmuyor.";
    }
}

        else {
          apiResultText = `İşlem Başarılı! Detaylar: ${JSON.stringify(data)}`;
        }
      } else {
        apiResultText = "Merhaba! Size nasıl yardımcı olabilirim? Faturanızı sorgulayabilir veya ödeme yapabilirsiniz.";
      }

      

      await addDoc(collection(db, "messages"), {
        text: apiResultText,
        sender: 'bot',
        timestamp: new Date()
      });

    } catch (error) {
      console.error("Hata Detayı:", error);
      let errorMsg = "Üzgünüm, işleminizi şu an gerçekleştiremiyorum.";
      
      if (error.response && error.response.status === 429) {
          errorMsg = "Günlük istek limitinizi doldurdunuz. Lütfen daha sonra tekrar deneyiniz.";
      }

      await addDoc(collection(db, "messages"), {
        text: errorMsg,
        sender: 'bot',
        timestamp: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ height: '80vh', display: 'flex', flexDirection: 'column', borderRadius: 4, overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: '#1976d2', color: 'white', textAlign: 'center' }}>
          <Typography variant="h6">AI Agent - Billing Actions</Typography>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
          <List>
            {messages.map((msg) => (
              <ListItem key={msg.id} sx={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <Paper sx={{ 
                  p: 1.5, 
                  bgcolor: msg.sender === 'user' ? '#1976d2' : 'white', 
                  color: msg.sender === 'user' ? 'white' : 'black',
                  borderRadius: msg.sender === 'user' ? '20px 20px 0 20px' : '20px 20px 20px 0',
                  maxWidth: '80%'
                }}>
                  <ListItemText primary={msg.text} />
                </Paper>
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        </Box>

        <Divider />

        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField 
            fullWidth 
            variant="outlined" 
            placeholder="Want can I assist you"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <IconButton color="primary" onClick={handleSend} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Paper>
    </Container>
  );
}

export default App;