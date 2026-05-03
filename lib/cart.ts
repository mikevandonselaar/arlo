/**
 * lib/cart.ts
 *
 * V2-C3 — Anonymous session leak gedicht in ensureSession().
 *
 * PROBLEEM (oud):
 *   Als er geen actieve Supabase sessie was, riep ensureSession() automatisch
 *   supabase.auth.signInAnonymously() aan. Dit botste met ADR-005 (anonieme
 *   accounts deprecated) en vervuilde de users-tabel bij elke cold start
 *   zonder sessie — ook bij bots, crawlers en foutieve deeplinks.
 *
 * OPLOSSING:
 *   ensureSession() gooit nu een Error als er geen sessie actief is.
 *   MainApp.tsx onderschept cart-errors via de bestaande try/catch blokken
 *   in addToCart / getCart — de gebruiker ziet een toast en de app blijft stabiel.
 *   Alle calls die al een sessie hadden blijven ongewijzigd werken.
 */

import { supabase } from './supabase';
import type { CartItem, Product } from '../components/MainApp';

// ─── Session ──────────────────────────────────────────────────────────────────

/**
 * Geeft de user-id van de actieve Supabase sessie terug.
 * Gooit een Error als er geen sessie actief is — aanroepers moeten
 * de gebruiker dan naar het sign-in scherm sturen.
 *
 * @throws Error 'No active session — please sign in before using the cart.'
 */
export async function ensureSession(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user.id;
  throw new Error('No active session — please sign in before using the cart.');
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

/** Gets (or creates) the single cart row for the current user. */
async function getOrCreateCart(userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from('carts')
    .insert({ user_id: userId })
    .select('id')
    .single();

  if (error || !data) throw new Error(`Cart creation failed: ${error?.message}`);
  return data.id as string;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Loads all cart items for the current user.
 * Returns them as `CartItem[]` with `dbId` set to the Supabase UUID.
 */
export async function getCart(): Promise<CartItem[]> {
  const userId = await ensureSession();
  const cartId = await getOrCreateCart(userId);

  const { data, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cartId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`getCart failed: ${error.message}`);

  return (data ?? []).map(row => ({
    dbId: row.id as string,
    id: row.product_id as string,
    name: row.name as string,
    price: Number(row.price),
    brand: row.brand as string,
    category: row.category as string,
    image: row.image_url as string,
    ean: row.ean ?? undefined,
    size: row.size ?? undefined,
    color: row.color ?? undefined,
    scannedAt: row.scanned_at ?? undefined,
    shippedBy: row.shipped_by ?? undefined,
    quantity: row.quantity as number,
  }));
}

/**
 * Adds a product to the cart.
 * If an identical product_id + scanned_at row already exists, increments quantity instead.
 * Returns the full updated `CartItem` (with `dbId`).
 */
export async function addToCart(product: Product): Promise<CartItem> {
  const userId = await ensureSession();
  const cartId = await getOrCreateCart(userId);

  // Check for duplicate (same product + same store)
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', product.id)
    .eq('scanned_at', product.scannedAt ?? '')
    .maybeSingle();

  if (existing) {
    const newQty = (existing.quantity as number) + 1;
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('id', existing.id)
      .select()
      .single();
    if (error || !data) throw new Error(`addToCart update failed: ${error?.message}`);
    return rowToCartItem(data);
  }

  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      cart_id: cartId,
      product_id: product.id,
      name: product.name,
      price: product.price,
      brand: product.brand,
      category: product.category,
      image_url: product.image,
      ean: product.ean ?? null,
      size: product.size ?? null,
      color: product.color ?? null,
      scanned_at: product.scannedAt ?? null,
      shipped_by: product.shippedBy ?? null,
      quantity: 1,
    })
    .select()
    .single();

  if (error || !data) throw new Error(`addToCart insert failed: ${error?.message}`);
  return rowToCartItem(data);
}

/** Updates the quantity of a cart item by its Supabase UUID. */
export async function updateQuantity(dbId: string, quantity: number): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', dbId);

  if (error) throw new Error(`updateQuantity failed: ${error.message}`);
}

/** Removes a cart item by its Supabase UUID. */
export async function removeFromCart(dbId: string): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', dbId);

  if (error) throw new Error(`removeFromCart failed: ${error.message}`);
}

/** Deletes all items in the current user's cart. */
export async function clearCart(): Promise<void> {
  const userId = await ensureSession();
  const cartId = await getOrCreateCart(userId);

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cartId);

  if (error) throw new Error(`clearCart failed: ${error.message}`);
}

// ─── Local queue (Supabase save fallback) ─────────────────────────────────────

const QUEUE_KEY = 'arlo-cart-queue';

interface QueuedProduct extends Product {
  queuedAt: number;
}

function readQueue(): QueuedProduct[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as QueuedProduct[];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedProduct[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    // quota exceeded — silently skip
  }
}

/**
 * Adds a product to the local queue so it can be retried on the next app open.
 * Called when a Supabase save fails (network down, auth error, etc.).
 */
export function enqueueProduct(product: Product): void {
  const queue = readQueue();
  queue.push({ ...product, queuedAt: Date.now() });
  writeQueue(queue);
}

/**
 * Attempts to flush every queued product into Supabase.
 * Successful items are removed from the queue; failed ones stay for the next attempt.
 * Returns the CartItems that were successfully saved (so the caller can merge into state).
 */
export async function drainQueue(): Promise<CartItem[]> {
  const queue = readQueue();
  if (queue.length === 0) return [];

  const saved: CartItem[] = [];
  const remaining: QueuedProduct[] = [];

  for (const queued of queue) {
    try {
      const item = await addToCart(queued);
      saved.push(item);
    } catch {
      remaining.push(queued);
    }
  }

  writeQueue(remaining);
  return saved;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function rowToCartItem(row: Record<string, unknown>): CartItem {
  return {
    dbId: row.id as string,
    id: row.product_id as string,
    name: row.name as string,
    price: Number(row.price),
    brand: row.brand as string,
    category: row.category as string,
    image: row.image_url as string,
    ean: (row.ean as string) ?? undefined,
    size: (row.size as string) ?? undefined,
    color: (row.color as string) ?? undefined,
    scannedAt: (row.scanned_at as string) ?? undefined,
    shippedBy: (row.shipped_by as string) ?? undefined,
    quantity: row.quantity as number,
  };
}
