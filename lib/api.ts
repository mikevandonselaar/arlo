interface UPCItemDBOffer {
  price: string;
  currency: string;
  merchant: string;
}

interface UPCItemDBItem {
  ean: string;
  title: string;
  brand: string;
  category: string;
  images: string[];
  lowest_recorded_price: number;
  offers: UPCItemDBOffer[];
}

interface UPCItemDBResponse {
  code: string;
  items: UPCItemDBItem[];
}

export interface ScannedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  brand: string;
  category: string;
  ean: string;
}

export async function lookupProductByEAN(ean: string): Promise<ScannedProduct | null> {
  const res = await fetch(
    `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(ean)}`
  );

  if (!res.ok) return null;

  const data: UPCItemDBResponse = await res.json();

  if (data.code !== 'OK' || !data.items?.length) return null;

  const item = data.items[0];

  const price =
    item.lowest_recorded_price ||
    (item.offers?.[0]?.price ? parseFloat(item.offers[0].price) : 0);

  return {
    id: ean,
    name: item.title,
    price,
    image: item.images?.[0] ?? '',
    brand: item.brand || 'Unknown',
    category: item.category || 'General',
    ean,
  };
}
