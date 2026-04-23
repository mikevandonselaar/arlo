import { useState, useRef, useEffect } from 'react';
import { X, Camera, Flashlight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Product } from './MainApp';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeLabelImage, LabelExtraction } from '../lib/vision';

// ── Dev mock ─────────────────────────────────────────────────────────────────
// Set DEV_MOCK_SCAN = false once real API keys (VITE_OPENAI_API_KEY /
// VITE_ANTHROPIC_API_KEY) are configured in .env
const DEV_MOCK_SCAN = true;

const MOCK_EXTRACTION: LabelExtraction = {
  ean:      '4066748396942',
  brand:    'Adidas',
  name:     'Yeezy Boost 350 V2',
  price:    120.00,
  category: 'Footwear',
  size:     '42',
  color:    'Core Black',
  material: '100% Primeknit upper',
};

// S4: Ordered 3-photo flow — recommended but not enforced
const PHOTO_STEPS = [
  { label: 'GARMENT',  instruction: 'Take a photo of the garment',         phase: 'GARMENT PHOTO' },
  { label: 'EAN CODE', instruction: 'Take a photo of the EAN / barcode',    phase: 'EAN CODE PHOTO' },
  { label: 'LABEL',    instruction: 'Take a photo of the label / brand tag', phase: 'LABEL PHOTO' },
] as const;

const MAX_PHOTOS = PHOTO_STEPS.length;

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
        toast.error('Camera access denied');
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
        size:      extraction.size ?? undefined,
        color:     extraction.color ?? undefined,
        scannedAt: 'In-Store Scan',
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
        scannedAt: product.scannedAt ?? 'In-Store Scan',
      });
    } catch {
      toast.error('Could not read label — try better lighting or a closer shot.');
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
  const phaseLabel = capturedPhotos.length >= MAX_PHOTOS
    ? 'READY TO ANALYSE'
    : nextStep?.phase ?? 'READY TO ANALYSE';

  // Price validation for the confirm button (A3 — applied here too for consistency)
  const priceValue   = parseFloat(editState?.price ?? '');
  const priceInvalid = !editState?.price || isNaN(priceValue) || priceValue <= 0;

  return (
    <div className="relative h-full bg-black overflow-hidden">

      {/* ── Idle screen ── */}
      {!isScanning ? (
        <div className="h-full flex flex-col items-center justify-center p-8 text-white bg-[#0F0F0F]">

          {/* DEV MODE badge */}
          {DEV_MOCK_SCAN && (
            <div className="absolute top-6 right-6 bg-[#FFC8FF] text-[#651610] text-[9px] font-black px-3 py-1 rounded-full tracking-widest uppercase">
              DEV MOCK
            </div>
          )}

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 bg-[#651610]/10 rounded-full flex items-center justify-center mb-8 border border-[#651610]/30"
          >
            <Camera className="w-16 h-16 text-[#651610]" />
          </motion.div>

          {/* S1: title */}
          <h2 className="font-display text-3xl mb-4">scan garment</h2>

          {/* S2: instruction text */}
          <p className="text-gray-400 text-center mb-12 max-w-xs leading-relaxed text-sm">
            {DEV_MOCK_SCAN
              ? 'Dev mode active — returns mock Adidas Yeezy data instantly.'
              : 'Follow the instructions after opening your camera.'}
          </p>

          {/* S3: Start button */}
          <Button
            onClick={() => setIsScanning(true)}
            className="bg-[#651610] hover:bg-[#7d1e17] text-white font-black w-full h-14 rounded-2xl mb-3 text-lg"
          >
            Start Camera
          </Button>

          {/* DEV shortcut — skip camera entirely */}
          {DEV_MOCK_SCAN && (
            <Button
              onClick={handleAnalyse}
              variant="outline"
              className="w-full h-12 rounded-2xl border-2 border-[#FFC8FF] text-[#FFC8FF] font-black text-sm bg-transparent hover:bg-[#FFC8FF]/10 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Skip camera — use mock data
            </Button>
          )}

          {/* S3: updated subtitle */}
          {!DEV_MOCK_SCAN && (
            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-4">
              Point at the garment
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

          <div className="absolute inset-0 flex flex-col">

            {/* Header */}
            <div className="p-6 flex justify-between items-center z-20 flex-shrink-0">
              <button
                onClick={stopCamera}
                className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <span className="text-white text-[10px] font-black tracking-widest">
                {phaseLabel}
              </span>

              <button className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white">
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
                      alt={PHOTO_STEPS[i]?.label ?? `Photo ${i + 1}`}
                      className="w-16 h-20 object-cover rounded-xl border-2 border-[#FFC8FF]"
                    />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-black rounded-full flex items-center justify-center border border-white/30"
                      aria-label="Remove photo"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <span className="absolute bottom-1 left-1 text-[8px] font-black text-white bg-black/60 px-1 rounded">
                      {PHOTO_STEPS[i]?.label ?? `PHOTO ${i + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Instruction + scan frame */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              {!isAnalyzing && nextStep && capturedPhotos.length < MAX_PHOTOS && (
                <p className="text-white text-xs font-bold tracking-wide px-6 py-2 bg-black/40 backdrop-blur-md rounded-full">
                  {nextStep.instruction}
                </p>
              )}

              {/* S7: Scan frame — #FFC8FF corners */}
              <div className="w-56 h-72 relative">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-[#FFC8FF] rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-[#FFC8FF] rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-[#FFC8FF] rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-[#FFC8FF] rounded-br-2xl" />
                {isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-[#FFC8FF] animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            {isAnalyzing ? (

              <div className="p-8 pb-12 flex flex-col items-center gap-3 z-20">
                <p className="text-white font-bold tracking-widest uppercase text-xs opacity-80">
                  Analysing garment…
                </p>
              </div>

            ) : capturedPhotos.length >= MAX_PHOTOS ? (

              /* All 3 photos taken — show Analyse Garment button */
              <div className="p-6 pb-12 z-20 flex flex-col items-center gap-4">
                <Button
                  onClick={handleAnalyse}
                  className="bg-[#651610] hover:bg-[#7d1e17] text-white font-black h-14 rounded-2xl text-base flex items-center justify-center gap-2 w-full"
                >
                  <Sparkles className="w-5 h-5" />
                  Analyse Garment
                </Button>
              </div>

            ) : (

              /* Camera button — always visible until all 3 photos are taken */
              <div className="p-8 pb-12 flex flex-col items-center gap-4 z-20">
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="Capture photo"
                >
                  <div className="w-14 h-14 rounded-full bg-white" />
                </button>
                {DEV_MOCK_SCAN && (
                  <button
                    onClick={handleAnalyse}
                    className="flex items-center gap-1.5 text-[#FFC8FF] text-xs font-black tracking-widest uppercase"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Use mock data
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
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 bg-white dark:bg-[#1A1A1A] rounded-t-[40px] z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] max-h-[90%] flex flex-col"
          >
            <div className="pt-5 pb-2 flex-shrink-0">
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto" />
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4 space-y-5">

              {/* A1: "GARMENT DETAILS" label */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-[#2A2A2A] rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
                  <img src={scannedProduct.image} alt="Garment" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#651610] uppercase tracking-widest mb-0.5">
                    Garment Details
                  </p>
                  {/* A2: prominent subtitle */}
                  <p className="text-xs font-black text-[#651610] leading-snug">
                    Correct anything before adding to bag.
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label className="text-gray-500 font-bold text-[10px] uppercase tracking-widest ml-1">Product Name</Label>
                <Input
                  value={editState.name}
                  onChange={e => setEditState(s => s && ({ ...s, name: e.target.value }))}
                  className="bg-[#EDF0F5] dark:bg-[#2A2A2A] border-transparent text-gray-900 dark:text-white h-12 rounded-2xl shadow-none"
                />
              </div>

              {/* Brand */}
              <div className="space-y-1.5">
                <Label className="text-gray-500 font-bold text-[10px] uppercase tracking-widest ml-1">Brand</Label>
                <Input
                  value={editState.brand}
                  onChange={e => setEditState(s => s && ({ ...s, brand: e.target.value }))}
                  className="bg-[#EDF0F5] dark:bg-[#2A2A2A] border-transparent text-gray-900 dark:text-white h-12 rounded-2xl shadow-none"
                />
              </div>

              {/* Price + Size */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  {/* A3: price warning label when empty/zero */}
                  <Label className={`font-bold text-[10px] uppercase tracking-widest ml-1 ${priceInvalid ? 'text-[#651610]' : 'text-gray-500'}`}>
                    {priceInvalid ? '⚠ Price required' : 'Price (£)'}
                  </Label>
                  {/* A3: red border when price is empty/zero */}
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={editState.price}
                    onChange={e => setEditState(s => s && ({ ...s, price: e.target.value }))}
                    className={`h-12 rounded-2xl shadow-none bg-[#EDF0F5] dark:bg-[#2A2A2A] text-gray-900 dark:text-white ${
                      priceInvalid
                        ? 'border-2 border-[#651610]'
                        : 'border-transparent'
                    }`}
                  />
                  {priceInvalid && (
                    <p className="text-[9px] font-bold text-[#651610] ml-1">Please check and fill in the price</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-500 font-bold text-[10px] uppercase tracking-widest ml-1">Size</Label>
                  <Input
                    placeholder="e.g. M"
                    value={editState.size}
                    onChange={e => setEditState(s => s && ({ ...s, size: e.target.value }))}
                    className="bg-[#EDF0F5] dark:bg-[#2A2A2A] border-transparent text-gray-900 dark:text-white h-12 rounded-2xl shadow-none"
                  />
                </div>
              </div>

              {/* Color + EAN */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-500 font-bold text-[10px] uppercase tracking-widest ml-1">Colour</Label>
                  <Input
                    placeholder="e.g. Black"
                    value={editState.color}
                    onChange={e => setEditState(s => s && ({ ...s, color: e.target.value }))}
                    className="bg-[#EDF0F5] dark:bg-[#2A2A2A] border-transparent text-gray-900 dark:text-white h-12 rounded-2xl shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-500 font-bold text-[10px] uppercase tracking-widest ml-1">EAN / Barcode</Label>
                  <Input
                    placeholder="e.g. 1234567890123"
                    value={editState.ean}
                    onChange={e => setEditState(s => s && ({ ...s, ean: e.target.value }))}
                    className="bg-[#EDF0F5] dark:bg-[#2A2A2A] border-transparent text-gray-900 dark:text-white h-12 rounded-2xl shadow-none"
                  />
                </div>
              </div>

              {/* Store name */}
              <div className="space-y-1.5">
                <Label className="text-gray-500 font-bold text-[10px] uppercase tracking-widest ml-1">Store Name</Label>
                <Input
                  placeholder="e.g. Nike, Oxford St"
                  value={editState.scannedAt}
                  onChange={e => setEditState(s => s && ({ ...s, scannedAt: e.target.value }))}
                  className="bg-[#EDF0F5] dark:bg-[#2A2A2A] border-transparent text-gray-900 dark:text-white h-12 rounded-2xl shadow-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                {/* A6: Cancel — outline #651610 */}
                <Button
                  variant="outline"
                  onClick={handleCancelProduct}
                  className="flex-1 h-14 rounded-2xl border-2 border-[#651610] text-[#651610] font-bold bg-transparent hover:bg-[#651610]/5"
                >
                  Cancel
                </Button>
                {/* A3/A5: disabled when price invalid */}
                <Button
                  onClick={handleConfirm}
                  disabled={priceInvalid}
                  className="flex-[2] h-14 rounded-2xl bg-[#651610] hover:bg-[#7d1e17] text-white font-black disabled:bg-[#CCCCCC] disabled:cursor-not-allowed"
                >
                  Looks good →
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
