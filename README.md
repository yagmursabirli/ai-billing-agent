# 🤖💳 SE 4458 – AI Agent Billing Assistant

An **AI-powered chat application** developed as part of the **SE 4458 – Large Scale Systems Design** course.  
The system allows users to **query, inspect, and pay bills** using **natural language**, powered by an LLM-based AI Agent.

---

## 🚀 Live Links

🔗 **Billing AI Agent:**  
https://ai-billing-agent.vercel.app/

🗂 **GitHub Repository:**  
https://github.com/yagmursabirli/ai-billing-agent

🌐 **Backend API:**  
https://bill-api-se4458-midterm.onrender.com/

🎥 **Video Presentation:**  
https://drive.google.com/file/d/1974I8NT828l6iq3ulEzyZ2Q5azvKL9TK/view?usp=sharing 


## 📌 Project Overview

The **AI Agent Billing Assistant** acts as an intelligent intermediary between users and the **Midterm Billing APIs**.  
Users can interact with the system via chat instead of calling REST endpoints manually.

🧠 The AI Agent uses **Google Gemini 2.5 Flash – Lite** to:
- Understand user intent  
- Extract parameters (e.g., month, amount)  
- Trigger the correct backend API calls  

---
## ✨ Core Features

✅ **Query Bill**  
Check the total amount due for a specific month.

✅ **Query Bill (Detailed)**  
View a detailed breakdown of bill items.

✅ **Pay Bill**  
Complete bill payments directly via chat.

✅ **Banking Query**  
List unpaid bills and display overall billing status.

---
## 🏗 System Architecture

The project strictly follows the **Expected Architecture** defined in the assignment.

### 🖥 Frontend
- Built with **React**
- Real-time chat interface
- User-friendly messaging experience

### 🌐 API Gateway
- Developed with **Node.js**
- Acts as a **central hub**
- Routes all frontend requests to backend services

### 🧠 LLM Integration
- User messages are sent to **Gemini 2.5 Flash – Lite**
- Extracts:
  - **Intent** (e.g., `QUERY_BILL`, `PAY_BILL`)
  - **Parameters** (e.g., `month: March`)


### 🔥 Real-Time Data Management
**Google Firebase (Firestore)** is integrated into the architecture to handle real-time messaging. Every user input and AI response is stored in Firestore to ensure a persistent chat history and real-time UI updates.

### 🔌 Backend APIs
- REST APIs hosted on **Render**
- Handle billing logic and transactions

### 🔁 Hybrid Logic
- **Rule-based fallback system**
- Ensures continued operation when:
  - LLM quota is exceeded
  - AI service is unavailable

---

## 🛠 Assumptions & Design Choices

🔹 **LLM Selection**  
Google Gemini was chosen for its:
- High-speed performance  
- Native structured JSON output  

🔹 **Intent Mapping**  
Natural language inputs such as: "mart faturam" are converted into structured API calls like: /api/v1/bills/query?month=2025-03-01





🔹 **Authentication**  
The chat application uses constant user credentials for API authentication where required.

---

## ⚠️ Issues Encountered & Solutions

🚨 **API Quota Limits (429 Errors)**  
- Encountered due to Gemini free-tier limitations  
- ✅ Solved using a **Rule-Based Fallback System**

🌐 **CORS Policy Issues**  
- Direct browser-to-backend calls were blocked  
- ✅ Fixed by routing all traffic through the **API Gateway**

🔐 **Security Alert (API Key Exposure)**  
- An API key was accidentally exposed  
- ✅ The key was revoked immediately  
- ✅ A new restricted key was generated via **Google AI Studio**

---

## 🧰 Tech Stack

### 🎨 Frontend
- React.js  
- Material UI
- Vercel (Deployment)

### 🤖 AI
- Google Gemini 2.5 Flash – Lite  

### 🖥 Backend / Gateway
- Node.js  
- Axios


### ☁️ Cloud & Database

Firebase Firestore: Used for real-time data persistence and chat history management.

### ☁️ Hosting
- Render: Hosts the Midterm Billing REST APIs.
- Vercel: Deployment 

---

✨ This project demonstrates how **LLM-based AI agents** can be integrated with traditional backend systems to deliver a modern, user-friendly billing experience.
