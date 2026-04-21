import { useState, useRef, useEffect } from 'react';
import { X, Camera, Flashlight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Product } from './MainApp';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeLabelImage } from '../lib/vision';

interface EditState {
  name: string;
  brand: string;
  price: string;   // string so the input is freely editable
  size: string;
  color: string;
  ean: string;
  scannedAt: string;
}

interface CameraScannerProps {
  onAddToCart: (product: Product) => void;
}

export function CameraScanner({ onAddToCart }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start / stop the camera stream whenever isScanning toggles
  useEffect(() => {
    if (!isScanning) return;

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
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

  // Grab the current video frame and store it as a JPEG data URL
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhotos(prev => [...prev, dataUrl]);
  };

  const removePhoto = (index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyse = async () => {
    if (capturedPhotos.length === 0) return;
    setIsAnalyzing(true);

    try {
      const extraction = await analyzeLabelImage(capturedPhotos);
      const product: Product = {
        id: extraction.ean ?? `scan-${Date.now()}`,
        name: extraction.name,
        price: extraction.price ?? 0,
        brand: extraction.brand,
        category: extraction.category,
        image: capturedPhotos[0],        // first photo becomes the cart thumbnail
        ean: extraction.ean ?? undefined,
        size: extraction.size ?? undefined,
        color: extraction.color ?? undefined,
        scannedAt: 'In-Store Scan',
        shippedBy: extraction.brand,
      };
      setScannedProduct(product);
      setEditState({
        name: product.name,
        brand: product.brand,
        price: product.price > 0 ? product.price.toFixed(2) : '',
        size: product.size ?? '',
        color: product.color ?? '',
        ean: product.ean ?? '',
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
    const parsedPrice = parseFloat(editState.price);
    const eanTrimmed = editState.ean.trim() || undefined;
    onAddToCart({
      ...scannedProduct,
      name: editState.name.trim() || scannedProduct.name,
      brand: editState.brand.trim() || scannedProduct.brand,
      price: isNaN(parsedPrice) ? scannedProduct.price : parsedPrice,
      size: editState.size.trim() || undefined,
      color: editState.color.trim() || undefined,
      ean: eanTrimmed,
      // Update the product id if user corrected the EAN
      id: eanTrimmed ?? scannedProduct.id,
      scannedAt: editState.scannedAt.trim() || scannedProduct.scannedAt,
      shippedBy: editState.brand.trim() || scannedProduct.brand,
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

  const phaseLabel =
    capturedPhotos.length === 0
      ? 'FRONT LABEL'
      : capturedPhotos.length === 1
      ? 'BACK LABEL (OPTIONAL)'
      : 'READY TO ANALYSE';

  return (
    <div className="relative h-full bg-black overflow-hidden">

      {/* ── Idle screen ── */}
      {!isScanning ? (
        <div className="h-full flex flex-col items-center justify-center p-8 text-white">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 bg-[#51EAA7]/10 rounded-full flex items-center justify-center mb-8 border border-[#51EAA7]/30"
          >
            <Camera className="w-16 h-16 text-[#51EAA7]" />
          </motion.div>

          <h2 className="text-3xl font-black mb-4">Scan Label</h2>
          <p className="text-gray-400 text-center mb-12 max-w-xs leading-relaxed">
            Photograph the clothing label to instantly identify the product and extract details.
          </p>

          <Button
            onClick={() => setIsScanning(true)}
            className="bg-[#51EAA7] hover:bg-[#3ddb94] text-black font-black w-full h-14 rounded-2xl mb-4 text-lg"
          >
            Start Camera
          </Button>

          <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">
            Point at the clothing label
          </p>
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
            <div className="p-6 flex justify-between items-center z-20">
              <button
                onClick={stopCamera}
                className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <span className="text-white text-[10px] font-black tracking-widest">
                {phaseLabel}
              </span>

              {/* Torch placeholder — wired to torch API in a real device build */}
              <button className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                <Flashlight className="w-6 h-6" />
              </button>
            </div>

            {/* Label guide frame */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-56 h-72 relative">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-[#51EAA7] rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-[#51EAA7] rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-[#51EAA7] rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-[#51EAA7] rounded-br-2xl" />

                {isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-[#51EAA7] animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Footer — three states */}
            {isAnalyzing ? (

              <div className="p-8 pb-12 flex flex-col items-center gap-3 z-20">
                <p className="text-white font-bold tracking-widest uppercase text-xs opacity-80">
                  Analysing label…
                </p>
              </div>

            ) : capturedPhotos.length === 0 ? (

              /* No photos yet — shutter button */
              <div className="p-8 pb-12 flex flex-col items-center gap-6 z-20">
                <p className="text-white font-bold tracking-widest uppercase text-xs opacity-80">
                  Position Label in Frame
                </p>
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="Capture photo"
                >
                  <div className="w-14 h-14 rounded-full bg-white" />
                </button>
              </div>

            ) : (

              /* Photos captured — thumbnails + actions */
              <div className="p-6 pb-10 z-20 flex flex-col gap-4">
                <div className="flex gap-3 items-end">
                  {capturedPhotos.map((photo, i) => (
                    <div key={i} className="relative">
                      <img
                        src={photo}
                        alt={i === 0 ? 'Front label' : 'Back label'}
                        className="w-16 h-20 object-cover rounded-xl border-2 border-[#51EAA7]"
                      />
                      {/* Remove button */}
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-black rounded-full flex items-center justify-center border border-white/30"
                        aria-label="Remove photo"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                      <span className="absolute bottom-1 left-1 text-[8px] font-black text-white bg-black/50 px-1 rounded">
                        {i === 0 ? 'FRONT' : 'BACK'}
                      </span>
                    </div>
                  ))}

                  {/* Add-back-label slot */}
                  {capturedPhotos.length < 2 && (
                    <button
                      onClick={capturePhoto}
                      className="w-16 h-20 rounded-xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center gap-1 text-white/50 active:scale-95 transition-transform"
                      aria-label="Add back label photo"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-[8px] font-bold">+ BACK</span>
                    </button>
                  )}
                </div>

                <Button
                  onClick={handleAnalyse}
                  className="bg-[#51EAA7] hover:bg-[#3ddb94] text-black font-black h-14 rounded-2xl text-base flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Analyse Label
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Result drawer (editable) ── */}
      <AnimatePresence>
        {scannedProduct && editState && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-[40px] z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] max-h-[90%] flex flex-col"
          >
            {/* Drag handle */}
            <div className="pt-5 pb-2 flex-shrink-0">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto" />
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4 space-y-5">

              {/* Photo strip + header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
                  <img
                    src={scannedProduct.image}
                    alt="Label"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#51EAA7] uppercase tracking-widest mb-0.5">
                    Label details
                  </p>
                  <p className="text-xs text-gray-400 leading-snug">
                    Correct anything before adding to bag.
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label className="text-gray-500 font-bold text-[10px] uppercase tracking-widest ml-1">
                  Product Name
                </Label>
                <Input
                  value={editState.name}
                  onChange={e => setEditState(s => s && ({ ...s, name: e.target.value }))}
                  className="bg-[#F5F5F7] border-transparent text-gray-900 h-12 rounded-2xl shadow-none"
                />
              </div>

              {/* Brand */}
              <div className="space-y-1.5">
                <Label className="text-gray-500 font-bold text-[10px] uppercase tracking-widest ml-1">
                  Brand
                </Label>
                <Input
                  value={editState.brand}
                  onChange={e => setEditState(s => s && ({ ...s, brand: e.target.value }))}
                  className="bg-[#F5F5F7] border-transparent text-gray-900 h-12 rounded-2xl shadow-none"
                />
              </div>

              {/* Price + Size (side by side) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-500 font-bold text-[10px] uppercase tracking-widest ml-1">
                    Price (£)
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={editState.price}
                    onChange={e => setEditState(s => s && ({ ...s, price: e.target.value }))}
                    className="bg-[#F5F5F7] border-transparent text-gray-900 h-12 rounded-2xl shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-500 font-bold text-[10px] uppercase tracking-widest ml-1">
                    Size
                  </Label>
                  <Input
                    placeholder="e.g. M"
                    value={editState.size}
                    onChange={e => setEditState(s => s && ({ ...s, size: e.target.value }))}
                    className="bg-[#F5F5F7] border-transparent text-gray-900 h-12 rounded-2xl shadow-none"
                  />
                </div>
              </div>

              {/* Color + EAN (side by side) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-500 font-bold text-[10px] uppercase tracking-widest ml-1">
                    Colour
                  </Label>
                  <Input
                    placeholder="e.g. Black"
                    value={editState.color}
                    onChange={e => setEditState(s => s && ({ ...s, color: e.target.value }))}
                    className="bg-[#F5F5F7] border-transparent text-gray-900 h-12 rounded-2xl shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-500 font-bold text-[10px] uppercase tracking-widest ml-1">
                    EAN / Barcode
                  </Label>
                  <Input
                    placeholder="e.g. 1234567890123"
                    value={editState.ean}
                    onChange={e => setEditState(s => s && ({ ...s, ean: e.target.value }))}
                    className="bg-[#F5F5F7] border-transparent text-gray-900 h-12 rounded-2xl shadow-none"
                  />
                </div>
              </div>

              {/* Store name */}
              <div className="space-y-1.5">
                <Label className="text-gray-500 font-bold text-[10px] uppercase tracking-widest ml-1">
                  Store Name
                </Label>
                <Input
                  placeholder="e.g. Nike, Oxford St"
                  value={editState.scannedAt}
                  onChange={e => setEditState(s => s && ({ ...s, scannedAt: e.target.value }))}
                  className="bg-[#F5F5F7] border-transparent text-gray-900 h-12 rounded-2xl shadow-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={handleCancelProduct}
                  className="flex-1 h-14 rounded-2xl border-gray-200 text-gray-900 font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-[2] h-14 rounded-2xl bg-[#51EAA7] hover:bg-[#3ddb94] text-black font-black"
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
