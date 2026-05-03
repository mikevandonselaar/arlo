/**
 * Vercel Edge Function — /api/vision
 *
 * Proxies label-analysis requests to OpenAI GPT-4o or Anthropic Claude Sonnet.
 * API keys live exclusively here as Vercel Environment Variables:
 *   OPENAI_API_KEY     — set in Vercel dashboard, never in the client bundle
 *   ANTHROPIC_API_KEY  — set in Vercel dashboard, never in the client bundle
 *
 * Request:  POST /api/vision
 *           { provider: "openai" | "anthropic", dataUrls: string[] }
 *
 * Response: LabelExtraction JSON on success
 *           { error: string } with 4xx/5xx on failure
 */

export const config = { runtime: 'edge' };

// ─── Types ────────────────────────────────────────────────────────────────────

interface LabelExtraction {
  ean: string | null;
  brand: string;
  name: string;
  price: number | null;
  category: string;
  size: string | null;
  color: string | null;
  material: string | null;
}

// ─── Shared prompt & parser (duplicated from lib/vision.ts) ──────────────────
// Can't import lib/vision.ts here — it uses import.meta.env and localStorage,
// which are unavailable in the edge runtime.

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

// ─── Provider calls ───────────────────────────────────────────────────────────

async function callOpenAI(dataUrls: string[], apiKey: string): Promise<LabelExtraction> {
  const imageMessages = dataUrls.map(url => ({
    type: 'image_url' as const,
    image_url: { url, detail: 'high' as const },
  }));

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [...imageMessages, { type: 'text', text: LABEL_PROMPT }],
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);

  const json = await res.json() as { choices: Array<{ message: { content: string } }> };
  return parseExtraction(json.choices[0].message.content);
}

async function callAnthropic(dataUrls: string[], apiKey: string): Promise<LabelExtraction> {
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

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [...imageContent, { type: 'text', text: LABEL_PROMPT }],
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);

  const json = await res.json() as { content: Array<{ text: string }> };
  return parseExtraction(json.content[0].text);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: { provider?: string; dataUrls?: string[] };
  try {
    body = await req.json() as { provider?: string; dataUrls?: string[] };
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { provider, dataUrls } = body;

  if (provider !== 'openai' && provider !== 'anthropic') {
    return json({ error: 'provider must be "openai" or "anthropic"' }, 400);
  }
  if (!Array.isArray(dataUrls) || dataUrls.length === 0) {
    return json({ error: 'dataUrls must be a non-empty array' }, 400);
  }

  const openaiKey = process.env.OPENAI_API_KEY ?? '';
  const anthropicKey = process.env.ANTHROPIC_API_KEY ?? '';

  try {
    const result =
      provider === 'openai'
        ? await callOpenAI(dataUrls, openaiKey)
        : await callAnthropic(dataUrls, anthropicKey);

    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return json({ error: message }, 500);
  }
}
