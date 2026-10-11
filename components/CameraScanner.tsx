import { useState, useRef, useEffect } from 'react';
import { X, Camera, Flashlight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Product } from './MainApp';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeLabelImage, LabelExtraction } from '../lib/vision';
import { useCurrency } from '../lib/currency';

// ── Dev mock ─────────────────────────────────────────────────────────────────
// Set DEV_MOCK_SCAN = false once real API keys (VITE_OPENAI_API_KEY /
// VITE_ANTHROPIC_API_KEY) are configured in .env
const DEV_MOCK_SCAN = false;

const MOCK_EXTRACTION: LabelExtraction = {
  ean:      '4066748396942',
  brand:    'Adidas',
  name:     'Yeezy Boost 350 V2',
  price:    120.00,
  category: 'Footwear',
  size:     '42',
  color:    'Core Black',
  material: '100% Primeknit upper',
  articleCode: 'FY0121',
};

// S4: Ordered 3-photo flow — recommended but not enforced
const PHOTO_STEPS = [
  { label: 'Kledingstuk', instruction: 'Maak een foto van het kledingstuk',       phase: 'Foto kledingstuk' },
  { label: 'EAN',         instruction: 'Maak een foto van de EAN / barcode',      phase: 'Foto EAN' },
  { label: 'Label',       instruction: 'Maak een foto van het label / merklabel', phase: 'Foto label' },
] as const;

const MAX_PHOTOS = PHOTO_STEPS.length;

const DEFAULT_STORE = 'In de winkel';

// Viewfinder corners. On recognition they click inwards by CORNER_SNAP px.
const CORNER_SNAP = 10;
const CORNERS = [
  { position: 'top-0 left-0',     border: 'border-t-2 border-l-2', x:  1, y:  1 },
  { position: 'top-0 right-0',    border: 'border-t-2 border-r-2', x: -1, y:  1 },
  { position: 'bottom-0 left-0',  border: 'border-b-2 border-l-2', x:  1, y: -1 },
  { position: 'bottom-0 right-0', border: 'border-b-2 border-r-2', x: -1, y: -1 },
] as const;

interface EditState {
  name: string;
  brand: string;
  price: string;
  size: string;
  color: string;
  ean: string;
  scannedAt: string;
}

interface CameraScannerProps {
  onAddToCart: (product: Product) => void;
}

export function CameraScanner({ onAddToCart }: CameraScannerProps) {
  const { symbol: currencySymbol } = useCurrency();
  const [isScanning, setIsScanning]         = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing]       = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [editState, setEditState]           = useState<EditState | null>(null);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isScanning) return;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        toast.error('Geen toegang tot de camera');
        setIsScanning(false);
      });
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [isScanning]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsScanning(false);
    setCapturedPhotos([]);
    setScannedProduct(null);
    setEditState(null);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || capturedPhotos.length >= MAX_PHOTOS) return;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    setCapturedPhotos(prev => [...prev, canvas.toDataURL('image/jpeg', 0.85)]);
  };

  const removePhoto = (index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyse = async () => {
    if (!DEV_MOCK_SCAN && capturedPhotos.length === 0) return;
    setIsAnalyzing(true);
    try {
      // In dev mock mode: skip the API, return hardcoded data after a short delay
      const extraction: LabelExtraction = DEV_MOCK_SCAN
        ? await new Promise(resolve => setTimeout(() => resolve(MOCK_EXTRACTION), 900))
        : await analyzeLabelImage(capturedPhotos);
      const product: Product = {
        id:        extraction.ean ?? `scan-${Date.now()}`,
        name:      extraction.name,
        price:     extraction.price ?? 0,
        brand:     extraction.brand,
        category:  extraction.category,
        image:     capturedPhotos[0], // garment photo → cart thumbnail (B4)
        photos:    [...capturedPhotos], // all photos for detail viewer (B5/B8)
        ean:       extraction.ean ?? undefined,
        articleCode: extraction.articleCode ?? undefined,
        size:      extraction.size ?? undefined,
        color:     extraction.color ?? undefined,
        scannedAt: DEFAULT_STORE,
        shippedBy: extraction.brand,
      };
      setScannedProduct(product);
      setEditState({
        name:      product.name,
        brand:     product.brand,
        price:     product.price > 0 ? product.price.toFixed(2) : '',
        size:      product.size  ?? '',
        color:     product.color ?? '',
        ean:       product.ean   ?? '',
        scannedAt: product.scannedAt ?? DEFAULT_STORE,
      });
      // Recognised — short haptic tick where the device supports it
      navigator.vibrate?.(10);
    } catch {
      toast.error('Label niet leesbaar. Probeer meer licht of ga dichterbij.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (!scannedProduct || !editState) return;
    const parsedPrice  = parseFloat(editState.price);
    const eanTrimmed   = editState.ean.trim() || undefined;
    onAddToCart({
      ...scannedProduct,
      name:      editState.name.trim()      || scannedProduct.name,
      brand:     editState.brand.trim()     || scannedProduct.brand,
      price:     isNaN(parsedPrice) ? scannedProduct.price : parsedPrice,
      size:      editState.size.trim()      || undefined,
      color:     editState.color.trim()     || undefined,
      ean:       eanTrimmed,
      id:        eanTrimmed ?? scannedProduct.id,
      scannedAt: editState.scannedAt.trim() || scannedProduct.scannedAt,
      shippedBy: editState.brand.trim()     || scannedProduct.brand,
      photos:    scannedProduct.photos,     // carry all photos through to the cart
    });
    setScannedProduct(null);
    setEditState(null);
    setCapturedPhotos([]);
  };

  const handleCancelProduct = () => {
    setScannedProduct(null);
    setEditState(null);
    setCapturedPhotos([]);
  };

  // Derive current step labels from photo count
  const nextStep   = PHOTO_STEPS[capturedPhotos.length];
  const recognised = scannedProduct !== null;
  const phaseLabel = recognised
    ? 'Gescand'
    : capturedPhotos.length >= MAX_PHOTOS
    ? 'Klaar voor analyse'
    : nextStep?.phase ?? 'Klaar voor analyse';

  // Price validation for the confirm button (A3 — applied here too for consistency)
  const priceValue   = parseFloat(editState?.price ?? '');
  const priceInvalid = !editState?.price || isNaN(priceValue) || priceValue <= 0;

  return (
    <div className="relative h-full bg-ink overflow-hidden">

      {/* ── Idle screen ── */}
      {!isScanning ? (
        <div className="h-full flex flex-col items-center justify-center p-8 text-ink bg-bg">

          {/* DEV MODE badge */}
          {DEV_MOCK_SCAN && (
            <div className="absolute top-6 right-6 border border-ink type-data px-3 py-1 rounded-sm">
              Dev mock
            </div>
          )}

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 rounded-full flex items-center justify-center mb-8 border border-line"
          >
            <Camera className="w-16 h-16" />
          </motion.div>

          {/* S1: title */}
          <h2 className="type-hero mb-6">Scan</h2>

          {/* S2: instruction text */}
          <p className="text-muted text-center mb-12 max-w-xs leading-relaxed text-sm">
            {DEV_MOCK_SCAN
              ? 'Dev-modus actief. Geeft direct mockdata van een Adidas Yeezy terug.'
              : 'Open de camera en volg de stappen.'}
          </p>

          {/* S3: Start button */}
          <Button
            onClick={() => setIsScanning(true)}
            className="w-full h-14 mb-3 text-lg"
          >
            Start camera
          </Button>

          {/* DEV shortcut — skip camera entirely */}
          {DEV_MOCK_SCAN && (
            <Button
              onClick={handleAnalyse}
              variant="outline"
              className="w-full h-12 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Sla camera over, gebruik mockdata
            </Button>
          )}

          {/* S3: updated subtitle */}
          {!DEV_MOCK_SCAN && (
            <p className="type-data text-muted mt-4">
              Richt op het kledingstuk
            </p>
          )}
        </div>

      ) : (

        /* ── Camera screen ── */
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover opacity-70"
          />

          <div className="absolute inset-0 flex flex-col text-on-accent">

            {/* Header */}
            <div className="p-6 flex justify-between items-center z-20 flex-shrink-0">
              <button
                onClick={stopCamera}
                aria-label="Sluit camera"
                className="w-12 h-12 bg-ink/40 rounded-sm flex items-center justify-center active:opacity-70"
              >
                <X className="w-6 h-6" />
              </button>

              <span className="type-data flex items-center gap-2">
                {recognised && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                {phaseLabel}
              </span>

              <button
                aria-label="Zaklamp"
                className="w-12 h-12 bg-ink/40 rounded-sm flex items-center justify-center active:opacity-70"
              >
                <Flashlight className="w-6 h-6" />
              </button>
            </div>

            {/* Photo thumbnails — top center, visible as soon as first photo taken */}
            {capturedPhotos.length > 0 && (
              <div className="flex justify-center gap-3 px-4 pb-2 z-20 flex-shrink-0">
                {capturedPhotos.map((photo, i) => (
                  <div key={i} className="relative">
                    <img
                      src={photo}
                      alt={PHOTO_STEPS[i]?.label ?? `Foto ${i + 1}`}
                      className="w-16 h-20 object-cover rounded-sm border border-on-accent"
                    />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-ink rounded-full flex items-center justify-center border border-on-accent/30"
                      aria-label="Verwijder foto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 font-mono text-[8px] uppercase bg-ink/60 px-1 rounded-sm">
                      {PHOTO_STEPS[i]?.label ?? `Foto ${i + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Instruction + scan frame */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              {!isAnalyzing && nextStep && capturedPhotos.length < MAX_PHOTOS && (
                <p className="text-xs font-medium px-4 py-2 bg-ink/40 rounded-sm">
                  {nextStep.instruction}
                </p>
              )}

              {/* S7: Viewfinder — four accent corners that click inwards on recognition */}
              <div className="w-56 h-72 relative">
                {CORNERS.map(corner => (
                  <motion.div
                    key={corner.position}
                    className={`absolute w-10 h-10 border-accent ${corner.position} ${corner.border}`}
                    animate={{
                      x: recognised ? corner.x * CORNER_SNAP : 0,
                      y: recognised ? corner.y * CORNER_SNAP : 0,
                    }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  />
                ))}
                {isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            {isAnalyzing ? (

              <div className="p-8 pb-12 flex flex-col items-center gap-3 z-20">
                <p className="type-data">
                  Analyseren
                </p>
              </div>

            ) : capturedPhotos.length >= MAX_PHOTOS ? (

              /* All 3 photos taken — show Analyse Garment button */
              <div className="p-6 pb-12 z-20 flex flex-col items-center gap-4">
                <Button
                  onClick={handleAnalyse}
                  className="h-14 text-base w-full"
                >
                  <Sparkles className="w-5 h-5" />
                  Analyseer
                </Button>
              </div>

            ) : (

              /* Camera button — always visible until all 3 photos are taken */
              <div className="p-8 pb-12 flex flex-col items-center gap-4 z-20">
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full border-4 border-on-accent flex items-center justify-center active:opacity-70"
                  aria-label="Maak foto"
                >
                  <div className="w-14 h-14 rounded-full bg-on-accent" />
                </button>
                {DEV_MOCK_SCAN && (
                  <button
                    onClick={handleAnalyse}
                    className="flex items-center gap-1.5 type-data"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Gebruik mockdata
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Result drawer (editable) — Section 4 / A-series changes applied here ── */}
      <AnimatePresence>
        {scannedProduct && editState && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            // Starts just after the corners have clicked in
            transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.18 }}
            className="absolute inset-x-0 bottom-0 bg-bg text-ink border-t border-line z-50 max-h-[90%] flex flex-col"
          >
            <div className="pt-5 pb-2 flex-shrink-0">
              <div className="w-12 h-1 bg-line mx-auto" />
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4 space-y-5">

              {/* A1: "GARMENT DETAILS" label */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border border-line rounded-sm overflow-hidden flex-shrink-0">
                  <img src={scannedProduct.image} alt="Kledingstuk" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="type-data flex items-center gap-2 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Gescand
                  </p>
                  {/* A2: prominent subtitle */}
                  <p className="text-xs text-muted leading-snug">
                    Controleer de gegevens en pas aan waar nodig.
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label className="ml-1">Productnaam</Label>
                <Input
                  value={editState.name}
                  onChange={e => setEditState(s => s && ({ ...s, name: e.target.value }))}
                  className="h-12"
                />
              </div>

              {/* Brand */}
              <div className="space-y-1.5">
                <Label className="ml-1">Merk</Label>
                <Input
                  value={editState.brand}
                  onChange={e => setEditState(s => s && ({ ...s, brand: e.target.value }))}
                  className="h-12"
                />
              </div>

              {/* Price + Size */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className={`ml-1 ${priceInvalid ? 'text-ink' : ''}`}>
                    {priceInvalid ? 'Prijs verplicht' : `Prijs (${currencySymbol})`}
                  </Label>
                  {/* A3: heavy border when price is empty/zero */}
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={editState.price}
                    onChange={e => setEditState(s => s && ({ ...s, price: e.target.value }))}
                    className={`h-12 ${priceInvalid ? 'border-2 border-ink' : ''}`}
                  />
                  {priceInvalid && (
                    <p className="text-[10px] text-ink ml-1">Vul de prijs in</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="ml-1">Maat</Label>
                  <Input
                    placeholder="bv. M"
                    value={editState.size}
                    onChange={e => setEditState(s => s && ({ ...s, size: e.target.value }))}
                    className="h-12"
                  />
                </div>
              </div>

              {/* Color + EAN */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="ml-1">Kleur</Label>
                  <Input
                    placeholder="bv. Zwart"
                    value={editState.color}
                    onChange={e => setEditState(s => s && ({ ...s, color: e.target.value }))}
                    className="h-12"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="ml-1">EAN / barcode</Label>
                  <Input
                    placeholder="bv. 1234567890123"
                    value={editState.ean}
                    onChange={e => setEditState(s => s && ({ ...s, ean: e.target.value }))}
                    className="h-12 font-mono"
                  />
                </div>
              </div>

              {/* Store name */}
              <div className="space-y-1.5">
                <Label className="ml-1">Winkel</Label>
                <Input
                  placeholder="bv. Nike, Kalverstraat"
                  value={editState.scannedAt}
                  onChange={e => setEditState(s => s && ({ ...s, scannedAt: e.target.value }))}
                  className="h-12"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                {/* A6: Cancel — outline */}
                <Button
                  variant="outline"
                  onClick={handleCancelProduct}
                  className="flex-1 h-14"
                >
                  Annuleer
                </Button>
                {/* A3/A5: disabled when price invalid */}
                <Button
                  onClick={handleConfirm}
                  disabled={priceInvalid}
                  className="flex-[2] h-14 disabled:cursor-not-allowed"
                >
                  In mand
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
