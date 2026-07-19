import { useState, useEffect } from 'react';
import { Home, Camera, ShoppingBag, User } from 'lucide-react';
import { HomePage } from './HomePage';
import { CameraScanner } from './CameraScanner';
import { CartPage } from './CartPage';
import { ProfilePage } from './ProfilePage';
import HeadsUpScreen from '../screens/HeadsUpScreen';
import { toast } from 'sonner';
import * as cartOps from '../lib/cart';

type Page = 'home' | 'camera' | 'cart' | 'profile';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;        // always photos[0] — the garment photo
  photos?: string[];    // all captured photos [garment, ean, label] — session only, not persisted
  brand: string;
  category: string;
  ean?: string;
  articleCode?: string;
  size?: string;
  color?: string;
  scannedAt?: string;
  shippedBy?: string;
}

export interface CartItem extends Product {
  dbId?: string;   // Supabase UUID — present on all items once synced
  quantity: number;
}

interface MainAppProps {
  onSignOut: () => void;
}

export function MainApp({ onSignOut }: MainAppProps) {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [showHeadsUp, setShowHeadsUp] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // On mount: drain any locally-queued items first, then load the full cart.
  useEffect(() => {
    async function init() {
      try {
        const flushed = await cartOps.drainQueue();
        if (flushed.length > 0) {
          toast.success(`${flushed.length} queued item${flushed.length > 1 ? 's' : ''} synced`);
        }
        const items = await cartOps.getCart();
        setCart(items);
      } catch {
        toast.error('Could not load your cart');
      }
    }
    init();
  }, []);

  const addToCart = async (product: Product) => {
    try {
      // Step 2: persist to Supabase
      const item = await cartOps.addToCart(product);
      setCart(prev => {
        const idx = prev.findIndex(i => i.dbId === item.dbId);
        if (idx !== -1) return prev.map((i, n) => n === idx ? item : i);
        return [...prev, item];
      });
    } catch {
      // Supabase unreachable — keep item locally so it survives a page refresh
      cartOps.enqueueProduct(product);
      // Optimistic local state (no dbId yet — quantity controls will be disabled until synced)
      setCart(prev => {
        const dup = prev.find(i => i.id === product.id && i.scannedAt === product.scannedAt);
        if (dup) return prev.map(i => i === dup ? { ...i, quantity: i.quantity + 1 } : i);
        return [...prev, { ...product, quantity: 1 }];
      });
      toast.warning('Saved locally — will sync when back online');
    }
    setCurrentPage('cart');
  };

  const removeFromCart = async (dbId: string) => {
    try {
      await cartOps.removeFromCart(dbId);
      setCart(prev => prev.filter(i => i.dbId !== dbId));
    } catch {
      toast.error('Could not remove item');
    }
  };

  const updateQuantity = async (dbId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(dbId);
      return;
    }
    try {
      await cartOps.updateQuantity(dbId, quantity);
      setCart(prev => prev.map(i => i.dbId === dbId ? { ...i, quantity } : i));
    } catch {
      toast.error('Could not update quantity');
    }
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (showHeadsUp) {
    return <HeadsUpScreen onBack={() => setShowHeadsUp(false)} />;
  }

  return (
    <div className="min-h-screen w-full bg-[#EDF0F5] dark:bg-[#0F0F0F]">

      {/* Content area — height is 100vh minus bottom clearance for the fixed nav.
          box-sizing: border-box (Tailwind default) means padding-bottom shrinks the
          content box, so each child's h-full stays above the nav. */}
      <div
        className="h-screen w-full overflow-hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 7rem)' }}
      >
        {currentPage === 'home' && (
          <HomePage
            onAddToCart={addToCart}
            onStartScanning={() => setCurrentPage('camera')}
            onNavigateToHeadsUp={() => setShowHeadsUp(true)}
          />
        )}
        {currentPage === 'camera' && <CameraScanner onAddToCart={addToCart} />}
        {currentPage === 'cart' && (
          <CartPage
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
          />
        )}
        {currentPage === 'profile' && (
          <ProfilePage
            onSignOut={onSignOut}
            onNavigateToHeadsUp={() => setShowHeadsUp(true)}
          />
        )}
      </div>

      {/* Bottom Navigation — fixed to the viewport so it never scrolls away */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#1A1A1A]/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 pt-3 px-6 z-40"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)' }}
      >
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentPage('home')}
            className={`flex flex-col items-center justify-center transition-colors ${
              currentPage === 'home' ? 'text-[#651610]' : 'text-gray-400 dark:text-gray-600'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </button>

          <button
            onClick={() => setCurrentPage('camera')}
            className="flex flex-col items-center justify-center -mt-10"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 bg-[#651610]">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <span className="text-[10px] mt-2 font-medium text-gray-400">Scan</span>
          </button>

          <button
            onClick={() => setCurrentPage('cart')}
            className={`flex flex-col items-center justify-center transition-colors relative ${
              currentPage === 'cart' ? 'text-[#651610]' : 'text-gray-400 dark:text-gray-600'
            }`}
          >
            <ShoppingBag className="w-6 h-6" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#651610] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {cartItemCount}
              </span>
            )}
            <span className="text-[10px] mt-1 font-medium">Bag</span>
          </button>

          <button
            onClick={() => setCurrentPage('profile')}
            className={`flex flex-col items-center justify-center transition-colors ${
              currentPage === 'profile' ? 'text-[#651610]' : 'text-gray-400 dark:text-gray-600'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">Profile</span>
          </button>
        </div>
      </div>

    </div>
  );
}
