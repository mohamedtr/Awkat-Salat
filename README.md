# 🕌 Mosque Prayer Display (Professional Edition)

A premium, high-fidelity **Offline-First PWA** designed for professional mosque displays and TVs. Built with **React** and **Vite**, it offers massive visibility, smart religious modes, and a stunning glassmorphism design.

---

## ✨ Key Features

### 📺 1. TV & Kiosk Optimized
- **Massive Visibility**: Ultra-large digital clock (13rem) and prayer cards designed to be legible from the back of any prayer hall.
- **Auto-Fullscreen**: Built-in support for browser Fullscreen API for a clean, borderless display.
- **High Contrast**: Dynamic dark overlays and text-shadows ensure perfect readability over any background image.

### 📱 2. Responsive Dual-Design
- **TV/PC Layout**: A massive, high-impact dashboard for landscape displays.
- **Mobile Layout**: A specialized, vertically-optimized "One-Page" list view that fits perfectly on a phone screen without scrolling.
- **Smart GPS Resolver**: Automatically resolves the nearest city name from GPS coordinates for personalized location display.

### 🌙 2. Smart Religious Modes
- **Automatic Ramadan Mode**: Detects the Hijri month (9) to:
  - Display **Imsak** (Fajr - 10m).
  - Rename Maghrib to **Iftar (إفطار)**.
  - Show a gold pulsing "Ramadan Mubarak" banner.
- **Friday (Jumu'ah) Mode**: Automatically detects Friday to:
  - Rename Dhuhr to **Jumu'ah (الجمعة)**.
  - Apply a high-contrast highlight to the Jumu'ah card.
  - Display a Jumu'ah Mubarak banner with helpful reminders.
  - **Special Hadith**: Replaces the center mosque verse with the Hadith about reading **Surat Al-Kahf** (available in 3 languages).

### 🛡️ 3. Industrial-Scale Stability
- **Offline Fallback System**: The app caches last valid prayer times and locations locally. If GPS fails or internet is lost, it silently swaps in the cache to prevent any display crashes.
- **GPS Auto-Detection**: One-click onboarding wizard for mosques to set their exact location via browser geolocation.

### 🎛️ 4. Advanced Customization
- **Multilingual**: Full RTL/LTR support for **Arabic, English, and French**.
- **Iqama Control**: 3-tier Iqama calculation (Fixed Time, Minutes After Athan, or Minutes Before Next Prayer).
- **Iqama Focus Mode (TV/PC)**: A premium "Blackout" screen that triggers before Iqama to remind worshippers to silence phones and focus. Includes a large golden digital countdown timer.
- **Background Gallery**: Upload your own mosque images or use built-in professional Islamic photography.
- **News Ticker**: Integrated bottom marquee for mosque lessons, announcements, and news.
- **Massive Hadith Library**: 100 curated, authentic Ahadith rotating at the bottom with trilingual translations (Arabic with Harakat, English, and French).

---

## 🛠️ Technology Stack

- **Framework**: [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Prayer Engine**: [Adhan.js](https://github.com/batoulapps/adhan-js)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (with Persistence)
- **Internationalization**: [i18next](https://www.i18next.com/)
- **Styling**: Vanilla CSS (Premium Glassmorphism)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Utilities**: [date-fns](https://date-fns.org/)

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/mohamedtr/Awkat-Salat.git
cd mosque-prayer-times
npm install
```

### 2. Development
Run the local development server:
```bash
npm run dev
```

### 3. Production Build
Build for production (PWA ready):
```bash
npm run build
```

---

## 🌍 Localization

The app detects the browser language on first launch but allows manual switching in the settings.
- **Arabic**: Primary RTL mode with optimized typography (`Tajawal` & `Amiri` fonts).
- **English/French**: Premium LTR mode with clean `Inter` typography.

---

## 📄 License
This project is for educational and community use. Please ensure you respect local prayer calculation methods before using it in a live mosque environment.

---

*Made with ❤️ for the Muslim Ummah.*
