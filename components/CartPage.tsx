import { useState, useRef } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, X, ArrowRight, ChevronLeft, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { CartItem } from './MainApp';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrency } from '../lib/currency';
import { findOnline } from '../lib/resolveUrl';

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

  const LABELS = ['GARMENT', 'EAN CODE', 'LABEL'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <span className="text-white/50 text-[10px] font-black tracking-widest uppercase">
          {LABELS[index] ?? `Photo ${index + 1}`}
        </span>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Photo */}
      <div className="flex-1 flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={photos[index]}
            alt={LABELS[index] ?? `Photo ${index + 1}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="w-full max-h-full object-contain rounded-2xl"
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
                i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
        {photos.length > 1 && (
          <div className="flex gap-4">
            <button
              onClick={prev}
              disabled={index === 0}
              className="px-5 py-2.5 rounded-full bg-white/10 text-white text-sm font-bold disabled:opacity-30"
            >
              ← Prev
            </button>
            <button
              onClick={next}
              disabled={index === photos.length - 1}
              className="px-5 py-2.5 rounded-full bg-white/10 text-white text-sm font-bold disabled:opacity-30"
            >
              Next →
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
  const LABELS = ['GARMENT', 'EAN CODE', 'LABEL'];

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
      className="fixed inset-0 z-50 bg-[#EDF0F5] dark:bg-[#0F0F0F] flex flex-col overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-6 pt-6 pb-4 flex-shrink-0 bg-[#EDF0F5] dark:bg-[#0F0F0F]">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#1A1A1A] flex items-center justify-center shadow-sm"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <span className="font-display text-[#651610] text-lg">item details</span>
      </div>

      {/* Photo gallery */}
      <div
        className="mx-4 rounded-3xl overflow-hidden bg-white dark:bg-[#1A1A1A] shadow-md aspect-[4/3] relative flex-shrink-0"
        style={{ touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={photoIndex}
            src={photos[photoIndex]}
            alt={LABELS[photoIndex] ?? `Photo ${photoIndex + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Photo label badge */}
        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
          <span className="text-white text-[9px] font-black tracking-widest">
            {LABELS[photoIndex] ?? `PHOTO ${photoIndex + 1}`}
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
                  i === photoIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details card */}
      <div className="mx-4 mt-4 bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-black text-[#651610] uppercase tracking-widest">{item.brand}</p>
          <h2 className="font-display text-gray-900 dark:text-white text-2xl mt-1 leading-tight">{item.name.toLowerCase()}</h2>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {currencySymbol}{item.price.toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {item.size && (
            <div className="bg-[#EDF0F5] dark:bg-[#2A2A2A] rounded-2xl px-4 py-3">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Size</p>
              <p className="text-sm font-black text-gray-900 dark:text-white">{item.size}</p>
            </div>
          )}
          {item.color && (
            <div className="bg-[#EDF0F5] dark:bg-[#2A2A2A] rounded-2xl px-4 py-3">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Colour</p>
              <p className="text-sm font-black text-gray-900 dark:text-white">{item.color}</p>
            </div>
          )}
          {item.ean && (
            <div className="bg-[#EDF0F5] dark:bg-[#2A2A2A] rounded-2xl px-4 py-3">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">EAN</p>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{item.ean}</p>
            </div>
          )}
          {item.scannedAt && (
            <div className="bg-[#EDF0F5] dark:bg-[#2A2A2A] rounded-2xl px-4 py-3">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Scanned at</p>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{item.scannedAt}</p>
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
          className="flex items-center justify-between w-full bg-[#651610] rounded-2xl px-5 py-4 group active:bg-[#7d1e17] transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          <span className="text-white font-black text-sm">
            {isFinding ? 'Looking up…' : 'Find online'}
          </span>
          <ExternalLink className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
        </button>

        <button
          onClick={onRemove}
          className="w-full flex items-center justify-center gap-2 py-3 text-red-400 text-sm font-bold hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Remove from bag
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
    ? 'In-Store Scans'
    : scanLocations.length === 1
    ? `${scanLocations[0]} Scans`
    : 'Multiple Location Scans';

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
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[#EDF0F5] dark:bg-[#0F0F0F]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-white dark:bg-[#1A1A1A] rounded-full flex items-center justify-center mb-6 shadow-sm"
        >
          <ShoppingBag className="w-10 h-10 text-gray-200 dark:text-gray-600" />
        </motion.div>
        <h2 className="font-display text-2xl text-gray-900 dark:text-white mb-2 text-center">your bag is empty</h2>
        <p className="text-gray-400 text-center mb-8 max-w-[240px] text-sm">
          Scan garments in-store to add items to your bag.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col bg-[#EDF0F5] dark:bg-[#0F0F0F]">

        {/* B1: Header — font-display #651610 */}
        <div className="px-6 pt-4 pb-4 bg-[#EDF0F5] dark:bg-[#0F0F0F] sticky top-0 z-10">
          <h1 className="font-display text-[#651610] text-4xl leading-none">your bag</h1>
          <div className="flex items-center gap-2 mt-2">
            {/* B2: badge — #FFC8FF bg, #651610 text */}
            <span className="text-[10px] font-black bg-[#FFC8FF] text-[#651610] px-2.5 py-0.5 rounded-full uppercase tracking-tighter">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </span>
            {/* B3: dynamic location label */}
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              {locationLabel}
            </span>
          </div>
        </div>

        {/* Grouped items */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-8">
          {Object.entries(groupedItems).map(([brand, items], groupIndex) => (
            <div key={brand} className="space-y-3">

              {/* B7: Prominent store/brand header — font-display, #651610, larger */}
              <div className="flex items-baseline justify-between pt-2 pb-1 border-b-2 border-[#651610]/10">
                <h2 className="font-display text-[#651610] text-xl leading-none">{brand.toLowerCase()}</h2>
                <span className="text-[10px] font-black text-[#651610]/50 uppercase tracking-widest">
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
                    className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-4 shadow-sm"
                  >
                    <div className="flex gap-3">
                      {/* B4/B5: thumbnail tap → photo viewer */}
                      <button
                        onClick={() => openViewer(item, 0)}
                        className="w-20 h-24 bg-[#EDF0F5] dark:bg-[#2A2A2A] rounded-2xl overflow-hidden flex-shrink-0 shadow-inner active:scale-95 transition-transform"
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
                            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
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
                        <p className="text-[9px] font-black text-[#651610] uppercase tracking-widest">{item.brand}</p>
                        <h3 className="font-black text-gray-900 dark:text-white text-sm leading-tight mt-0.5 line-clamp-2">{item.name}</h3>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                          {[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(' · ')}
                        </p>

                        <div className="mt-auto flex items-center justify-between pt-3">
                          <span className="text-base font-black text-gray-900 dark:text-white">
                            {CURRENCY_SYMBOL}{item.price.toFixed(2)}
                          </span>

                          {/* B10: quantity controls — #651610 */}
                          <div
                            className="flex items-center border border-[#651610]/30 rounded-full px-1"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={() => item.dbId && onUpdateQuantity(item.dbId, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-[#651610] hover:text-[#7d1e17]"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-gray-900 dark:text-white">{item.quantity}</span>
                            <button
                              onClick={() => item.dbId && onUpdateQuantity(item.dbId, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-[#651610] hover:text-[#7d1e17]"
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
        <div className="px-6 py-5 bg-white dark:bg-[#1A1A1A] rounded-t-[32px] shadow-[0_-16px_40px_rgba(0,0,0,0.06)] flex-shrink-0">
          <div className="flex justify-between items-center mb-5">
            <span className="text-base font-bold text-gray-500 dark:text-gray-400">Total</span>
            <span className="font-display text-[#651610] text-3xl leading-none">
              {CURRENCY_SYMBOL}{subtotal.toFixed(2)}
            </span>
          </div>
          <Button
            disabled
            className="w-full h-14 rounded-2xl bg-gray-200 dark:bg-[#2A2A2A] text-gray-400 dark:text-gray-500 font-black text-base cursor-not-allowed shadow-none"
          >
            Checkout <span className="ml-1.5 text-xs font-bold opacity-60">(coming soon)</span>
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
    </>
  );
}
