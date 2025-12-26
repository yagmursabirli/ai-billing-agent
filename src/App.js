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

  // --- AY ÇEVİRİ SÖZLÜĞÜ ---
  const monthTranslation = {
    "January": "Ocak",
    "February": "Şubat",
    "March": "Mart",
    "April": "Nisan",
    "May": "Mayıs",
    "June": "Haziran",
    "July": "Temmuz",
    "August": "Ağustos",
    "September": "Eylül",
    "October": "Ekim",
    "November": "Kasım",
    "December": "Aralık"
  };

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

  const isInitialMount = useRef(true);

  useEffect(() => {
    const startFreshChat = async () => {
      if (!isInitialMount.current) return;
      isInitialMount.current = false;

      try {
        await deleteAllMessages(); 
        setTimeout(async () => {
          await addDoc(collection(db, "messages"), {
            text: "Merhaba! Ben Billing Assistant. Bugün size nasıl yardımcı olabilirim?\nFaturanızı sorgulayabilir veya ödeme yapabilirsiniz. ☺️",
            sender: 'bot',
            timestamp: new Date()
          });
        }, 800); 
      } catch (error) {
        console.error("Başlangıç hatası:", error);
      }
    };
    startFreshChat();
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

      // Ay ismini Türkçeye çeviriyoruz
      const displayMonth = monthTranslation[aiResponse.parameters.month] || aiResponse.parameters.month;

      if (aiResponse.intent !== "GREETING") {
        const response = await callMidtermAPI(aiResponse.intent, aiResponse.parameters);
        const data = response.data;

        // 1. Tekli Fatura Sorgu
        if (aiResponse.intent === "QUERY_BILL") {
          if (data && data.totalAmount !== undefined && data.totalAmount !== null) {
            apiResultText = `${displayMonth} ayı toplam faturanız: ${data.totalAmount} TL.`;
          } else {
            apiResultText = `${displayMonth} ayına ait kayıtlı bir fatura bulunamadı. 🔍`;
          }
        }
        // 2. Fatura Detayı
        else if (aiResponse.intent === "QUERY_BILL_DETAILED") {
          const detailsList = data.details; 
          if (Array.isArray(detailsList) && detailsList.length > 0) {
            let detailsText = `${displayMonth} ayı harcama detaylarınız:\n`;
            detailsList.forEach(item => {
              detailsText += `• ${item.type}: ${item.amount} TL\n`;
            });
            apiResultText = detailsText;
          } else {
            apiResultText = `${displayMonth} ayına ait harcama detayı bulunamadı.`;
          }
        }
        // 3. Ödeme İşlemi
        else if (aiResponse.intent === "PAY_BILL") {
          const status = data.paymentStatus; 
          const remaining = data.remainingAmount;
          if (status === "Successful") {
            apiResultText = `İşlem Başarılı! ✅\n${displayMonth} ayı faturanız için ${aiResponse.parameters.amount} TL ödeme yapılmıştır.\nKalan Borç: ${remaining} TL.`;
          } else {
            apiResultText = "Ödeme işlemi sırasında bir sorun oluştu. Lütfen tekrar deneyiniz.";
          }
        }
        // 4. Tüm Borçları Listeleme (Banking)
        else if (aiResponse.intent === "BANKING_QUERY") {
          const unpaidList = data.unpaidBills; 
          if (Array.isArray(unpaidList) && unpaidList.length > 0) {
            let listText = "Ödenmemiş faturalarınız listeleniyor:\n\n";
            unpaidList.forEach(bill => {
              const billMonthTr = monthTranslation[bill.month] || bill.month;
              listText += `📅 Tarih: ${billMonthTr}\n💰 Tutar: ${bill.total_amount} TL\n💳 Kalan: ${bill.remaining_amount} TL\n------------------\n`;
            });
            apiResultText = listText;
          } else {
            apiResultText = "Harika! Şu an için ödenmemiş herhangi bir faturanız bulunmuyor. ✨";
          }
        }
        else {
          apiResultText = `İşlem Başarılı! Detaylar: ${JSON.stringify(data)}`;
        }
      } else {
        apiResultText = "Tekrar Merhaba! Size nasıl yardımcı olabilirim?\nFaturalarınızı listeleyebilir, detaylarını görebilir veya ödeme yapabilirsiniz.";
      }

      await addDoc(collection(db, "messages"), {
        text: apiResultText,
        sender: 'bot',
        timestamp: new Date()
      });

    } catch (error) {
      console.error("Hata Detayı:", error);
      let errorMsg = "Üzgünüm, işleminizi şu an gerçekleştiremiyorum.";

      if (error.response && error.response.status === 404) {
          errorMsg = "Aradığınız döneme ait bir fatura kaydı bulunamadı. Lütfen tarihi kontrol ediniz.";
      } else if (error.response && error.response.status === 429) {
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
          <Typography variant="h6">AI Agent - Billing Assistant</Typography>
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
                  maxWidth: '85%',
                  whiteSpace: 'pre-wrap', 
                  boxShadow: 1
                }}>
                  <ListItemText 
                    primary={msg.text} 
                    primaryTypographyProps={{ style: { fontSize: '0.95rem', lineHeight: '1.4' } }}
                  />
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
            placeholder="Size nasıl yardımcı olabilirim?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
          />
          <IconButton color="primary" onClick={handleSend} disabled={loading || !input.trim()}>
            {loading ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Paper>
    </Container>
  );
}

export default App;