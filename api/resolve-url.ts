/**
 * Vercel Edge Function — /api/resolve-url
 *
 * Resolves an EAN barcode + brand name (+ article code) to a direct product page URL.
 * ADR-008: drie-lagen fallback (patroon → AI product page → generieke Google-search),
 * elk met URL-validatie zodat er nooit een dode/gehallucineerde pagina teruggegeven wordt.
 *
 * Laag 3 is een gegarandeerde eindfallback (ongefilterde brand+naam search) —
 * er is bewust geen site:-gefilterde tussenlaag, omdat die vaak 0 resultaten
 * geeft (retailers indexeren ruwe EAN-codes zelden als doorzoekbare tekst) en de
 * gebruiker dan op een lege pagina zou belanden.
 *
 * API keys live exclusively here as Vercel Environment Variables:
 *   ANTHROPIC_API_KEY  — set in Vercel dashboard, never in the client bundle
 *
 * Request:  POST /api/resolve-url
 *           { ean: string, brand: string, name?: string, articleCode?: string, category?: string }
 *
 * Response: { url: string, layer: 1 | 2 | 3 }
 *           { error: string } with 4xx/5xx on failure
 *
 * TODO-KOSTEN: Laag 2 roept Claude Haiku aan (~€0.001/aanroep).
 *              Finance geïnformeerd. Monitoren bij opschaling naar beta.
 * TODO-VOLGENDE-FASE: Caching van opgeloste EAN→URL in Supabase zodat
 *                     herhaalde scans van hetzelfde product laag 1 raken.
 */

export const config = { runtime: 'edge' };

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResolveRequest {
  ean: string;
  brand: string;         // Komt direct uit LabelExtraction.brand — bijv. "Zara MAN", "Adidas Superstar"
  name?: string;         // Optioneel: LabelExtraction.name — bijv. "Superstar", "Slim Fit Trousers"
  articleCode?: string;  // Optioneel: LabelExtraction.articleCode — merk-eigen artikel-/stijlnummer
  category?: string;     // Optioneel: LabelExtraction.category — helpt patroon-URL's met een categorie-segment
}

interface ResolveResponse {
  url: string;
  layer: 1 | 2 | 3;
}

/** Alle velden die een patroonfunctie tot haar beschikking heeft. */
interface PatternInput {
  ean: string;
  brand: string;
  name: string;
  category: string;
  articleCode: string | null;
}

// ─── BRAND → DOMEIN NORMALISATIE ──────────────────────────────────────────────

const brandDomainMap: Array<{ patterns: RegExp; domain: string }> = [
  { patterns: /\bzara\b/i,                    domain: 'zara.com' },
  { patterns: /\bh\s*[&en]+\s*m\b/i,          domain: 'www2.hm.com' },
  { patterns: /\buniqlo\b/i,                  domain: 'uniqlo.com' },
  { patterns: /\badidas\b/i,                  domain: 'adidas.nl' },
  { patterns: /\bnike\b/i,                    domain: 'nike.com' },
  { patterns: /\bpuma\b/i,                    domain: 'puma.com' },
  { patterns: /\bnew\s*balance\b/i,           domain: 'newbalance.nl' },
  { patterns: /\breebok\b/i,                  domain: 'reebok.nl' },
  { patterns: /\bcarhartt\b/i,                domain: 'carhartt.com' },
  { patterns: /\blevi'?s?\b/i,                domain: 'levi.com' },
  { patterns: /\btommy\s*hilfiger\b/i,        domain: 'tommy.com' },
  { patterns: /\bcalvin\s*klein\b/i,          domain: 'calvinklein.nl' },
  { patterns: /\bralph\s*lauren\b/i,          domain: 'ralphlauren.com' },
  { patterns: /\bzalando\b/i,                 domain: 'zalando.nl' },
  { patterns: /\bbol\b/i,                     domain: 'bol.com' },
  { patterns: /\bamazon\b/i,                  domain: 'amazon.nl' },
  { patterns: /\bwehkamp\b/i,                 domain: 'wehkamp.nl' },
  { patterns: /\bbjorn\s*borg\b/i,            domain: 'bjornborg.com' },
  { patterns: /\bonly\b/i,                    domain: 'only.com' },
  { patterns: /\bjack\s*[&en]+\s*jones\b/i,   domain: 'jackjones.com' },
  { patterns: /\bvero\s*moda\b/i,             domain: 'veromoda.com' },
  { patterns: /\bcos\b/i,                     domain: 'cosstores.com' },
  { patterns: /\barket\b/i,                   domain: 'arket.com' },
  { patterns: /\b&other\s*stories\b/i,        domain: 'stories.com' },
  { patterns: /\bmonki\b/i,                   domain: 'monki.com' },
  { patterns: /\bweekday\b/i,                 domain: 'weekday.com' },
  { patterns: /\bsandro\b/i,                  domain: 'sandro-paris.com' },
  { patterns: /\b(de\s*)?bijenkorf\b/i,       domain: 'debijenkorf.nl' },
  { patterns: /\bsuitsupply\b/i,              domain: 'suitsupply.com' },
  { patterns: /\bdaily\s*paper\b/i,           domain: 'dailypaperclothing.com' },
  { patterns: /\bdonsje\b/i,                  domain: 'donsje.com' },
  { patterns: /\bpatta\b/i,                   domain: 'patta.nl' },
  { patterns: /\btenue\s*(de\s*)?nimes\b/i,   domain: 'tenuedenimes.com' },
];

function normalizeBrandToDomain(brand: string): string {
  for (const entry of brandDomainMap) {
    if (entry.patterns.test(brand)) return entry.domain;
  }
  return 'unknown';
}

// ─── URL-SLUG HELPERS ──────────────────────────────────────────────────────────

const DIACRITICS_REGEX = new RegExp('[̀-ͯ]', 'g');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD').replace(DIACRITICS_REGEX, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Best-effort categorie → URL-segment. Retailers gebruiken allemaal een andere
 * taxonomie dan LabelExtraction.category (Tops/Bottoms/Outerwear/...), dus dit
 * is een gok — de URL-validatie (zie checkUrlReachable) vangt een verkeerde gok af.
 */
function categorySlug(category: string): string {
  const map: Record<string, string> = {
    Tops:         'tops',
    Bottoms:      'trousers',
    Outerwear:    'coats',
    Knitwear:     'knitwear',
    Footwear:     'shoes',
    Accessories:  'accessories',
    Swimwear:     'swimwear',
    Sportswear:   'sportswear',
  };
  return map[category] ?? 'women';
}

// ─── RETAILER PATROON TABEL ───────────────────────────────────────────────────
//
// Groep A — het merk plaatst een deterministisch artikel-/stylecode-patroon in
// de product-URL. Vereist articleCode (of, voor Group A-EAN-only zoals bol/
// amazon/wehkamp, alleen de ean); ontbreekt het benodigde veld, dan geeft de
// functie `null` terug en valt de resolver door naar laag 2 (AI).
//
// Groep B — Shopify-winkels zonder deterministisch patroon (dailypaperclothing.com,
// donsje.com, patta.nl, tenuedenimes.com) staan expliciet op `null`: dat is geen
// leemte, het is een bewuste keuze om meteen naar laag 2 (AI) door te springen.

type PatternFn = (input: PatternInput) => string | null;

const retailerPatterns: Record<string, PatternFn | null> = {
  // ── Groep A: EAN-based site-search (geen productpagina-patroon bekend) ──────
  'bol.com':    ({ ean }) => `https://www.bol.com/nl/nl/s/?searchtext=${ean}`,
  'amazon.nl':  ({ ean }) => `https://www.amazon.nl/s?k=${ean}`,
  'wehkamp.nl': ({ ean }) => `https://www.wehkamp.nl/zoeken/?query=${ean}`,

  // ── Groep A: deterministisch artikelcode-patroon ────────────────────────────
  'cosstores.com': ({ articleCode, name, category }) => {
    if (!articleCode) return null;
    return `https://www.cosstores.com/en_gbp/${categorySlug(category)}/product.${slugify(name)}.${articleCode}.html`;
  },

  'arket.com': ({ articleCode, name }) => {
    if (!articleCode) return null;
    return `https://www.arket.com/en-ww/product/${slugify(name)}-${articleCode}/`;
  },

  'www2.hm.com': ({ articleCode }) => {
    if (!articleCode) return null;
    return `https://www2.hm.com/en_gb/productpage.${articleCode}.html`;
  },

  'zara.com': ({ articleCode, name }) => {
    // articleCode moet hier Zara's eigen (interne) code zijn, NIET de EAN.
    if (!articleCode) return null;
    return `https://www.zara.com/nl/en/${slugify(name)}-p${articleCode}.html`;
  },

  'sandro-paris.com': ({ articleCode, name }) => {
    if (!articleCode) return null;
    return `https://www.sandro-paris.com/en/p/${slugify(name)}/${articleCode}.html`;
  },

  'debijenkorf.nl': ({ articleCode, name }) => {
    // De Bijenkorf's pad bevat zowel een 10-cijferige stylecode als een
    // 15-cijferige articlecode (stylecode + 5 extra cijfers). LabelExtraction
    // levert maar één code — alleen bruikbaar als dat de volledige (15-cijferige)
    // articlecode is, waaruit de stylecode als prefix is af te leiden.
    if (!articleCode || articleCode.length < 15) return null;
    const styleCode = articleCode.slice(0, 10);
    return `https://www.debijenkorf.nl/d/${slugify(name)}-${styleCode}-${articleCode}`;
  },

  'suitsupply.com': ({ articleCode, name, category }) => {
    if (!articleCode) return null;
    return `https://suitsupply.com/en-gb/men/${categorySlug(category)}/${slugify(name)}/${articleCode}.html`;
  },

  // ── Groep A: merken zonder EAN/artikelcode in de URL (bekend, geen patroon) ─
  'zalando.nl':      null,
  'uniqlo.com':      null,
  'adidas.nl':       null,
  'nike.com':        null,
  'puma.com':        null,
  'newbalance.nl':   null,
  'reebok.nl':       null,
  'carhartt.com':    null,
  'levi.com':        null,
  'tommy.com':       null,
  'calvinklein.nl':  null,
  'ralphlauren.com': null,
  'stories.com':     null,
  'monki.com':       null,
  'weekday.com':     null,
  'bjornborg.com':   null,
  'only.com':        null,
  'jackjones.com':   null,
  'veromoda.com':    null,

  // ── Groep B: Shopify, bewust null → direct laag 2 (AI) ──────────────────────
  'dailypaperclothing.com': null,
  'donsje.com':             null,
  'patta.nl':               null,
  'tenuedenimes.com':       null,
};

function tryPatternLayer(input: PatternInput, domain: string): string | null {
  if (domain === 'unknown') return null;
  const pattern = retailerPatterns[domain];
  if (!pattern) return null;
  return pattern(input);
}

// ─── URL-VALIDATIE (gedeeld door laag 1 en laag 2) ────────────────────────────

const URL_CHECK_TIMEOUT_MS = 3000;

/**
 * Verifieert dat een geconstrueerde/AI-voorgestelde URL daadwerkelijk een
 * geldige productpagina is, zodat laag 1 en laag 2 nooit een dode of
 * gehallucineerde pagina teruggeven.
 *
 * - Probeert eerst HEAD; sommige retailers staan die niet toe (405/501) — dan
 *   valt de check terug op een volledige GET.
 * - Alleen een expliciete 2xx telt als geldig.
 * - Een REDIRECT (het opgevraagde pad wijkt af van het uiteindelijke pad) naar
 *   een kale homepage of een expliciete not-found-pagina telt niet als geldig —
 *   dat is voor de gebruiker net zo'n dood eind als een 404. Let op: dit mag
 *   geen site-search-URL's raken die zelf al bedoeld zijn als eindresultaat
 *   (bol.com `/s/`, amazon.nl `/s`, wehkamp.nl `/zoeken/`) — daarom wordt hier
 *   alleen gekeken naar een daadwerkelijke redirect weg van het opgevraagde pad,
 *   niet naar de vorm van het pad zelf.
 */
async function checkUrlReachable(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), URL_CHECK_TIMEOUT_MS);

  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });

    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
    }

    if (!res.ok) return false;

    const requestedPath = new URL(url).pathname.toLowerCase();
    const finalPath = new URL(res.url).pathname.toLowerCase();
    const redirectedAway = finalPath !== requestedPath;
    const looksGeneric = redirectedAway && (
      finalPath === '' || finalPath === '/' ||
      finalPath.includes('not-found') || finalPath.includes('404')
    );

    return !looksGeneric;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── LOGGER ───────────────────────────────────────────────────────────────────

/** Eén regel per geprobeerde kandidaat-URL, ongeacht of hij het uiteindelijk haalt. */
function logAttempt(
  ean: string,
  brand: string,
  domain: string,
  layer: 1 | 2,
  candidateUrl: string,
  validated: boolean
): void {
  console.log(JSON.stringify({
    event:     'ean_resolve_attempt',
    ean,
    brand,
    domain,
    layer,
    candidateUrl,
    validated,
    timestamp: new Date().toISOString(),
  }));
}

/** Eén regel voor het uiteindelijk teruggegeven resultaat. */
function logResolve(
  ean: string,
  brand: string,
  domain: string,
  layer: 1 | 2 | 3,
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

// ─── LAAG 2: AI — DIRECTE PRODUCT PAGE ───────────────────────────────────────

async function tryAiProductPage(
  input: PatternInput,
  domain: string,
  apiKey: string
): Promise<string | null> {
  const { ean, brand, name, articleCode } = input;

  const domainHint = domain !== 'unknown'
    ? `The retailer is ${domain}.`
    : `The retailer is unknown — use the brand "${brand}" to determine the most likely retailer.`;

  const articleCodeLine = articleCode
    ? `Article/style code (brand-internal, printed on the label): ${articleCode}\n`
    : '';

  const prompt =
    `A customer scanned a clothing item in a physical store.\n` +
    `EAN barcode: ${ean}\n` +
    `Brand: ${brand}\n` +
    `Product name: ${name || 'unknown'}\n` +
    articleCodeLine +
    `${domainHint}\n\n` +
    `Construct the direct product page URL for this specific item on the retailer's website.\n` +
    `Return ONLY the URL — no explanation, no markdown.\n` +
    `If you cannot construct a direct product page URL with high confidence, return exactly: FALLBACK`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
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

    const validated = await checkUrlReachable(text);
    logAttempt(ean, brand, domain, 2, text, validated);
    if (!validated) return null;

    return text;
  } catch {
    return null;
  }
}

// ─── LAAG 3: GENERIEKE GOOGLE SEARCH (gegarandeerde eindfallback) ───────────

function buildGenericSearch(ean: string, brand: string, name: string): string {
  const query = name ? `${brand} ${name}` : `${brand} ${ean}`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
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

  const { ean, brand, name, articleCode, category } = body;

  if (!ean || typeof ean !== 'string' || ean.trim().length < 8) {
    return json({ error: 'ean is required and must be at least 8 digits' }, 400);
  }
  if (!brand || typeof brand !== 'string' || brand.trim().length === 0) {
    return json({ error: 'brand is required' }, 400);
  }

  const cleanEan         = ean.trim();
  const cleanBrand       = brand.trim();
  const cleanName        = (name ?? '').trim();
  const cleanArticleCode = (articleCode ?? '').trim() || null;
  const cleanCategory    = (category ?? '').trim();

  const domain = normalizeBrandToDomain(cleanBrand);

  const anthropicKey = (typeof process !== 'undefined'
    ? process.env.ANTHROPIC_API_KEY
    : undefined) ?? '';

  const patternInput: PatternInput = {
    ean:         cleanEan,
    brand:       cleanBrand,
    name:        cleanName,
    category:    cleanCategory,
    articleCode: cleanArticleCode,
  };

  // ── LAAG 1 ────────────────────────────────────────────────────────────────
  const patternUrl = tryPatternLayer(patternInput, domain);
  if (patternUrl) {
    const validated = await checkUrlReachable(patternUrl);
    logAttempt(cleanEan, cleanBrand, domain, 1, patternUrl, validated);
    if (validated) {
      logResolve(cleanEan, cleanBrand, domain, 1, patternUrl);
      return json({ url: patternUrl, layer: 1 } satisfies ResolveResponse);
    }
    // Laag 1 leverde een kandidaat die niet standhoudt — val door naar laag 2.
  }

  // ── LAAG 2 ────────────────────────────────────────────────────────────────
  const aiUrl = await tryAiProductPage(patternInput, domain, anthropicKey);
  if (aiUrl) {
    logResolve(cleanEan, cleanBrand, domain, 2, aiUrl);
    return json({ url: aiUrl, layer: 2 } satisfies ResolveResponse);
  }

  // ── LAAG 3 (gegarandeerde eindfallback) ─────────────────────────────────────
  const genericSearchUrl = buildGenericSearch(cleanEan, cleanBrand, cleanName);
  logResolve(cleanEan, cleanBrand, domain, 3, genericSearchUrl);
  return json({ url: genericSearchUrl, layer: 3 } satisfies ResolveResponse);
}
