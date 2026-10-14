# 🍽️ Advait Artisanal Indian Kitchen — Full-Stack QR Dine & Back-Office Web App

> A production-grade, Apple Human Interface Guidelines (HIG)-compliant Progressive Web App built strictly according to the **"PRD: QR Ordering & Back-Office Web App for Local Restaurants"**, completely localized for the Indian culinary and business ecosystem in **Indian Rupees (₹)** with an official **FSSAI Verified Chef Accreditation Portal**.

---

## 🌟 Executive Overview

Advait Artisanal Indian Kitchen replaces traditional paper order pads, noisy shouting, manual cash calculations, and chaotic month-end aggregator crunches with an integrated, multi-role operating system:

1. **Customer QR Menu**: Zero app install. Diners scan a table QR code, browse categories, filter Pure Veg / Non-Veg, specify cooking preferences ("Jain prep", "Less spicy"), track order status in real time, and pay via instant UPI QR (`advaitkitchen@icici`) or at the counter.
2. **Official FSSAI Verified Chef Portal**: Diners can verify Executive Chef Rakesh Sharma's government license (`#FSSAI-LIC-10026011009821`), 99.4% 5-Star Clean Dining score, IHM Pusa & ITC Maurya credentials, and cryptographic audit hash (`0x8f9c...4b12`).
3. **Live Order Counter**: Fast, one-touch order acceptance, status pipeline (Accept ➔ Ready ➔ Done ➔ Reject), inline menu price editing, walk-in POS order punching, and end-of-day cash reconciliation with ₹200 threshold variance alerts.
4. **Kitchen Display System (KDS)**: Station routing (Tandoor, Curry & Mains, Beverage Bar, Dessert Pantry), prep timers with color-coded urgency alerts, and one-touch bump bar.
5. **Hardware & Thermal Printer Engine**: ESC/POS thermal printing for 80mm and 58mm guest GST tax invoices and Kitchen Order Tickets (KOT).
6. **WhatsApp Order Alerts Simulator**: Direct WhatsApp Business notification updates for diners and owner daily closing summaries.
7. **Bank Statement CSV Reconciliation**: Current account statement import with auto-matching against cash deposits, UPI batches, and card settlements (detecting 1.5% MDR fees).
8. **Owner Admin Back-Office**: Daily gross sales vs. expenses P&L graph, cash vs. obligations warning system (Rent ₹45k, Payroll ₹106k, EMI ₹18k), statutory Indian payroll assistant (PF 12%, ESI 0.75%, TDS) with direct bank transfer batch export.
9. **Scale & Intelligence (Phase 3)**:
   - Raw ingredient inventory with wastage & spoilage tracking.
   - Diners Club & Loyalty Points (1 pt per ₹10 spent, Silver/Gold/Platinum tiers).
   - Zomato & Swiggy aggregator weekly settlement reconciliation with dispute detection.
   - Multi-branch network management (Connaught Place New Delhi, DLF Cyber Hub Gurugram, Indiranagar Bengaluru).
   - 1-click accounting export to **Tally Prime XML** and **Zoho Books CSV**.

---

## 📱 Visual System & HIG Architecture

- **Aesthetic**: Apple Human Interface Guidelines (HIG) with subtle glassmorphism (`backdrop-filter: blur(20px)`), soft gradient cards, and rounded corners (`border-radius: 20px`).
- **Interactive Frame**: Switchable between an **iPhone 16 Pro Frame** (with Dynamic Island, live status bar, and home indicator) and **Full Desktop Screen**.
- **Currency**: Everything in **Indian Rupees (₹)**.
- **Sound Alerts**: Web Audio API two-tone bell chime for incoming orders and status transitions.
- **Language**: English with authentic Indian culinary nomenclature.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, Vanilla CSS (Design Tokens, Glassmorphism, Micro-interactions)
- **Icons**: Lucide React
- **Celebratory Effects**: Canvas Confetti
- **Audio**: Web Audio API (zero external mp3 assets needed)
- **Data Layer**: Reactive LocalStorage synchronization with versioned key migration

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
# Clone repository
git clone https://github.com/Trickycube99/Restraunt-Web-app.git
cd Restraunt-Web-app

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Building for Production
```bash
npm run build
```

### ☁️ Deploying to Vercel

The repository includes a production-ready `vercel.json` configured for Vite SPA routing and asset caching.

#### Method 1: 1-Click via Vercel Dashboard (Recommended)
1. Navigate to [vercel.com/new](https://vercel.com/new).
2. Import your GitHub repository: `Trickycube99/Restraunt-Web-app`.
3. Vercel automatically selects the **Vite** framework preset with `npm run build` and output directory `dist`.
4. Click **Deploy** — your restaurant web app will be live with full HTTPS and worldwide CDN edge routing in under 60 seconds!

#### Method 2: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy directly
vercel
```

---

## 📂 Project Structure

```
├── public/
│   └── assets/                     # Food photography & Chef portraits
├── src/
│   ├── components/
│   │   ├── BottomNav.jsx           # iOS Bottom Dock navigation
│   │   ├── Header.jsx              # iOS Navigation Bar & Table Switcher
│   │   ├── IosFrame.jsx            # iPhone 16 Pro Frame with Dynamic Island
│   │   ├── PrinterModal.jsx        # 80mm/58mm ESC/POS Thermal Receipt & KOT
│   │   └── WhatsAppAlertModal.jsx  # WhatsApp Business Order Alert Simulator
│   ├── data/
│   │   └── initialData.js          # Menu, Chef credentials, Orders, Staff, Obligations
│   ├── utils/
│   │   ├── accountingExport.js     # Tally Prime XML & Zoho Books CSV generators
│   │   ├── audio.js                # Web Audio API alert chimes
│   │   └── storage.js              # LocalStorage persistence & INR migration
│   ├── views/
│   │   ├── AboutChefView.jsx       # Official FSSAI Verified Chef Accreditation Portal
│   │   ├── AdminView.jsx           # Owner Admin Dashboard, P&L, Obligations & Payroll
│   │   ├── AggregatorReconciliationView.jsx # Zomato & Swiggy Payout Audit
│   │   ├── BankReconciliationView.jsx # Bank Statement CSV Reconciliation
│   │   ├── CounterView.jsx         # Live Order Counter, POS Punch & EOD Checklist
│   │   ├── CustomerView.jsx        # Customer QR Menu, Cart, UPI QR & Live Tracker
│   │   ├── InventoryView.jsx       # Raw Ingredients Stock & Kitchen Wastage Logger
│   │   ├── KdsView.jsx             # Kitchen Display System (KDS) Station Router
│   │   ├── LoyaltyView.jsx         # Diners Club & VIP Rewards Vouchers
│   │   └── MultiBranchView.jsx     # Multi-Branch Outlets Management (NCR & BLR)
│   ├── App.css
│   ├── App.jsx                     # Master Role Router & State Store
│   ├── index.css                   # iOS HIG Design System & Styling Tokens
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

## 📜 License & Compliance

- Built under FSSAI Clean Street Food & Dining Guidelines.
- Adheres to Indian Digital Personal Data Protection (DPDP) standards.
