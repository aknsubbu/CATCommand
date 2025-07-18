# CAT Command: Your Daily Operations Assistant

CAT Command is a modern, mobile-first operations assistant for heavy equipment and industrial environments. Built with Expo, React Native, and Firebase, it provides real-time alert monitoring, operator training, task estimation, offline queueing, and robust admin tools—all with a branded CAT (Caterpillar) look and feel.

---

## 🚀 Overview

CAT Command streamlines daily operations for equipment operators, supervisors, and admins. It features:
- **Real-time alert monitoring** from machine data (CSV import)
- **Operator training modules** with progress tracking
- **Task time estimation** based on historical data
- **Offline queue** for robust async operations
- **Admin dashboard** for managing operators, machines, and work orders
- **User profile and settings**
- **Voice notes** and speech recognition (where supported)

---

## ✨ Features

- **Alert Center:** Upload machine CSV data to monitor for safety, maintenance, and efficiency alerts. Critical alerts and training suggestions are announced audibly.
- **Training Hub:** Browse, launch, and track progress on training modules (video, document, quiz). Mark modules as complete and view prerequisites.
- **Task Estimator:** Enter load cycles to get time estimates based on historical machine data.
- **Offline Queue:** Add, view, and process queued actions for robust offline support.
- **Admin Tools:** Create, update, and view operators, machines, and work orders. Batch operations and activity logs included.
- **Profile & Settings:** Manage account info, preferences (dark mode, language, voice assistant), and sign out securely.
- **Voice Notes:** Record, transcribe, and manage voice notes (requires compatible build).

---

## 🖥️ Main Screens

- **Home:** Dashboard for work orders and quick actions
- **Explore:** Admin dashboard for database management
- **Async:** Offline queue management and testing
- **Tasks:** Task time estimator
- **Alerts:** Real-time alert monitoring from CSV
- **TrainingHub:** Training module browser
- **TrainingModule:** Detailed training module view
- **Profile:** User profile and settings

---

## 🛠️ Setup & Installation

1. **Clone the repo:**
   ```bash
   git clone <your-repo-url>
   cd CATCommand
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Create a `.env` file or set the following in your environment (see `config/firebase.ts`):
     - `EXPO_PUBLIC_FIREBASE_API_KEY`
     - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `EXPO_PUBLIC_FIREBASE_DATABASE_URL`
     - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
     - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `EXPO_PUBLIC_FIREBASE_APP_ID`
     - `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`

4. **Start the app:**
   ```bash
   npx expo start
   ```
   - Open in Expo Go, iOS Simulator, or Android Emulator.

---

## ⚙️ Scripts

- `npm start` — Start Expo development server
- `npm run android` — Run on Android device/emulator
- `npm run ios` — Run on iOS simulator
- `npm run web` — Run in web browser
- `npm run lint` — Lint codebase
- `npm run reset-project` — Reset to a blank project (see scripts/reset-project.js)

---

## 🌐 Environment Variables

Set the following for Firebase integration (see `config/firebase.ts`):
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_DATABASE_URL`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`

---

## 🏗️ Tech Stack

- **React Native** (Expo)
- **TypeScript**
- **Firebase** (Auth, Firestore, Storage)
- **Expo Router** (file-based navigation)
- **AsyncStorage** (offline support)
- **Speech Recognition** (optional, via `@jamsch/expo-speech-recognition`)
- **PapaParse** (CSV parsing)
- **Other:** Expo Haptics, Expo Location, Expo Document Picker, etc.

---

## 🎨 Branding & Theme

- **CAT Colors:**
  - Primary: #FFCD11 (CAT Yellow)
  - Secondary: #000000 (Black)
  - Status: Orange, Green, Red, Blue for various states
- **Typography:** Clean, readable, modern
- **UI:** Rounded corners, subtle shadows, modern mobile look

---

## 📁 Folder Structure

- `app/` — Main app screens and navigation
- `components/` — Reusable UI components (e.g., VoiceNotes, MapView)
- `services/` — Business logic, API, and Firebase integration
- `contexts/` — React context providers (e.g., Auth)
- `constants/` — Theme, colors, strings
- `config/` — Firebase and other config
- `archive/` — Legacy/experimental screens
- `assets/` — Images, fonts
- `scripts/` — Project scripts

---

## 📝 License

This project is for demonstration and educational purposes. For commercial use, please contact the author or your organization’s legal team.

---

## 🙏 Acknowledgements

- Inspired by Caterpillar’s commitment to safety, efficiency, and operator empowerment.
- Built with [Expo](https://expo.dev/), [Firebase](https://firebase.google.com/), and the open-source community.
