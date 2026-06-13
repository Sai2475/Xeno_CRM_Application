# Xeno AI Command Center

A modern, AI-native CRM tailored for D2C brands to intelligently identify customer segments, generate campaigns, and visualize engagement funnels.

## Architecture Overview
This repository contains a full-stack architecture:

1. **Frontend (Next.js)**: Modern SaaS interface built with Tailwind CSS, Recharts, and Shadcn UI components.
2. **CRM Backend (FastAPI)**: Core application logic. Manages MongoDB database connection, interfaces with the **Groq API (Llama-3.3-70b)** for AI insights, and runs background delivery simulation tasks.

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (Atlas or Local)

### Setup & Run
1. Copy `.env.example` to `.env` in the root folder:
   ```bash
   cp .env.example .env
   ```
2. Fill in your `GROQ_API_KEY` and `MONGODB_URI` in `.env`.
3. Start the entire application using the helper script:
   ```powershell
   .\start.ps1
   ```

### Manual Startup (If not using start script)
1. **Start CRM Backend (Port 8000)**
   ```powershell
   .\venv\Scripts\Activate.ps1
   python backend/main.py
   ```

2. **Start Next.js Frontend (Port 3000)**
   ```powershell
   cd frontend
   npm run dev
   ```

## Application Tour

1. **Dashboard (`http://localhost:3000/`)**: View executive metrics, customer insights, and interactive charts.
2. **Data Ingestion (`http://localhost:3000/upload`)**: Upload your customer CSVs to quickly ingest data.
3. **Audience Builder & AI Chat**: Chat with Xeno AI to query MongoDB using natural language (e.g., "Show customers who haven't bought in 45 days").
4. **Campaign Hub**: Generate custom campaigns, review drafted contents, select delivery channels, and launch campaigns. WebSocket updates stream real-time delivery lifecycle simulations (sent -> delivered -> opened -> clicked) back to the dashboard and campaign hub.