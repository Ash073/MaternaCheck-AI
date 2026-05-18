🌸 MaternaCheck - AI-Based Pregnancy Symptom Checker

An AI-powered late-pregnancy symptom checker designed for gestational weeks 32–40.
Built to help expectant mothers understand symptom severity and identify when medical attention may be needed.

MaternaCheck combines clinical rule-based risk assessment with optional Google Gemini AI guidance to deliver fast, accessible, and easy-to-understand pregnancy support.

✨ Overview

MaternaCheck is a full-stack healthcare hackathon project that evaluates late-pregnancy symptoms and categorizes them into:

✅ Normal
⚠️ Monitor Closely
🚨 Emergency

The application uses:

A rule-based clinical logic engine
Weighted symptom scoring
Preeclampsia pattern detection
Optional AI-generated guidance via Gemini

The project is designed to work:

With a backend server
Or completely offline in the browser using local fallback analysis
📸 Features
🩺 Smart Pregnancy Risk Assessment

Evaluates symptoms during pregnancy weeks 32–40 using weighted clinical logic.

Symptoms Covered
Pain levels
Headache severity
Contractions
Vaginal bleeding
Fluid leakage
Fetal movement
Kick count
Swelling
Vision disturbances
Upper abdominal pain
Breathing difficulty
Previous pregnancy conditions
⚡ Risk Classification Engine

Three-tier severity system:

Risk Level	Meaning
✅ Normal	Symptoms appear reassuring
⚠️ Monitor	Requires observation or doctor consultation
🚨 Emergency	Immediate medical attention recommended
🧠 Preeclampsia Detection

Detects dangerous symptom clusters such as:

Severe headache
Vision changes
Swelling
Upper abdominal pain

These combinations trigger elevated risk scoring automatically.

👶 Interactive Kick Counter

Includes:

Animated baby emoji
Fetal movement tracking
Kick count input system
🤖 Optional Gemini AI Guidance

Integrates with the Google Gemini API to provide:

Human-friendly explanations
Context-aware reassurance
Guidance suggestions

If no API key is configured, the app gracefully falls back to built-in advice generation.

🌐 Offline Fallback Support

Even without a backend server:

The frontend still works
Risk analysis runs locally
No internet connection required
📱 Fully Responsive UI

Optimized for:

Mobile
Tablet
Desktop

Includes:

Smooth transitions
Floating orb animations
Step-by-step assessment flow
🛠 Tech Stack
Layer	Technology
Frontend	HTML5, CSS3, Vanilla JavaScript
Backend	Node.js, Express.js
AI Integration	Google Gemini API
Data Storage	None (Stateless Architecture)
📂 Project Structure
materna-check/
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── assets/
│       ├── icons/
│       └── images/
│
├── backend/
│   ├── server.js
│   ├── routes/
│   │   └── checkRoutes.js
│   ├── logic/
│   │   └── riskLogic.js
│   └── ai/
│       └── gemini.js
│
├── package.json
└── README.md
🚀 Getting Started
Prerequisites

Install the following before running the project:

Node.js v16+
npm

Download Node.js here:

Node.js Official Website

⚙️ Installation
1️⃣ Clone the Repository
git clone https://github.com/your-username/materna-check.git
cd materna-check
2️⃣ Install Dependencies
npm install
3️⃣ Start the Server
npm start

The app will run at:

http://localhost:3000
🤖 Enable Gemini AI (Optional)

To enable AI-generated advice:

Windows PowerShell
$env:GEMINI_API_KEY="your_api_key_here"
npm start
Linux / macOS
GEMINI_API_KEY=your_api_key_here npm start

Get your API key here:

Google AI Studio API Keys

The app works fully even without Gemini AI enabled.

🌐 Frontend-Only Mode

You can also run the frontend independently without starting the backend.

Simply open:

frontend/index.html

The app will automatically switch to local symptom analysis mode.

🔌 API Reference
POST /api/check

Analyzes pregnancy symptoms and returns a risk assessment.

Request Body
{
  "symptoms": {
    "gestWeek": 36,
    "gravida": "first",
    "painLevel": 3,
    "headache": 2,
    "contractions": "none",
    "bleeding": "none",
    "fluid": "none",
    "fetalMovement": "normal",
    "kickCount": 12,
    "swelling": "mild",
    "vision": "none",
    "upperPain": "no",
    "breathing": "none",
    "pre": [],
    "other": []
  }
}
Example Response
{
  "riskLevel": "normal",
  "score": 8,
  "trail": [],
  "emergencyReasons": [],
  "guidance": [],
  "context": {
    "week": 36,
    "preterm": true
  },
  "aiAdvice": "Your symptoms at week 36 look reassuring..."
}
📊 API Response Fields
Field	Type	Description
riskLevel	string	normal / monitor / emergency
score	number	Risk score from 0–100
trail	array	Symptom analysis breakdown
emergencyReasons	array	Critical triggers detected
guidance	array	Recommended next steps
context	object	Pregnancy context information
aiAdvice	string	AI-generated or fallback guidance
🎨 UI & Design
Fonts
Playfair Display
Nunito
Color Palette
Blush Pink
Peach
Lavender
Sage Green
Soft Gold
Cream
Animations
Floating background orbs
Smooth step transitions
Result pop-in animations

🔒 Privacy

MaternaCheck:

Does not use a database
Stores no user information
Runs entirely in memory
Does not track or retain medical data
⚠️ Medical Disclaimer

MaternaCheck is an educational and informational support tool only.

This application:

Does not provide medical diagnosis
Does not replace professional healthcare advice
Should not be used as a substitute for emergency services

Always consult:

Your doctor
Midwife
Healthcare provider
Emergency services (108 / 102 / 112)

for any pregnancy-related concerns.

🏆 Hackathon Focus

MaternaCheck was built as a healthcare-focused hackathon project emphasizing:

Accessibility
Maternal health awareness
Explainable AI support
Offline-first usability
Lightweight deployment

📌 Future Improvements

User authentication
Pregnancy history tracking
Multi-language support
Voice-assisted assessments
Real-time hospital recommendations
Doctor dashboard integration
Wearable device connectivity

👨‍💻 Author

Developed with ❤️ to support safer maternal healthcare experiences through accessible AI-powered technology.

📄 License

This project is licensed under the MIT License.
