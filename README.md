# 🍽️ Advait Artisanal Indian Kitchen — Full-Stack QR Dine & Back-Office Web App

> A production-grade, Apple Human Interface Guidelines (HIG)-compliant Progressive Web App built strictly according to the **"PRD: QR Ordering & Back-Office Web App for Local Restaurants"**, completely localized for the Indian culinary and business ecosystem in **Indian Rupees (₹)** with an official **FSSAI Verified Chef Accreditation Portal**.

---

## 🌟 Production Architecture & Zero-Auth Customer Experience

Advait Artisanal Indian Kitchen replaces traditional paper order pads, noisy shouting, manual cash calculations, and chaotic month-end aggregator crunches with an integrated, multi-role operating system strictly adhering to the **PRD: QR Ordering & Back-Office Web App for Local Restaurants**:

1. **Zero-Auth Customer QR Menu (`/?table=04`)**:
   - **No login options visible**: Diners cannot see any options to log in to counter, admin, or staff interfaces.
   - **Walk-in Table QR Scanning**: Automatically detects table number from QR code (or allows table selection).
   - **Bilingual Interface**: Seamless 1-tap toggle between **English** and **हिन्दी (Hindi)** (PRD Section 7 requirement).
   - **Effortless Ordering**: Diners enter their name, add items with per-item cooking notes ("less spicy", "Jain prep", "extra crisp"), and add overall service notes.
   - **Upsell Suggestables (FR-C8)**: Automatic chef pairing suggestions configured by the restaurant.
   - **Payment Choice (FR-C7)**:
     - **Pay at Counter (Default)**: Cash or Card at counter.
     - **Instant UPI QR & Deep Link**: Dynamic high-resolution QR code generated for the exact bill amount + 1-tap UPI deep link (`upi://pay?pa=...`) for GPay, PhonePe, Paytm, and CRED.
   - **Real-Time 4-Stage Status Tracking (FR-C6)**: Received ➔ Accepted & Cooking ➔ Ready to Serve ➔ Completed, plus instant "Call Server" table notification button.
2. **Floor Staff & Workstation Access (Role-Based Access Control)**:
   - Staff and owners access dedicated workstation screens through direct URLs or hash routes:
     - `/counter` or `#/counter` (Live Counterperson POS & Cashier)
     - `/kds` or `#/kds` (Kitchen Display System)
     - `/admin` or `#/admin` (Owner Executive Back-Office)
     - `/portal` or `#/portal` (Floor Staff Station Portal)
   - **Enforced Access Matrix**:
     - 👑 **Owner Admin (PIN: `8821`)**: Full master access. Can log in and switch between **Admin**, **Counter POS**, and **Kitchen KDS**.
     - 💼 **Counter Person (PIN: `4421`)**: Can log in to **Counter POS** and **Kitchen KDS** ONLY. Admin Back-Office is strictly blocked.
     - 🍳 **Kitchen Staff (PIN: `7700`)**: Station-locked to **Kitchen KDS** ONLY. Blocked from both Admin and Counter POS.
   - Workstation banner displays operator name, live online status, role-filtered station switcher, sound alert mute toggle, table standee QR generator, and an "Exit Station / Lock" button to safely return to the diner menu.
3. **Real-Time Cross-Tab / Cross-Device Synchronization**:
   - Powered by `BroadcastChannel` with storage fallbacks (<50ms latency).
   - Placing an order from a diner's phone or tab instantly triggers a kitchen bell chime on the counter POS tab and immediately updates the live stack, unaccepted order counter, and owner sales dashboard.
   - Counterperson status updates (Accept ➔ Ready ➔ Done) immediately reflect on the diner's live tracking screen without refreshing.
4. **Counterperson Interface (FR-P1 to FR-P8)**:
   - Live order stack with audible chime and visual alerts.
   - Overdue unaccepted order warning (alerts if an order sits unaccepted for > 2 mins per PRD Section 16).
   - One-tap status pipeline (Accept, Ready, Done, Reject with reason).
   - Direct manual order punching (FR-P7) for phone/walk-in orders.
   - Inline menu stock toggle and price editing (FR-P4).
   - Daily Closing EOD Checklist (FR-P8 & 5.4) verifying expected vs actual cash, card, and UPI with ₹200 threshold variance audit checks.
5. **Owner Admin Back-Office (FR-A1 to FR-A7 & 5.4)**:
   - Sales dashboard (today, week, month split by Cash, Card, UPI).
   - Order history with instant CSV export.
   - Daily P&L statement with manual expense entry (ingredients, LPG gas, rent, staff food, maintenance).
   - Cash vs Profit & Obligations alert (checks cash-in-hand + pending Zomato/Swiggy receivables against upcoming rent, payroll, and EMI commitments).
   - Top selling items & peak rush hours distribution.
   - Customer page customizer (theme accent, branding, menu layout grid/list).
   - Statutory Indian payroll assistant (PF 12%, ESI 0.75%, TDS) with payslip exports.
   - Bank reconciliation, inventory & wastage, multi-branch, and accounting export (Tally Prime XML & Zoho Books CSV).

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
