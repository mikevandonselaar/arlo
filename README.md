# Arlo — KODA In-Store Shopping App

A React mobile app prototype for an in-store barcode scanning shopping experience branded **KODA**. Shoppers walk into physical retail stores, scan product EAN barcodes with their phone camera, and build a cross-store cart — all fulfilled and shipped by KODA.

The app renders as a 390×844px iPhone mockup with a Dynamic Island and home indicator bar.

---

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Animations | Framer Motion / `motion/react` |
| Icons | Lucide React |
| Toasts | Sonner |
| Auth + DB | Supabase |
| Build tool | Vite |
| PWA | vite-plugin-pwa |

---

## Prerequisites

- **Node.js** v18 or later
- **npm** (bundled with Node)
- A **Supabase** project (for auth and data)

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd arlo
npm install
```

### 2. Configure environment variables

Copy the example below into a `.env` file at the project root:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Optional — used for AI-powered product lookup
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

> The OpenAI and Anthropic keys are proxied through Vite's dev server (`/api/openai` and `/api/anthropic`) so they are never exposed to the browser directly.

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally for final checks |

---

## Project Structure

```
arlo/
├── App.tsx                  # Root: session check → sign-in or main app
├── main.tsx                 # React entry point
├── components/
│   ├── SignInScreen.tsx      # Auth flow (email, Google OAuth, username pick)
│   ├── MainApp.tsx           # App shell: iPhone frame, bottom nav, cart state
│   ├── HomePage.tsx          # Landing page with brand carousel
│   ├── HomeCarousel.tsx      # Swipeable campaign cards
│   ├── CameraScanner.tsx     # Camera feed, barcode scan, product drawer
│   ├── CartPage.tsx          # Cart grouped by brand, quantity controls, checkout
│   ├── ProfilePage.tsx       # User profile view
│   ├── ui/                   # shadcn/ui component library
│   └── figma/                # Figma-specific helpers (ImageWithFallback)
├── lib/
│   ├── auth.ts               # Supabase session helpers
│   ├── supabase.ts           # Supabase client
│   ├── cart.ts               # Cart logic
│   ├── api.ts                # Generic fetch helpers
│   ├── vision.ts             # Barcode / product image recognition
│   ├── claude.ts             # Anthropic Claude integration
│   ├── currency.tsx          # Price formatting
│   └── theme.tsx             # Theme utilities
├── screens/
│   └── HeadsUpScreen.tsx     # Full-screen contextual overlays
├── assets/                   # Static images
├── guidelines/               # Design guidelines reference
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## Key Concepts

**Cart keying** — the cart is keyed on `(productId, scannedAt)`. The same product scanned at two different stores appears as two separate line items, reflecting which store fulfilled the order.

**Barcode scanning** — `CameraScanner.tsx` currently simulates scanning via `simulateScan()`, which picks a random EAN from a hardcoded `productDatabase`. Real camera-based barcode decoding is not yet wired up.

**Authentication** — Supabase handles email/password and Google OAuth. On first OAuth sign-in the user is prompted to pick a username before reaching the main app.

**PWA** — The app is configured as a Progressive Web App. Running `npm run build` produces a service worker that precaches all static assets and uses a network-first strategy for Supabase requests.

---

## Design Language

| Token | Value |
|---|---|
| Primary accent | `#51EAA7` (green) |
| Secondary accent | `#aab2ff` (lavender) |
| Tertiary accent | `#eca0ff` (purple/pink) |
| Background | `#F5F5F7` (light grey) |

Heavy use of `font-black`, `rounded-[40px]` corners, and glassmorphism (`backdrop-blur`). London-based store locations throughout (Soho, Shoreditch, Oxford St, Regent St).
