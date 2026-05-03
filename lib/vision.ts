// Dev only — used by the Vite-proxy code paths below.
// In production these are undefined; Vite tree-shakes the branches that read them.
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string;

// In development the Vite dev-server proxies /api/openai → api.openai.com
// and /api/anthropic → api.anthropic.com (see vite.config.ts).
// In production all vision requests go through the Vercel edge function at
// /api/vision, which holds the real API keys server-side.
const OPENAI_DEV_BASE = '/api/openai';
const ANTHROPIC_DEV_BASE = '/api/anthropic';
const VISION_PROXY = '/api/vision';

// ─── Shared types ────────────────────────────────────────────────────────────

export interface LabelExtraction {
  ean: string | null;
  brand: string;
  name: string;
  price: number | null;
  category: string;
  size: string | null;
  color: string | null;
  material: string | null;
}

// ─── Shared prompt & parser ───────────────────────────────────────────────────

const LABEL_PROMPT = `Analyse the clothing label(s) in these photo(s). Extract every piece of product information visible on the label.

Return ONLY a valid JSON object — no markdown, no code fences, no explanation:
{
  "ean": "<EAN or UPC digit string if a barcode is present and readable, otherwise null>",
  "brand": "<brand name, or \\"Unknown\\" if not visible>",
  "name": "<product name or style description>",
  "price": <retail price as a plain number if a price tag is visible, otherwise null>,
  "category": "<one of: Tops, Bottoms, Outerwear, Knitwear, Footwear, Accessories, Swimwear, Sportswear, or your best guess>",
  "size": "<garment size if printed on label, otherwise null>",
  "color": "<primary colour if stated on label, otherwise null>",
  "material": "<fibre/fabric composition if printed, otherwise null>"
}`;

function parseExtraction(raw: string): LabelExtraction {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  return JSON.parse(cleaned) as LabelExtraction;
}

// ─── OpenAI GPT-4o ───────────────────────────────────────────────────────────

/**
 * Sends label photo(s) to GPT-4o vision and returns structured product data.
 *
 * Dev:  calls OpenAI directly via the Vite dev-server proxy (/api/openai).
 * Prod: delegates to the /api/vision Vercel edge function so the API key
 *       stays server-side and never reaches the client bundle.
 */
export async function analyzeWithOpenAI(dataUrls: string[]): Promise<LabelExtraction> {
  if (!import.meta.env.DEV) {
    return callVisionProxy('openai', dataUrls);
  }

  const imageMessages = dataUrls.map(url => ({
    type: 'image_url' as const,
    image_url: { url, detail: 'high' as const },
  }));

  const res = await fetch(`${OPENAI_DEV_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            ...imageMessages,
            { type: 'text', text: LABEL_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body}`);
  }

  const json = await res.json();
  return parseExtraction(json.choices[0].message.content as string);
}

// ─── Anthropic Claude Sonnet ──────────────────────────────────────────────────

/**
 * Sends label photo(s) to Claude Sonnet vision and returns structured product
 * data.
 *
 * Dev:  calls Anthropic directly via the Vite dev-server proxy (/api/anthropic).
 * Prod: delegates to the /api/vision Vercel edge function.
 */
export async function analyzeWithAnthropic(dataUrls: string[]): Promise<LabelExtraction> {
  if (!import.meta.env.DEV) {
    return callVisionProxy('anthropic', dataUrls);
  }

  const imageContent = dataUrls.map(dataUrl => {
    const [header, data] = dataUrl.split(',');
    const mediaType = (header.split(':')[1]?.split(';')[0] ?? 'image/jpeg') as
      | 'image/jpeg'
      | 'image/png'
      | 'image/webp'
      | 'image/gif';
    return {
      type: 'image' as const,
      source: { type: 'base64' as const, media_type: mediaType, data },
    };
  });

  const res = await fetch(`${ANTHROPIC_DEV_BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      // Required when calling Anthropic directly from the browser (dev only)
      'anthropic-dangerous-allow-browser': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: LABEL_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic ${res.status}: ${body}`);
  }

  const json = await res.json();
  return parseExtraction(json.content[0].text as string);
}

// ─── Production proxy helper ──────────────────────────────────────────────────

/**
 * Calls the /api/vision Vercel edge function.
 * The function holds OPENAI_API_KEY / ANTHROPIC_API_KEY as server-side env vars
 * and returns a LabelExtraction directly.
 */
async function callVisionProxy(
  provider: 'openai' | 'anthropic',
  dataUrls: string[],
): Promise<LabelExtraction> {
  const res = await fetch(VISION_PROXY, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider, dataUrls }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vision proxy ${res.status}: ${body}`);
  }

  return res.json() as Promise<LabelExtraction>;
}

// ─── Vision response cache (localStorage) ────────────────────────────────────

const CACHE_PREFIX = 'arlo-vision-';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Fast sample-based fingerprint of one or more data URLs.
 * Samples length + three equally-spaced 64-char windows to avoid
 * hashing megabytes of base64 while still being collision-resistant
 * enough for deduplication within a session.
 */
function imageFingerprint(dataUrls: string[]): string {
  const combined = dataUrls
    .map(url => {
      const len = url.length;
      const mid = Math.floor(len / 2);
      return [len, url.slice(0, 64), url.slice(mid, mid + 64), url.slice(-64)].join('|');
    })
    .join('||');

  let h = 5381;
  for (let i = 0; i < combined.length; i++) {
    h = (Math.imul(31, h) + combined.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function getCachedExtraction(key: string): LabelExtraction | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: LabelExtraction; ts: number };
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedExtraction(key: string, data: LabelExtraction): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage quota exceeded — skip caching silently
  }
}

// ─── Primary entry-point with cache + fallback ────────────────────────────────

/**
 * Step 1 of the scan flow: analyse label photo(s) and return structured data.
 *
 * - Checks a 7-day localStorage cache keyed by a fingerprint of the image data.
 *   Identical photos (same session or re-submitted) skip the API call entirely.
 * - On cache miss: tries GPT-4o first, falls back to Claude Sonnet on any failure.
 * - Writes the result back to cache before returning.
 */
export async function analyzeLabelImage(dataUrls: string[]): Promise<LabelExtraction> {
  const cacheKey = imageFingerprint(dataUrls);
  const cached = getCachedExtraction(cacheKey);
  if (cached) {
    console.log('[vision] cache hit', cacheKey);
    return cached;
  }

  let result: LabelExtraction;
  try {
    result = await analyzeWithOpenAI(dataUrls);
  } catch (openAiErr) {
    console.warn('[vision] OpenAI failed, falling back to Anthropic:', openAiErr);
    result = await analyzeWithAnthropic(dataUrls);
  }

  setCachedExtraction(cacheKey, result);
  return result;
}
