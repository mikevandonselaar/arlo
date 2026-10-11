# utan

Mobiele web-app (PWA) voor winkelen in fysieke winkels zonder tas: fotografeer een kledingstuk en het label, utan leest het product uit, zet het in je winkelmand en zoekt het online op.

De app heette eerder arlo; de repo en het Vercel-project heten nog zo. Stack, structuur en huisstijl staan in [CLAUDE.md](CLAUDE.md).

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
│   ├── MainApp.tsx           # App shell: bottom nav, cart state
│   ├── Wordmark.tsx          # Temporary "UTAN" text wordmark
│   ├── PurchaseConfirmation.tsx  # Full-blue confirmation screen
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
│   └── currency.tsx          # Currency preference
├── screens/
│   └── HeadsUpScreen.tsx     # Full-screen contextual overlays
├── assets/                   # Static images
├── guidelines/               # Design guidelines reference
├── vite.config.ts
└── package.json
```

---

## Huisstijl

Tokens, typografie, kleurregel en copy: zie [CLAUDE.md](CLAUDE.md). De tokens zelf staan in `styles/globals.css`.
