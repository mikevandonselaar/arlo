/**
 * lib/resolveUrl.ts
 *
 * Frontend helper voor de /api/resolve-url endpoint.
 * Roept de resolver aan met EAN + brand + naam en opent het resultaat.
 *
 * Gebruik in CartPage.tsx:
 *   import { findOnline } from '../lib/resolveUrl';
 *   await findOnline({ ean: item.ean, brand: item.brand, name: item.name });
 */

interface FindOnlineParams {
  ean:         string | undefined;
  brand:       string;
  name:        string;
  articleCode?: string;
  category?:   string;
}

interface ResolveResult {
  url:   string;
  layer: 1 | 2 | 3;
}

/**
 * Vraagt de server om de beste product-URL voor dit item,
 * en opent die URL in een nieuw tabblad.
 *
 * Valt intern terug op een gefilterde Google-search als de API
 * niet bereikbaar is — de knop werkt altijd, ook zonder API.
 */
export async function findOnline({ ean, brand, name, articleCode, category }: FindOnlineParams): Promise<void> {
  // Fallback als EAN ontbreekt — resolver heeft op z'n minst brand+naam nodig
  const effectiveEan = ean?.trim() || `brand-${brand.trim()}`;

  try {
    const response = await fetch('/api/resolve-url', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        ean:         effectiveEan,
        brand:       brand.trim(),
        name:        name.trim(),
        articleCode: articleCode?.trim() || undefined,
        category:    category?.trim() || undefined,
      }),
    });

    if (!response.ok) throw new Error(`Resolver responded ${response.status}`);

    const data = await response.json() as ResolveResult;
    window.open(data.url, '_blank', 'noopener,noreferrer');

  } catch {
    // API onbereikbaar of fout — val terug op Google-search
    // zodat de knop altijd werkt, ook tijdens lokale dev zonder API
    const fallback = `https://www.google.com/search?q=${encodeURIComponent(`${brand} ${name}`)}`;
    window.open(fallback, '_blank', 'noopener,noreferrer');
  }
}
