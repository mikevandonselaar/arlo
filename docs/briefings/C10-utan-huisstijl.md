# BRIEFING C10 — utan-huisstijl doorvoeren in de app

## Context (repo-check 11 okt 2026)
- Stack: Vite 6 + React 19 + TypeScript + Tailwind 4 + Supabase + PWA (vite-plugin-pwa) + Vercel functions (api/vision.ts, api/resolve-url.ts). Geen Next.js.
- Actieve branch: master. Branches arlo-alpha-redesign en dev.redesign zijn verouderd.
- Branch google-auth-fix (commit 3565eea, fix bad_oauth_state: auth-endpoints uitsluiten van service-worker-caching in vite.config.ts) is NIET gemerged in master.
- Live: arlo-shopping.vercel.app.
- CLAUDE.md beschrijft nog het oude KODA-prototype (Londen, groen #51EAA7) en klopt niet meer.

## Volgorde
1. Merge google-auth-fix in master als aparte, kleine PR. Vertel me hoe ik Google-login test op productie.
2. Werk CLAUDE.md bij naar de echte stack, structuur en de naam utan.
3. Maak branch utan-rebrand vanaf master en voer de punten hieronder door.

## 1. Naam
- Alle zichtbare teksten "arlo", "arlo.", en restanten van "Haul" of "KODA" → "utan" (lopende tekst, kleine letters, geen punt).
- Logo/header: "UTAN" (hoofdletters) via een <Wordmark />-component (zie 4). Vervangt het huidige logo.
- Metadata: <title>, meta description, PWA-manifest (name, short_name, iconen in de vite-plugin-pwa-config), Open Graph-tags.
- NIET aanpassen: repo-naam, interne variabelen, databasetabellen, Vercel-projectnaam.

## 2. Design tokens
Verwijder alle oude merkkleuren, fonts en assets: #651610 (rood), #FFC8FF (roze), #51EAA7 (groen), #aab2ff (lavendel), Sugo Pro Display, wave pattern, tas-mascotte, Haul- en arlo-logo's.
Definieer de tokens op één centrale plek (Tailwind 4 @theme, of tailwind.config.js als die actief gebruikt wordt):
- bg #F7F6F2 — achtergrond overal
- ink #0B0B0B — tekst, lijnen, secundaire knoppen
- muted #6B6A66 — data, hulptekst
- line rgba(11,11,11,0.12) — scheidingslijnen
- accent #1F2BFF — alleen functioneel (zie 5)
- on-accent #FFFFFF — tekst op accent
Knoppen radius 2px. Geen schaduwen, geen gradients. Alleen licht thema; een eventuele dark-mode-toggle uitschakelen.

## 3. Typografie
- Familjen Grotesk (400, 500, 700): alle UI-tekst, koppen, prijzen, wordmark.
- DM Mono (400, 500): data (maat, EAN, ordernummer, tijden, status), meestal hoofdletters, 11–12px.
- Zelf hosten via @fontsource/familjen-grotesk en @fontsource/dm-mono, NIET via de Google Fonts-CDN (AVG).
- Schaalcontrast: per scherm één element heel groot (prijs of "Gekocht."), bv. 56px, line-height 0.9, letter-spacing -0.05em. De rest klein.

## 4. Wordmark (tijdelijk)
- <Wordmark />: tekst "UTAN", Familjen Grotesk 500, letter-spacing 0.04em, kleur ink (of on-accent op blauw).
- Zo bouwen dat de tekst later met één wijziging vervangen wordt door een logo-SVG.
- Favicon en app-icoon tijdelijk: witte "U" in Familjen Grotesk op #1F2BFF.

## 5. Kleurregel
accent alleen op: de scanhoeken, de primaire knop ("Koop"), status-stippen en geselecteerde toestanden. Al het andere is ink op bg. Geen emoji, geen illustraties.

## 6. Scanscherm (components/CameraScanner.tsx)
- Zoeker: vier hoekjes in accent, lijndikte 2px.
- Bij herkenning: hoeken klikken iets naar binnen (150–200ms, ease-out, Framer Motion) en waar ondersteund navigator.vibrate(10).

## 7. Het blauwe moment
- Op het bevestigingsscherm na een aankoop (nu de mock-checkout in CartPage): het HELE scherm wordt accent, met witte tekst "Gekocht. Zonder tas." groot, en eronder in DM Mono een order- en bezorgregel.
- Komt binnen met een veeg van onder naar boven (~250ms). Respecteer prefers-reduced-motion.
- Dit is het enige volledig blauwe scherm.

## 8. Copy
Kort, feitelijk, Nederlands, geen uitroeptekens. Bv.: "Koop", "Gekocht. Zonder tas.", "Thuis morgen", "Niet meer op voorraad in maat M", "Gescand".

## Klaar wanneer
- [ ] google-auth-fix gemerged, Google-login getest
- [ ] CLAUDE.md bijgewerkt
- [ ] Nergens in de UI nog "arlo", "Haul" of "KODA"
- [ ] Oude kleuren, fonts, wave pattern, mascotte en logo's verwijderd
- [ ] Tokens centraal, geen losse hex-waarden in componenten
- [ ] Fonts zelf gehost
- [ ] Scanscherm, productscherm, winkelmand en bevestiging (blauwe moment) omgezet
- [ ] Screenshots van die vier schermen
- [ ] Scanflow werkt nog (vision + resolve-url)

## Werkafspraak
Stel per stap eerst een plan voor en wacht op akkoord voordat er iets wijzigt. Geen functionele wijzigingen, alleen naam, uiterlijk en copy. De layout blijft zoals hij is.
