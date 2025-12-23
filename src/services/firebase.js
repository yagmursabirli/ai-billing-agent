import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Sohbet geçmişini temizlemek için gerekli fonksiyon [cite: 64]
export const deleteAllMessages = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "messages"));
    const deletePromises = querySnapshot.docs.map(document => 
      deleteDoc(doc(db, "messages", document.id))
    );
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Firestore temizleme hatası:", error);
  }
};