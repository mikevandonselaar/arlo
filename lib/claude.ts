const VISION_PROXY = '/api/vision';

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

export async function analyzeLabelPhotos(dataUrls: string[]): Promise<LabelExtraction> {
  const res = await fetch(VISION_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'anthropic', dataUrls }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vision proxy ${res.status}: ${body}`);
  }

  return res.json() as Promise<LabelExtraction>;
}
