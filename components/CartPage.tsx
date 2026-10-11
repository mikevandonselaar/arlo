import { useState, useRef } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, X, ChevronLeft, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { CartItem } from './MainApp';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrency } from '../lib/currency';
import { findOnline } from '../lib/resolveUrl';
import { PurchaseConfirmation } from './PurchaseConfirmation';

// Checkout isn't live yet. In dev builds "Buy" opens the confirmation screen so
// the design can be reviewed; in production the button stays disabled as before.
const CHECKOUT_PREVIEW = import.meta.env.DEV;

const PHOTO_LABELS = ['Garment', 'EAN', 'Label'];

interface CartPageProps {
  cart: CartItem[];
  onUpdateQuantity: (dbId: string, quantity: number) => void;
  onRemoveItem:     (dbId: string) => void;
}

// ── Photo Viewer ──────────────────────────────────────────────────────────────

interface PhotoViewerProps {
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
}

function PhotoViewer({ photos, initialIndex = 0, onClose }: PhotoViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);

  const prev = () => setIndex(i => Math.max(0, i - 1));
  const next = () => setIndex(i => Math.min(photos.length - 1, i + 1));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) next();
    if (dx >  50) prev();
    touchStartX.current = null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-ink text-bg flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <span className="type-data text-bg/60">
          {PHOTO_LABELS[index] ?? `Photo ${index + 1}`}
        </span>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-10 h-10 rounded-sm border border-bg/30 flex items-center justify-center active:opacity-70"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Photo */}
      <div className="flex-1 flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={photos[index]}
            alt={PHOTO_LABELS[index] ?? `Photo ${index + 1}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="w-full max-h-full object-contain rounded-sm"
          />
        </AnimatePresence>
      </div>

      {/* Indicators + nav */}
      <div className="pb-12 pt-6 flex flex-col items-center gap-4 flex-shrink-0">
        <div className="flex gap-2">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-bg' : 'w-1.5 bg-bg/30'
              }`}
            />
          ))}
        </div>
        {photos.length > 1 && (
          <div className="flex gap-4">
            <button
              onClick={prev}
              disabled={index === 0}
              className="px-5 py-2.5 rounded-sm border border-bg/30 text-sm font-medium active:opacity-70 disabled:opacity-30"
            >
              Previous
            </button>
            <button
              onClick={next}
              disabled={index === photos.length - 1}
              className="px-5 py-2.5 rounded-sm border border-bg/30 text-sm font-medium active:opacity-70 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Item Detail Page ──────────────────────────────────────────────────────────

interface ItemDetailProps {
  item: CartItem;
  onClose: () => void;
  onRemove: () => void;
}

function ItemDetail({ item, onClose, onRemove }: ItemDetailProps) {
  const photos = item.photos?.length ? item.photos : [item.image];
  const [photoIndex, setPhotoIndex] = useState(0);
  const { symbol: currencySymbol } = useCurrency();
  const [isFinding, setIsFinding] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const prev = () => setPhotoIndex(i => Math.max(0, i - 1));
  const next = () => setPhotoIndex(i => Math.min(photos.length - 1, i + 1));

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) next();
    if (dx >  50) prev();
    touchStartX.current = null;
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="fixed inset-0 z-50 bg-bg text-ink flex flex-col overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-6 pt-6 pb-4 flex-shrink-0 bg-bg">
        <button
          onClick={onClose}
          aria-label="Back"
          className="w-10 h-10 rounded-sm border border-line flex items-center justify-center active:opacity-70"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-medium">Product</span>
      </div>

      {/* Photo gallery */}
      <div
        className="mx-4 rounded-sm overflow-hidden border border-line aspect-[4/3] relative flex-shrink-0"
        style={{ touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={photoIndex}
            src={photos[photoIndex]}
            alt={PHOTO_LABELS[photoIndex] ?? `Photo ${photoIndex + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Photo label badge */}
        <div className="absolute top-3 left-3 bg-ink px-2.5 py-1 rounded-sm">
          <span className="type-data text-bg">
            {PHOTO_LABELS[photoIndex] ?? `Photo ${photoIndex + 1}`}
          </span>
        </div>

        {/* Dot indicators */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setPhotoIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === photoIndex ? 'w-5 bg-accent' : 'w-1.5 bg-ink/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details card */}
      <div className="mx-4 mt-4 border border-line rounded-sm p-6 space-y-4">
        <div>
          <p className="type-data text-muted">{item.brand}</p>
          <h2 className="text-xl font-medium mt-1 leading-tight">{item.name}</h2>
          <p className="type-hero tabular-nums mt-4">
            {currencySymbol}{item.price.toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {item.size && (
            <div className="border border-line rounded-sm px-4 py-3">
              <p className="type-data text-muted mb-0.5">Size</p>
              <p className="type-data">{item.size}</p>
            </div>
          )}
          {item.color && (
            <div className="border border-line rounded-sm px-4 py-3">
              <p className="type-data text-muted mb-0.5">Colour</p>
              <p className="type-data">{item.color}</p>
            </div>
          )}
          {item.ean && (
            <div className="border border-line rounded-sm px-4 py-3">
              <p className="type-data text-muted mb-0.5">EAN</p>
              <p className="type-data truncate">{item.ean}</p>
            </div>
          )}
          {item.scannedAt && (
            <div className="border border-line rounded-sm px-4 py-3">
              <p className="type-data text-muted mb-0.5">Scanned at</p>
              <p className="type-data truncate">{item.scannedAt}</p>
            </div>
          )}
        </div>

        <button
          onClick={async () => {
            setIsFinding(true);
            await findOnline({ ean: item.ean, brand: item.brand, name: item.name, articleCode: item.articleCode, category: item.category });
            setIsFinding(false);
          }}
          disabled={isFinding}
          className="flex items-center justify-between w-full bg-accent text-on-accent rounded-sm px-5 py-4 active:opacity-70 disabled:opacity-60 disabled:cursor-wait"
        >
          <span className="font-medium text-sm">
            {isFinding ? 'Looking up' : 'Find online'}
          </span>
          <ExternalLink className="w-4 h-4" />
        </button>

        <button
          onClick={onRemove}
          className="w-full flex items-center justify-center gap-2 py-3 text-muted text-sm font-medium active:opacity-70"
        >
          <Trash2 className="w-4 h-4" />
          Remove from cart
        </button>
      </div>

      <div className="h-8 flex-shrink-0" />
    </motion.div>
  );
}

// ── Main CartPage ─────────────────────────────────────────────────────────────

export function CartPage({ cart, onUpdateQuantity, onRemoveItem }: CartPageProps) {
  const [selectedItem, setSelectedItem]   = useState<CartItem | null>(null);
  const [viewerItem,   setViewerItem]     = useState<CartItem | null>(null);
  const [viewerIndex,  setViewerIndex]    = useState(0);
  const [orderNumber,  setOrderNumber]    = useState<string | null>(null);
  const { symbol: CURRENCY_SYMBOL } = useCurrency(); // B9: user-configurable currency

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // B7: group by store/brand (brand = shipper)
  const groupedItems = cart.reduce((acc, item) => {
    const key = item.brand;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  // B3: derive scan location dynamically from cart items
  const scanLocations = [...new Set(cart.map(i => i.scannedAt).filter(Boolean))] as string[];
  const locationLabel = scanLocations.length === 0
    ? 'In-store scans'
    : scanLocations.length === 1
    ? scanLocations[0]
    : 'Multiple stores';

  const openViewer = (item: CartItem, photoIndex = 0) => {
    setViewerItem(item);
    setViewerIndex(photoIndex);
  };

  const handleRemoveFromDetail = (dbId: string | undefined) => {
    if (dbId) onRemoveItem(dbId);
    setSelectedItem(null);
  };

  // ── Empty state ──
  if (cart.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-bg text-ink">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 border border-line rounded-full flex items-center justify-center mb-6"
        >
          <ShoppingBag className="w-10 h-10 text-muted" />
        </motion.div>
        <h2 className="text-2xl font-medium mb-2 text-center">Your cart is empty</h2>
        <p className="text-muted text-center mb-8 max-w-[240px] text-sm">
          Scan garments in store to fill your cart.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col bg-bg text-ink">

        {/* B1: Header */}
        <div className="px-6 pt-4 pb-4 bg-bg sticky top-0 z-10">
          <h1 className="text-2xl font-medium leading-none">Cart</h1>
          <div className="flex items-center gap-3 mt-2">
            {/* B2: item count */}
            <span className="type-data">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </span>
            {/* B3: dynamic location label */}
            <span className="type-data text-muted">
              {locationLabel}
            </span>
          </div>
        </div>

        {/* Grouped items */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-8">
          {Object.entries(groupedItems).map(([brand, items], groupIndex) => (
            <div key={brand} className="space-y-3">

              {/* B7: store/brand header */}
              <div className="flex items-baseline justify-between pt-2 pb-1 border-b border-line">
                <h2 className="text-xl font-medium leading-none">{brand}</h2>
                <span className="type-data text-muted">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${item.scannedAt}`}
                    initial={{ x: -16, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: (groupIndex * 0.08) + (index * 0.04) }}
                    className="border border-line rounded-sm p-4"
                  >
                    <div className="flex gap-3">
                      {/* B4/B5: thumbnail tap → photo viewer */}
                      <button
                        onClick={() => openViewer(item, 0)}
                        className="w-20 h-24 border border-line rounded-sm overflow-hidden flex-shrink-0 active:opacity-70"
                        aria-label="View photos"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Photo count badge */}
                        {item.photos && item.photos.length > 1 && (
                          <div className="relative">
                            <span className="absolute bottom-1 right-1 bg-ink text-bg font-mono text-[8px] px-1.5 py-0.5 rounded-sm">
                              1/{item.photos.length}
                            </span>
                          </div>
                        )}
                      </button>

                      {/* Item info — tap to open detail page (B8) */}
                      <button
                        className="flex-1 flex flex-col py-0.5 text-left"
                        onClick={() => setSelectedItem(item)}
                      >
                        <p className="type-data text-muted">{item.brand}</p>
                        <h3 className="font-medium text-sm leading-tight mt-0.5 line-clamp-2">{item.name}</h3>
                        <p className="type-data text-muted mt-1">
                          {[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(' · ')}
                        </p>

                        <div className="mt-auto flex items-center justify-between pt-3">
                          <span className="text-base font-medium tabular-nums">
                            {CURRENCY_SYMBOL}{item.price.toFixed(2)}
                          </span>

                          {/* B10: quantity controls */}
                          <div
                            className="flex items-center border border-line rounded-sm px-1"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={() => item.dbId && onUpdateQuantity(item.dbId, item.quantity - 1)}
                              aria-label="Less"
                              className="w-7 h-7 flex items-center justify-center active:opacity-70"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center font-mono text-xs">{item.quantity}</span>
                            <button
                              onClick={() => item.dbId && onUpdateQuantity(item.dbId, item.quantity + 1)}
                              aria-label="More"
                              className="w-7 h-7 flex items-center justify-center active:opacity-70"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </button>
                    </div>
                    {/* B6: "Scanned at / Verified" bar removed */}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Checkout summary */}
        <div className="px-6 py-5 bg-bg border-t border-line flex-shrink-0">
          <div className="flex justify-between items-end mb-5">
            <span className="type-data text-muted">Total</span>
            <span className="type-hero tabular-nums">
              {CURRENCY_SYMBOL}{subtotal.toFixed(2)}
            </span>
          </div>
          <Button
            disabled={!CHECKOUT_PREVIEW}
            onClick={() => setOrderNumber(`UT-${Date.now().toString().slice(-6)}`)}
            className="w-full h-14 text-base disabled:cursor-not-allowed"
          >
            Buy
            {!CHECKOUT_PREVIEW && <span className="ml-1.5 text-xs font-normal">(coming soon)</span>}
          </Button>
        </div>
      </div>

      {/* Photo viewer overlay (B5) */}
      <AnimatePresence>
        {viewerItem && (
          <PhotoViewer
            photos={viewerItem.photos?.length ? viewerItem.photos : [viewerItem.image]}
            initialIndex={viewerIndex}
            onClose={() => setViewerItem(null)}
          />
        )}
      </AnimatePresence>

      {/* Item detail page (B8) */}
      <AnimatePresence>
        {selectedItem && (
          <ItemDetail
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onRemove={() => handleRemoveFromDetail(selectedItem.dbId)}
          />
        )}
      </AnimatePresence>

      {/* The blue moment */}
      <AnimatePresence>
        {orderNumber && (
          <PurchaseConfirmation
            orderNumber={orderNumber}
            deliveryLine="Home tomorrow"
            onClose={() => setOrderNumber(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
