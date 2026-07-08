/**
 * Vercel Edge Function — /api/resolve-url
 *
 * Resolves an EAN barcode + brand name to a direct product page URL.
 * ADR-008: drie-lagen fallback (patroon → AI product page → site-search → Google)
 *
 * API keys live exclusively here as Vercel Environment Variables:
 *   ANTHROPIC_API_KEY  — set in Vercel dashboard, never in the client bundle
 *
 * Request:  POST /api/resolve-url
 *           { ean: string, brand: string, name?: string }
 *
 * Response: { url: string, layer: 1 | 2 | 3 | 4 }
 *           { error: string } with 4xx/5xx on failure
 *
 * TODO-KOSTEN: Lagen 2/3 roepen Claude Haiku aan (~€0.001/aanroep).
 *              Finance geïnformeerd. Monitoren bij opschaling naar beta.
 * TODO-VOLGENDE-FASE: Caching van opgeloste EAN→URL in Supabase zodat
 *                     herhaalde scans van hetzelfde product laag 1 raken.
 */

export const config = { runtime: 'edge' };

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResolveRequest {
  ean: string;
  brand: string;   // Komt direct uit LabelExtraction.brand — bijv. "Zara MAN", "Adidas Superstar"
  name?: string;   // Optioneel: LabelExtraction.name — bijv. "Superstar", "Slim Fit Trousers"
}

interface ResolveResponse {
  url: string;
  layer: 1 | 2 | 3 | 4;
}

// ─── BRAND → DOMEIN NORMALISATIE ──────────────────────────────────────────────
// Vangt variaties op: "Zara MAN", "ZARA", "Zara Kids" → "zara.com"
// "Adidas Superstar", "adidas" → "adidas.nl"
// Voeg retailers toe naarmate ze relevant worden voor de alpha.

const brandDomainMap: Array<{ patterns: RegExp; domain: string }> = [
  { patterns: /\bzara\b/i,           domain: 'zara.com' },
  { patterns: /\bh\s*[&en]+\s*m\b/i, domain: 'hm.com' },
  { patterns: /\buniqlo\b/i,         domain: 'uniqlo.com' },
  { patterns: /\badidas\b/i,         domain: 'adidas.nl' },
  { patterns: /\bnike\b/i,           domain: 'nike.com' },
  { patterns: /\bpuma\b/i,           domain: 'puma.com' },
  { patterns: /\bnew\s*balance\b/i,  domain: 'newbalance.nl' },
  { patterns: /\breebok\b/i,         domain: 'reebok.nl' },
  { patterns: /\bcarhartt\b/i,       domain: 'carhartt.com' },
  { patterns: /\blevi'?s?\b/i,       domain: 'levi.com' },
  { patterns: /\btommy\s*hilfiger\b/i, domain: 'tommy.com' },
  { patterns: /\bcalvin\s*klein\b/i, domain: 'calvinklein.nl' },
  { patterns: /\bralph\s*lauren\b/i, domain: 'ralphlauren.com' },
  { patterns: /\bzalando\b/i,        domain: 'zalando.nl' },
  { patterns: /\bbol\b/i,            domain: 'bol.com' },
  { patterns: /\bamazon\b/i,         domain: 'amazon.nl' },
  { patterns: /\bwehkamp\b/i,        domain: 'wehkamp.nl' },
  { patterns: /\bbjorn\s*borg\b/i,   domain: 'bjornborg.com' },
  { patterns: /\bonly\b/i,           domain: 'only.com' },
  { patterns: /\bjack\s*[&en]+\s*jones\b/i, domain: 'jackjones.com' },
  { patterns: /\bvero\s*moda\b/i,    domain: 'veromoda.com' },
  { patterns: /\bcos\b/i,            domain: 'cos.com' },
  { patterns: /\barket\b/i,          domain: 'arket.com' },
  { patterns: /\b&other\s*stories\b/i, domain: 'stories.com' },
  { patterns: /\bmonki\b/i,          domain: 'monki.com' },
  { patterns: /\bweekday\b/i,        domain: 'weekday.com' },
  // TODO-VOLGENDE-FASE: uitbreiden op basis van scan-logs — welke brands
  // komen het vaakst voor in laag 3/4? Die als eerste toevoegen.
];

function normalizeBrandToDomain(brand: string): string {
  for (const entry of brandDomainMap) {
    if (entry.patterns.test(brand)) return entry.domain;
  }
  return 'unknown';
}

// ─── RETAILER PATROON TABEL ───────────────────────────────────────────────────
// null  = URL-patroon bestaat niet → direct naar AI (laag 2)
// fn    = deterministisch patroon → probeer direct (laag 1, €0.00)
// Retailers zonder EAN in URL krijgen null — AI is dan de enige optie.

type PatternFn = (ean: string) => string;

const retailerPatterns: Record<string, PatternFn | null> = {
  'zara.com':        null,  // Geen EAN in URL — direct naar AI
  'hm.com':          null,  // Geen EAN in URL — direct naar AI
  'uniqlo.com':      null,  // Geen EAN in URL — direct naar AI
  'adidas.nl':       null,  // Dynamische URL structuur — direct naar AI
  'nike.com':        null,  // Geen EAN in URL — direct naar AI
  'puma.com':        null,  // Geen EAN in URL — direct naar AI
  'newbalance.nl':   null,
  'reebok.nl':       null,
  'carhartt.com':    null,
  'levi.com':        null,
  'tommy.com':       null,
  'calvinklein.nl':  null,
  'ralphlauren.com': null,
  'zalando.nl':      null,  // Dynamisch — direct naar AI
  'cos.com':         null,
  'arket.com':       null,
  'stories.com':     null,
  'monki.com':       null,
  'weekday.com':     null,
  'bjornborg.com':   null,
  'only.com':        null,
  'jackjones.com':   null,
  'veromoda.com':    null,
  // Retailers waarbij EAN wél in de URL zit:
  'bol.com':     (ean) => `https://www.bol.com/nl/nl/s/?searchtext=${ean}`,
  'amazon.nl':   (ean) => `https://www.amazon.nl/s?k=${ean}`,
  'wehkamp.nl':  (ean) => `https://www.wehkamp.nl/zoeken/?query=${ean}`,
  // TODO-VOLGENDE-FASE: Bij retailer-partnerships patronen hier invullen
  // zodat die retailer nooit meer de AI-laag raakt.
};

// ─── LOGGER ───────────────────────────────────────────────────────────────────
// Alpha: logt naar Vercel logs (console).
// TODO-VOLGENDE-FASE: schrijf naar Supabase tabel `ean_resolve_log` voor analyse.
// Welke lagen worden het vaakst gebruikt per retailer? → patronen verbeteren.

function logResolve(
  ean: string,
  brand: string,
  domain: string,
  layer: 1 | 2 | 3 | 4,
  resultUrl: string
): void {
  console.log(JSON.stringify({
    event:     'ean_resolve',
    ean,
    brand,
    domain,
    layer,
    resultUrl,
    timestamp: new Date().toISOString(),
  }));
}

// ─── LAAG 1: HARDCODED PATROON ────────────────────────────────────────────────

function tryPatternLayer(ean: string, domain: string): string | null {
  if (domain === 'unknown') return null;
  const pattern = retailerPatterns[domain];
  if (pattern === undefined) return null; // Onbekende retailer → AI
  if (pattern === null)      return null; // Expliciet null → AI
  return pattern(ean);
}

// ─── LAAG 2: AI — DIRECTE PRODUCT PAGE ───────────────────────────────────────
// Claude Haiku probeert een directe product page URL te reconstrueren.
// Geeft ook de productnaam mee voor retailers zonder EAN in de URL (Zara, etc.).
// Antwoord: alleen de URL, of exact "FALLBACK".
// TODO-KOSTEN: ~€0.001 per aanroep — verwaarloosbaar in alpha.

async function tryAiProductPage(
  ean: string,
  brand: string,
  name: string,
  domain: string,
  apiKey: string
): Promise<string | null> {
  const domainHint = domain !== 'unknown'
    ? `The retailer is ${domain}.`
    : `The retailer is unknown — use the brand "${brand}" to determine the most likely retailer.`;

  const prompt =
    `A customer scanned a clothing item in a physical store.\n` +
    `EAN barcode: ${ean}\n` +
    `Brand: ${brand}\n` +
    `Product name: ${name || 'unknown'}\n` +
    `${domainHint}\n\n` +
    `Construct the direct product page URL for this specific item on the retailer's website.\n` +
    `Return ONLY the URL — no explanation, no markdown.\n` +
    `If you cannot construct a direct product page URL with high confidence, return exactly: FALLBACK`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':          apiKey,
        'anthropic-version':  '2023-06-01',
        'content-type':       'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) return null;

    const json = await res.json() as { content: Array<{ type: string; text: string }> };
    const text = json.content?.[0]?.text?.trim() ?? '';

    if (text === 'FALLBACK' || !text.startsWith('http')) return null;

    return text;
  } catch {
    return null;
  }
}

// ─── LAAG 3: GEFILTERDE SITE-SEARCH ──────────────────────────────────────────
// Zoekt binnen de retailer-site op EAN. Veel beter dan blinde Google:
// de gebruiker belandt op zoekresultaten van de juiste winkel.
// Bij onbekende retailer: zoek op merk + productnaam ipv EAN (meer kans op treffer).

function buildSiteSearch(ean: string, brand: string, name: string, domain: string): string {
  if (domain !== 'unknown') {
    // EAN + site-filter → hoogste kans op juist product
    return `https://www.google.com/search?q=site:${domain}+"${ean}"`;
  }
  // Onbekende retailer: merk + naam is betrouwbaarder dan alleen EAN
  const query = name ? `${brand} ${name}` : `${brand} ${ean}`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

// ─── LAAG 4: GENERIEKE GOOGLE SEARCH (nooduitgang) ───────────────────────────
// Alleen als retailer én productnaam echt onbekend zijn.
// Moet minimaal voorkomen — de logs tonen wanneer dit happens.

function buildGoogleFallback(ean: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(ean)}`;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: Partial<ResolveRequest>;
  try {
    body = await req.json() as Partial<ResolveRequest>;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { ean, brand, name } = body;

  if (!ean || typeof ean !== 'string' || ean.trim().length < 8) {
    return json({ error: 'ean is required and must be at least 8 digits' }, 400);
  }
  if (!brand || typeof brand !== 'string' || brand.trim().length === 0) {
    return json({ error: 'brand is required' }, 400);
  }

  const cleanEan   = ean.trim();
  const cleanBrand = brand.trim();
  const cleanName  = (name ?? '').trim();

  // Brand → domein normalisatie (vangt "Zara MAN", "adidas Superstar", etc. op)
  const domain = normalizeBrandToDomain(cleanBrand);

  const anthropicKey = (typeof process !== 'undefined'
    ? process.env.ANTHROPIC_API_KEY
    : undefined) ?? '';

  // ── LAAG 1: hardcoded patroon ──────────────────────────────────────────────
  const patternUrl = tryPatternLayer(cleanEan, domain);
  if (patternUrl) {
    logResolve(cleanEan, cleanBrand, domain, 1, patternUrl);
    return json({ url: patternUrl, layer: 1 } satisfies ResolveResponse);
  }

  // ── LAAG 2: AI — directe product page ─────────────────────────────────────
  const aiUrl = await tryAiProductPage(cleanEan, cleanBrand, cleanName, domain, anthropicKey);
  if (aiUrl) {
    logResolve(cleanEan, cleanBrand, domain, 2, aiUrl);
    return json({ url: aiUrl, layer: 2 } satisfies ResolveResponse);
  }

  // ── LAAG 3: gefilterde site-search ────────────────────────────────────────
  // Altijd beter dan laag 4 — zelfs bij onbekende retailer zoek je op merk+naam
  const siteSearchUrl = buildSiteSearch(cleanEan, cleanBrand, cleanName, domain);
  logResolve(cleanEan, cleanBrand, domain, 3, siteSearchUrl);
  return json({ url: siteSearchUrl, layer: 3 } satisfies ResolveResponse);

  // ── LAAG 4: nooduitgang ────────────────────────────────────────────────────
  // Wordt momenteel nooit bereikt — laag 3 vangt alles op.
  // Bewust behouden als veiligheidsnet voor toekomstige logicawijzigingen.
  // eslint-disable-next-line no-unreachable
  const googleUrl = buildGoogleFallback(cleanEan);
  logResolve(cleanEan, cleanBrand, 'unknown', 4, googleUrl);
  return json({ url: googleUrl, layer: 4 } satisfies ResolveResponse);
}
