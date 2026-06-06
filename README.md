# 🩺 Divya-AI: Interactive AI Health Companion & Clinical Assistant

Divya-AI is a next-generation, interactive clinical assistant and personal health companion designed to guide users through structured medical diagnostic conversations, assist with health planning, nutrition tracking, and diagnostic analytics. Powered by Google Gemini and featuring an interactive 3D digital companion, Divya-AI brings health assistance to the modern era.

---

## ✨ Features

- **🗣️ Interactive 3D Companion:** An animated 3D companion avatar powered by Three.js that responds dynamically to user interactions and voice commands.
- **📋 Structured Diagnostic Consultations:** Automated clinical flow guiding users carefully through opening complaints, symptom assessment, pain indexing, fever logs, and digestive tracking.
- **🎙️ Voice Integration (STT & TTS):** Complete hands-free options with built-in voice recording (Speech-to-Text) and high-quality voice synthesis (Text-to-Speech).
- **📅 Personalized Health Planner:** Real-time health, movement, hydration, nutrition, and mental wellness planner with custom recovery tasks.
- **🍎 Food & Nutrition Logger:** Track daily food intake and log nutritional values seamlessly.
- **📊 Diagnostic Analytics:** Visualize medical metrics, parsed symptoms, diagnostic reports, and physical wellness charts.
- **🧩 MCP (Model Context Protocol) Integration:** Connected to external tools and context providers through Model Context Protocol (MCP).
- **🔐 Secure Authentication:** Integrated Google OAuth and JWT-based session security.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS, GSAP (GreenSock), Lucide Icons
- **3D Graphics:** Three.js (React Three Fiber equivalents / vanilla canvas)
- **State Management:** Zustand
- **Backend:** Node.js, Express, Socket.io / HTTP API
- **AI Engine:** Google Gemini API
- **Authentication:** Google OAuth 2.0 (`@react-oauth/google`), JWT

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone git@github.com:kasperzkid/Divya-AI.git
   cd Divya-AI
   ```

2. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies:**
   ```bash
   cd server
   npm install
   cd ..
   ```

### Running the Application

1. **Configure Environment Variables:**
   Create a `.env` file in the `server` directory (and root if required) using the following template:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_email_address
   EMAIL_PASS=your_email_app_password
   PORT=3001
   ```

2. **Start the Backend Server:**
   ```bash
   cd server
   npm start
   ```

3. **Start the Frontend Development Server:**
   ```bash
   # In the root directory
   npm run dev
   ```

---

## 🛡️ Security & Disclaimer

*Disclaimer: Divya-AI is a prototype virtual clinical companion and is for educational, informational, and assistance purposes only. It does not replace professional medical advice, diagnosis, or treatment. Always consult a qualified physician for any medical concerns.*
