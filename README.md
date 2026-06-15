# FitFlow: AI-Native CRM for Boutique Fitness

![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-black)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)
![MongoDB](https://img.shields.io/badge/Database-MongoDB_Motor-47A248)
![Groq](https://img.shields.io/badge/AI-Groq_Llama_3-F55036)

**FitFlow** is an AI-native CRM specifically engineered for boutique fitness gyms. Instead of acting as a static address book, FitFlow actively ingests member data (class attendance, join dates, last visit), predicts churn risk, and uses an embedded LLM agent to instantly draft, segment, and launch personalized A/B tested win-back campaigns.

---

## ⚠️ Important Note (Cloud Hosting)

This project utilizes a completely decoupled, microservice-based architecture deployed across **Vercel** and **Render**. 

Because the backend services are hosted on **Render's Free Tier**, the containers will automatically "spin down" and go to sleep after 15 minutes of inactivity. 

**When you first open the live Vercel link, please allow approximately 45–60 seconds for the backend services to "wake up" and spin back up.** Once the initial cold start is complete, the application, the WebSockets, and the AI generation will run at full speed.

### Live Production Links
* **Live Application (Vercel): https://xeno-crm-application.vercel.app/
* **Core API (Render):** https://xeno-backend-ti5a.onrender.com/docs
* **Channel Simulator Microservice (Render):** https://xeno-channel-service-5zh6.onrender.com/docs

---

## 🏗️ System Architecture & Scalability

FitFlow is designed with enterprise-grade system design principles in mind:

1. **Strict Decoupling (The Channel Simulator)**
   - The system does not fake campaign deliveries inside the main CRM loop.
   - We built a completely independent **Channel Simulator** deployed as a separate microservice on its own Render instance. 
   - When a campaign launches, the CRM sends an HTTP POST to the simulator. The simulator mimics external network delays, and then asynchronously fires HTTP webhooks (Delivered, Opened, Clicked) back to the CRM’s receipt API.

2. **Webhook Idempotency**
   - Webhooks are notoriously unreliable and can fire multiple times due to network latency.
   - Our `/api/receipt` endpoint implements strict **Idempotency**. Before incrementing any analytics, it queries the database for the unique `event_id`. Duplicates are safely ignored, ensuring absolute data integrity at scale.

3. **Asynchronous I/O**
   - The backend uses FastAPI, Python's `asyncio`, and the asynchronous MongoDB `motor` driver. The server never blocks during massive campaign blasts or heavy webhook traffic.

4. **Dynamic AI Querying**
   - We pass a strict JSON schema of our MongoDB structure directly into the Groq Llama-3 system prompt. This allows the AI to dynamically translate English user requests into raw, executable MongoDB JSON queries on the fly.

---

## 🚀 How to Use the App

1. **Data Ingestion:** Navigate to the `Data Ingestion` tab and upload your gym members CSV. The backend will parse the data and categorize members by health score.
2. **Dashboard Analytics:** View live executive metrics, including Active Members, High Churn Risk, and Renewals Due.
3. **Aura AI (The Magic):** Open the chat sidebar. Ask the AI to segment your audience (e.g., *"Find all basic members and draft a win-back campaign"*). The AI will query the database and automatically generate A/B tested SMS variants.
4. **Launch & Track:** Select a variant and hit Launch. Go to the **Campaign Hub** to watch the real-time simulation as the Channel Service fires live webhooks back to the dashboard!

---

## 💻 Local Developer Setup

If you wish to run the architecture locally instead of using the cloud links:

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas Cluster
- Groq API Key

### 1. Setup Environment Variables
Copy `.env.example` to `.env` in the root folder, and `.env.local` in the `frontend/` folder. Ensure you provide your `MONGODB_URI` and `GROQ_API_KEY`.

### 2. Start Core CRM Backend (Port 8000)
```bash
python -m venv venv
source venv/Scripts/activate
pip install -r backend/requirements.txt
python backend/main.py
```

### 3. Start Channel Simulator (Port 8001)
```bash
python channel_service/main.py
```

### 4. Start Next.js Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```
