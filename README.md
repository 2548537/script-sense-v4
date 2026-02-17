# ScriptSense v3 - Team Setup Guide

Welcome to the team! This guide will help you get ScriptSense running on your own computer.

## Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **Git**

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/2548537/script-sense-v3.git
cd script-sense-v2
```

### 2. Backend Setup (Flask)
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```
**CRITICAL**: Open the new `.env` file and add your own `GEMINI_API_KEY`.

### 3. Frontend Setup (React)
Open a **new terminal** in the project root:
```bash
cd frontend
npm install
```

---

## 🛠️ Running the App

### Start the Backend
In your backend terminal:
```bash
python app.py
```
*API will run on `http://localhost:5000`*

### Start the Frontend
In your frontend terminal:
```bash
npm run dev
```
*The app will be available at `http://localhost:5173`*

---

## 📖 Related Guides
- [Cloud Deployment Guide](file:///C:/Users/NOEL/.gemini/antigravity/brain/61c8ead0-b0b3-4527-9a1b-75ad82e2b7a6/deployment_guide.md)
- [Project Walkthrough](file:///C:/Users/NOEL/.gemini/antigravity/brain/61c8ead0-b0b3-4527-9a1b-75ad82e2b7a6/walkthrough.md)
