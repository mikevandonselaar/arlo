const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string;

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

/**
 * Sends one or two label photos (as data URLs) to Claude Vision and returns
 * structured product information extracted from the label(s).
 */
export async function analyzeLabelPhotos(dataUrls: string[]): Promise<LabelExtraction> {
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
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
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
            {
              type: 'text',
              text: `Analyse the clothing label(s) in these photo(s). Extract every piece of product information visible on the label.

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
}`,
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API ${res.status}: ${body}`);
  }

  const json = await res.json();
  const raw: string = json.content[0].text.trim();

  // Strip markdown code fences Claude occasionally adds despite the prompt
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  return JSON.parse(cleaned) as LabelExtraction;
}
