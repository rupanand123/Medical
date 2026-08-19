# CareBridge: AI-Powered Elderly Care & Medication Adherence System

CareBridge is a full-stack, clinical-grade digital health application designed to bridge the care gap between caregivers, elderly individuals, and healthcare providers. It combines real-time multi-patient monitoring, zero-delay precision alarms, a 3-tier safety escalation protocol, and cutting-edge **Google Gemini AI & Clinical Pharmacopeia Models** for disease intelligence and drug-drug interaction analysis.

---

## 🌟 Key Highlights & Features

### 1. Dual-Perspective User Experience
- **Caregiver Management Dashboard**:
  - Multi-patient roster management with quick patient switching.
  - Real-time adherence tracking, missed dose alerts, and pill inventory monitoring.
  - Interactive **Onboarding Guide** highlighting essential clinical tools.
  - Document sharing vault for medical records, lab reports, and prescriptions.
  - One-click prescription refill requests and inventory restock (+30 pills).
- **Elderly-Friendly Senior View**:
  - High-contrast, large-typography, senior-accessible interface.
  - Clear, tactile "Taken" confirmation button with instant visual feedback.
  - Voice audio readout of instructions and medication details.
  - Secure, code-based pairing to link with family or professional caregivers.

### 2. Clinical Safety & 3-Tier Escalation Protocol
- **Tier 1 (Scheduled Time)**: Push alert, SMS simulation, and automated voice call to the older adult.
- **Tier 2 (T + 15 Minutes)**: Caregiver notified via urgent SMS and dashboard warning banner if medication remains untaken.
- **Tier 3 (T + 30 Minutes)**: Emergency escalation dispatch alert to assigned healthcare workers / doctors.
- **Manual Force Escalation**: Simulation trigger for healthcare demonstrations and compliance audits.

### 3. Zero-Delay Precision Alarm System
- **Epoch-Calculated Scheduling Engine**: Background timers calculate exact millisecond deltas to trigger alarms precisely on time without interval drift.
- **Web Audio API Synthesizer**: Custom dual-oscillator acoustic waveform synthesizer (880Hz / 1760Hz pulse) for attention-grabbing auditory alarms.
- **Screen WakeLock API**: Keeps the device display awake during active alarm alerts.
- **Hardware Vibration & Native Notifications**: Native browser notification integration with tactile vibration patterns.
- **Persistent Alarm Storage**: Automatically restores and reschedules all active alarms across app restarts and reloads.

### 4. Interactive Caregiver-Senior Communication Hub
- Real-time bidirectional chat between caregivers and connected older adults.
- **Web Speech API**: Integrated voice recording / speech-to-text input and audio message playback.
- File and prescription attachments directly within conversation threads.

### 5. Multilingual Localization
- Built-in multi-language translation engine supporting **5 languages**:
  - English (`en`)
  - Spanish (`es`)
  - Hindi (`hi`)
  - Chinese (`zh`)
  - Telugu (`te`)

---

## 🧠 AI & Machine Learning Architecture

The platform integrates generative AI models and standardized clinical datasets to ensure evidence-based pharmacological safety:

### 1. Generative AI Models
- **Google Gemini 3.7 Flash (`gemini-3.7-flash`)**:
  - **SDK**: `@google/genai` TypeScript SDK.
  - **Role**: Primary clinical intelligence engine.
  - **Capabilities**: Structured JSON generation (`responseSchema`), medical disease-to-regimen mapping, and deep interaction reasoning.
- **Google Gemini 2.5 Flash (`gemini-2.5-flash`)**:
  - **Role**: High-availability candidate model for instant failover during peak traffic periods or service disruptions.

### 2. Clinical Pharmacopeia & Machine Learning Datasets
- **RxNorm (NLM/NIH)**: Concept Unique Identifier (RxCUI) integration for standardized clinical drug nomenclature (e.g., RxCUI `860975` for Metformin, `314076` for Lisinopril).
- **DrugBank Database**: Molecular and clinical drug identification (`DB00331`, `DB00722`, `DB01076`) for mechanism-of-action tracking.
- **WHO Essential Medicines Guidelines**: Clinical rule sets embedded in system prompts for geriatric dosage safety, renal precautions, and fall-risk mitigation.

### 3. AI Disease Intelligence & Safety Modules
- **Automated Regimen Generator (`/api/disease-intelligence` mode: `schedule`)**:
  - Generates recommended medications, therapeutic classes, typical geriatric dosages, dosing frequencies, and optimal 24-hour administration schedules (e.g., morning vs. bedtime).
- **Drug-Drug Interaction (DDI) & Contraindication Engine (`/api/disease-intelligence` mode: `interaction`)**:
  - Analyzes proposed medications against the patient's existing regimen.
  - Computes multi-level severity ratings: `None`, `Mild`, `Moderate`, `Severe`.
  - Explains physiological interaction risks (e.g., bleeding risks with anticoagulants, hypotension risks, electrolyte disturbances).
  - Generates senior-safe alternative recommendations.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | **React 19** (`react`, `react-dom`) |
| **Language & Tooling** | **TypeScript 5.8**, **Vite 6** |
| **Styling & UI Design** | **Tailwind CSS v4**, **Lucide React** Icons |
| **Animation Engine** | **Motion / Framer Motion v12** (`motion/react`) with `AnimatePresence` |
| **Web Browser APIs** | **Web Audio API**, **Screen WakeLock API**, **Web Speech API** (SpeechRecognition & SpeechSynthesis), **Notification API**, **Vibration API** |
| **Backend Server** | **Node.js**, **Express 4**, **esbuild** (CJS production bundle), **tsx** (Dev runtime) |
| **AI / GenAI SDK** | **`@google/genai` (v2.4.0)** |
| **Cloud Database & Auth**| **Firebase Firestore v12** (NoSQL Real-Time Sync), **Firebase Authentication** (Google OAuth & Demo Mode) |
| **Environment Config** | **dotenv** |

---

## 📁 Project Directory Structure

```
├── .env.example                     # Environment variable definitions
├── metadata.json                    # Application metadata and platform capabilities
├── package.json                     # Dependencies, scripts, and build targets
├── server.ts                        # Express backend, Gemini API routes, and Firestore state sync
├── firestore.rules                  # Firestore security rules
├── index.html                       # HTML entry point with viewport configuration
├── vite.config.ts                   # Vite build configuration with Tailwind plugin
│
└── src/
    ├── main.tsx                     # React root bootstrap
    ├── App.tsx                      # Main application orchestrator & authentication wrapper
    ├── types.ts                     # TypeScript data contracts, interfaces, and enums
    ├── index.css                    # Tailwind CSS v4 root stylesheet
    ├── firebase.ts                  # Firebase app initialization, Auth, and Firestore instance
    ├── serverDb.ts                  # Server-side Firestore persistence helpers & caching
    │
    ├── components/
    │   ├── CaregiverView.tsx        # Caregiver dashboard, metrics, med form, and adherence roster
    │   ├── ElderlyView.tsx          # Senior interface, active doses, adherence history, voice controls
    │   ├── ActiveAlarmModal.tsx     # Fullscreen alarm overlay with Web Audio synthesizer & WakeLock
    │   ├── AlarmDashboardCard.tsx   # Precision alarm status card and quick-launch modal trigger
    │   ├── AlarmManagerModal.tsx    # Alarm configuration, scheduling, deletion, and toggle modal
    │   ├── DiseaseIntelligence.tsx  # Gemini AI disease search, schedule generation & DDI analyzer
    │   ├── EscalationTimeline.tsx   # Visual 3-tier escalation protocol timeline and live audit logs
    │   ├── ChatWidget.tsx           # Caregiver-senior real-time chat with voice input and attachments
    │   ├── CaregiverOnboardingGuide.tsx # Interactive feature discovery tour with Framer Motion
    │   ├── ConnectionStatusIndicator.tsx# Live cloud database sync and connectivity indicator
    │   └── AuthModal.tsx            # Google Sign-In and Demo account authentication modal
    │
    └── lib/
        ├── alarmScheduler.ts        # Zero-delay precision epoch alarm engine with Web Audio
        └── translations.ts          # Localization dictionaries (EN, ES, HI, ZH, TE)
```

---

## 🔌 API Endpoints Reference

### Core State & Synchronization
- `GET /api/state`: Retrieves the current user's profile, connected patients, active medication roster, audit logs, chats, medical files, and confirmations.
- `POST /api/simulation/advance-time`: Advances the simulation clock and automatically processes scheduled dose triggers and escalation steps.
- `POST /api/simulation/reset`: Resets the Firestore database and session state to baseline defaults.

### Connections & Pairing
- `POST /api/connections/connect`: Links an older adult to a caregiver using a secure connection code (`CG-XXXXXX`).
- `POST /api/connections/reset-code`: Generates a new permanent connection code for the caregiver.
- `POST /api/connections/disconnect`: Unlinks an older adult profile.
- `POST /api/caregiver/switch-patient`: Switches the active patient view on the caregiver dashboard.

### Medications & Adherence
- `POST /api/medications`: Registers a new custom medication with disease mapping and pill stock count.
- `POST /api/medications/:id/take`: Records a verified dose intake, logs confirmation, and decrements pill count.
- `POST /api/medications/:id/force-escalate`: Manually triggers the next escalation step (Tier 1 → Tier 2 → Tier 3) for demonstration.
- `POST /api/medications/:id/request-refill`: Submits a prescription refill request.
- `POST /api/medications/:id/restock`: Restocks pill inventory (e.g. +30 pills).
- `DELETE /api/medications/:id`: Removes a medication from the active schedule.

### Medical Documents & Records
- `POST /api/medical-files`: Uploads and shares a prescription, blood report, discharge summary, or doctor note.
- `GET /api/medical-files/:olderAdultId`: Retrieves shared documents for a specific patient.

### Real-Time Chat
- `POST /api/chat`: Sends a text message, voice message transcription, or attached file.
- `POST /api/chat/read`: Marks incoming messages as read.

### AI & Clinical Intelligence
- `POST /api/disease-intelligence`: Invokes Gemini 3.7 Flash with structured clinical schemas for WHO regimen recommendations or Drug-Drug Interaction safety audits.

---

## 🚀 Getting Started & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher
- **Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)

### Installation
1. Clone the repository or open the project in AI Studio:
   ```bash
   git clone <repository-url>
   cd carebridge-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000`.

---

## 🔒 Security, Privacy & Safety Notes

- **Clinical Disclaimer**: AI Disease Intelligence recommendations and Drug-Drug Interaction analyses are powered by AI models and clinical reference databases for informational and adherence-assistive purposes. Always consult a licensed medical professional before altering prescription regimens.
- **Server-Side API Key Security**: The `GEMINI_API_KEY` is strictly managed server-side in Node.js/Express routes and is never exposed to client-side browsers.
- **Role-Based Access Control**: Firestore security rules restrict medical file access, patient profiles, and medication regimens to verified caregiver-patient pairings.
