# utan

## Wat dit project is

**utan** is een mobiele web-app (PWA) voor winkelen in fysieke winkels zonder tas.
Je fotografeert in de winkel een kledingstuk, de barcode en het label; de app leest
daar merk, naam, prijs, maat en EAN uit en zet het stuk in je winkelmand. Daarna zoekt
utan het product online op, zodat het thuis bezorgd kan worden.

De app heette eerder **arlo** (en daarvoor Haul en KODA). Die namen, kleuren en logo's
zijn vervallen. Kom je ze nog tegen in zichtbare tekst of styling: vervangen.

**Niet hernoemen:** de repo-naam (`arlo`), `package.json`-naam, interne variabelen,
localStorage-sleutels (`arlo-auth`, `arlo-cart-queue`, …), databasetabellen en het
Vercel-project (`arlo-shopping.vercel.app`). Hernoemen daarvan logt gebruikers uit of
breekt de deploy.

De briefing achter de huisstijl staat in `docs/briefings/C10-utan-huisstijl.md`.

## Tech stack

- Vite 6 + React 19 + TypeScript (geen Next.js, geen `tsconfig`; `npm run build` = `vite build`)
- Tailwind CSS 4 via `@tailwindcss/postcss`; tokens in `styles/globals.css` (`@theme`).
  Er is geen `tailwind.config.js`.
- shadcn/ui in `components/ui/`. Alleen `button`, `input` en `label` worden gebruikt;
  de rest is ongebruikte bibliotheekcode.
- Supabase: auth (e-mail + Google OAuth) en data (`profiles`, `users`, `carts`, `cart_items`,
  zie `lib/migrations.sql`)
- Vercel functions in `api/`: `vision.ts` (label uitlezen via OpenAI/Anthropic) en
  `resolve-url.ts` (productpagina online vinden)
- PWA via vite-plugin-pwa (`vite.config.ts`)
- `motion/react` voor beweging, Lucide voor iconen, Sonner voor toasts
- Fonts zelf gehost via `@fontsource/familjen-grotesk` en `@fontsource/dm-mono`
  (geïmporteerd in `main.tsx`). Geen Google Fonts-CDN, vanwege de AVG.

API-sleutels voor OpenAI en Anthropic horen server-side in `api/vision.ts` (Vercel
environment variables). De `VITE_`-varianten in `lib/vision.ts` zijn alleen voor lokaal
ontwikkelen via de Vite-proxy.

## Structuur

```
App.tsx                  sessiecheck → SignInScreen of MainApp; Toaster
main.tsx                 entry; laadt fonts en index.css
index.css                Tailwind-import + safe-area
styles/globals.css       utan-tokens (@theme), type-hero, type-data
components/
  Wordmark.tsx           tijdelijke tekst-wordmark "UTAN"
  SignInScreen.tsx       landing, account maken, gebruikersnaam, inloggen
  MainApp.tsx            schil: pagina-state, winkelmand-state, navigatiebalk
  HomePage.tsx           één scrollpagina: welkom + "Wat je kunt verwachten"
  CameraScanner.tsx      camera, drie foto's, analyse, bewerkbare resultaatlade
  CartPage.tsx           winkelmand per merk, productdetail, fotoviewer
  PurchaseConfirmation.tsx  het blauwe moment
  ProfilePage.tsx        gebruikersnaam, bestellingen (binnenkort), uitloggen
  ui/                    shadcn/ui
screens/HeadsUpScreen.tsx  alpha-disclaimer + feedback
lib/
  auth.ts  supabase.ts   sessie, profiel, OAuth
  cart.ts                winkelmand in Supabase + lokale wachtrij bij offline
  vision.ts  claude.ts   label uitlezen (dev: Vite-proxy, prod: /api/vision)
  resolveUrl.ts          client voor /api/resolve-url
  currency.tsx           valuta (standaard EUR; geen keuze meer in de UI)
api/                     Vercel functions
scripts/generate-icons.mjs  favicon, app-iconen en og-image uit het font
```

Navigatiebalk: `Home · Scan · Cart · Profile`. De winkelmand is gesleuteld op
`(id, scannedAt)`: hetzelfde product uit twee winkels geeft twee regels.

Afrekenen bestaat nog niet. De knop `Buy` is in productie uitgeschakeld; in een
dev-build opent hij het bevestigingsscherm zodat het ontwerp te bekijken is
(`CHECKOUT_PREVIEW` in `CartPage.tsx`).

## Huisstijl

### Tokens

Eén bron: `@theme` in `styles/globals.css`. **Geen hex-waarden in componenten.**

| Token | Waarde | Klasse | Gebruik |
|---|---|---|---|
| bg | `#F7F6F2` | `bg-bg` | achtergrond, overal |
| ink | `#0B0B0B` | `text-ink`, `border-ink` | tekst, lijnen, secundaire knoppen |
| muted | `#6B6A66` | `text-muted` | data, hulptekst |
| line | `rgba(11,11,11,0.12)` | `border-line`, `bg-line` | scheidingslijnen, kaderranden |
| accent | `#1F2BFF` | `bg-accent`, `text-accent` | alleen functioneel, zie hieronder |
| on-accent | `#FFFFFF` | `text-on-accent` | tekst op accent, en op het camerabeeld |

De waarden staan ook in `index.html`, `public/manifest.json`, `vite.config.ts`
(theme-color) en `scripts/generate-icons.mjs`. Die kunnen geen CSS-variabelen lezen;
houd ze gelijk.

### Kleurregel

Accent staat alleen op:
- de vier scanhoeken
- de primaire knop van een scherm (`Buy`, `Start camera`, `Create account`)
- status-stippen (`Scanned`, teller op de mand)
- geselecteerde toestanden (actieve tab)

Al het andere is ink op bg. Geen emoji, geen illustraties, geen schaduwen, geen
gradients, geen `backdrop-blur`. Alleen licht thema: geen `dark:`-klassen in nieuwe code.

Het bevestigingsscherm na een aankoop is het **enige** volledig blauwe scherm.

### Typografie

- **Familjen Grotesk** (400, 500, 700): alle UI-tekst, koppen, prijzen, wordmark.
  Standaardgewicht voor nadruk is 500; geen `font-black`.
- **DM Mono** (400, 500): data — maat, EAN, ordernummer, tijden, status, veldlabels.
  Gebruik `type-data` (11px, hoofdletters). `<Label>` heeft deze stijl al.
- **Schaalcontrast:** per scherm één element heel groot met `type-hero` (56px,
  line-height 0.9, letter-spacing -0.05em): de prijs, het totaal of `Bought.`.
  De rest blijft klein.

`type-hero` en `type-data` niet combineren met `text-*`-groottes of `tracking-*`.

### Vorm en beweging

- Radius 2px (`rounded-sm`) op knoppen, velden en kaders. Rond blijft alleen wat een
  cirkel is (scanknop, stippen).
- Kaders met `border border-line` in plaats van gevulde kaarten.
- Tikfeedback: `active:opacity-70`. Geen hover-effecten.
- Scanhoeken klikken bij herkenning 10px naar binnen (180ms, ease-out) en het toestel
  trilt kort (`navigator.vibrate(10)`) waar dat kan.
- Het blauwe moment veegt van onder naar boven binnen (250ms) en respecteert
  `prefers-reduced-motion`.

### Wordmark

`<Wordmark />` toont "UTAN" in Familjen Grotesk 500, letter-spacing 0.04em. Kleur komt
van de ouder (`text-ink`, of `text-on-accent` op blauw), grootte via `className`.
Zodra het echte logo er is: vervang de `<span>` in `Wordmark.tsx` door de SVG.

Favicon, app-iconen en og-image zijn tijdelijk (witte U op accent, wordmark op bg) en
komen uit `node scripts/generate-icons.mjs`.

### Copy

Alle UI-tekst is **Engels** (besluit 11 okt 2026; de briefing ging nog uit van
Nederlands). Kort, feitelijk, geen uitroeptekens. Zinnen beginnen met een hoofdletter;
de merknaam in lopende tekst is `utan` (kleine letters, geen punt).
Voorbeelden: `Buy`, `Bought. No bag.`, `Home tomorrow`, `Scanned`,
`Out of stock in size M`.

## Lokaal draaien

```
npm install
npm run dev
```

`.env` in de root (staat in `.gitignore`):

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
# optioneel, alleen voor echt scannen in dev:
VITE_OPENAI_API_KEY=
VITE_ANTHROPIC_API_KEY=
```

Zonder vision-sleutels: zet `DEV_MOCK_SCAN` in `CameraScanner.tsx` tijdelijk op `true`.
Google-login werkt lokaal alleen als de localhost-URL bij de Redirect URLs in Supabase staat.

## Werkwijze

- Stel per stap eerst een plan voor en wacht op akkoord.
- Huisstijlwerk verandert geen gedrag en geen layout: alleen naam, uiterlijk en copy.
- Controleer schermen op telefoonbreedte (375–390px).
