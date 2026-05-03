# Arlo — KODA In-Store Shopping App

## What this project is

A React **mobile app prototype** for an in-store barcode scanning shopping experience branded **KODA**. Shoppers walk into physical retail stores in London, scan product EAN barcodes with their phone camera, and build a cross-store cart — all fulfilled and shipped by KODA.

## Tech stack

- **React** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** for base UI components (`components/ui/`)
- **Framer Motion** (`motion/react`) for animations
- **Lucide React** for icons
- **Sonner** for toast notifications

## App structure

```
App.tsx              — Root: sign-in gate → MainApp
components/
  SignInScreen.tsx   — Auth screen shown before main app
  MainApp.tsx        — Shell: iPhone mockup frame, bottom nav, cart state
  HomePage.tsx       — Swipeable brand campaign carousel
  CameraScanner.tsx  — Camera feed, EAN barcode scan simulation, product drawer
  CartPage.tsx       — Cart grouped by brand, quantity controls, checkout
  ui/                — shadcn/ui component library
  figma/             — Figma-specific helpers (ImageWithFallback)
```

## Key concepts

- **Products** are identified by EAN barcode and carry a `scannedAt` store location and `shippedBy` fulfiller.
- The **cart** is keyed on `(id, scannedAt)` — the same product scanned at two different stores appears as two separate line items (see Adidas Samba scanned at Adidas Originals vs JD Sports).
- The **camera scanner** currently simulates barcode detection via a `simulateScan()` function that picks a random EAN from a hardcoded `productDatabase`. Real barcode decoding is not yet implemented.
- The entire app renders inside a **390×844px iPhone mockup** with a Dynamic Island and home indicator bar.

## Brand / design language

- Primary accent: `#51EAA7` (green)
- Secondary accent: `#aab2ff` (lavender)
- Tertiary accent: `#eca0ff` (purple/pink)
- Background: `#F5F5F7` (light grey)
- Heavy use of `font-black`, rounded corners (`rounded-[40px]`), and glassmorphism (`backdrop-blur`)
- London-based store locations throughout (Soho, Shoreditch, Oxford St, Regent St)
