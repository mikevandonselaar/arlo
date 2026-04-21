import { Minus, Plus, Trash2, ShoppingBag, MapPin, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import { CartItem } from './MainApp';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'motion/react';

interface CartPageProps {
  cart: CartItem[];
  onUpdateQuantity: (dbId: string, quantity: number) => void;
  onRemoveItem: (dbId: string) => void;
}

export function CartPage({ cart, onUpdateQuantity, onRemoveItem }: CartPageProps) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);  

  // Group items by brand
  const groupedItems = cart.reduce((acc, item) => {
    if (!acc[item.brand]) {
      acc[item.brand] = [];
    }
    acc[item.brand].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  if (cart.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-white">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6"
        >
          <ShoppingBag className="w-10 h-10 text-gray-200" />
        </motion.div>
        <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Your Bag is Empty</h2>
        <p className="text-gray-400 text-center mb-8 max-w-[240px]">
          Scan barcodes in-store to add exclusive items to your collection.
        </p>
        <Button className="bg-[#51EAA7] text-black px-8 rounded-full font-bold h-12 shadow-lg shadow-[#51EAA7]/20">
          Start Exploring
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 pt-2 pb-4 border-b border-gray-50 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Your Bag</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-bold bg-[#51EAA7] text-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
            {cart.length} unique items
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">London In-Store Scans</span>
        </div>
      </div>

      {/* Grouped Cart Items */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-10 pb-12">
        {Object.entries(groupedItems).map(([brand, items], groupIndex) => (
          <div key={brand} className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
               <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{brand}</h2>
               <span className="text-[10px] font-bold text-[#aab2ff]">{items.length} {items.length === 1 ? 'Item' : 'Items'}</span>
            </div>
            
            <div className="space-y-6">
              {items.map((item, index) => (
                <motion.div 
                  key={`${item.id}-${item.scannedAt}`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                  className="flex flex-col"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-24 bg-[#F5F5F7] rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col py-1">
                      <div className="flex justify-between items-start">
                        <div className="pr-4">
                          <h3 className="font-black text-gray-900 text-sm leading-tight mt-0.5 line-clamp-1">{item.name}</h3>
                          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-tighter">
                            {[item.size && `Size: ${item.size}`, item.color].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <button
                          onClick={() => item.dbId && onRemoveItem(item.dbId)}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-base font-black text-gray-900">£{item.price.toFixed(2)}</span>
                        <div className="flex items-center bg-gray-100 rounded-full px-1">
                          <button
                            onClick={() => item.dbId && onUpdateQuantity(item.dbId, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-black"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                          <button
                            onClick={() => item.dbId && onUpdateQuantity(item.dbId, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-black"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3 p-2.5 bg-[#F5F5F7] rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-[#51EAA7]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-0.5">Scanned at</p>
                      <p className="text-[10px] font-bold text-gray-700 truncate">{item.scannedAt}</p>
                    </div>
                    <div className="px-2 py-1 bg-white rounded-md border border-gray-100">
                       <p className="text-[8px] font-black text-[#51EAA7] uppercase tracking-tighter">VERIFIED</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Checkout Summary */}
      <div className="px-8 bg-white rounded-t-[40px] shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
        <div className="space-y-3 mb-6">           
          <div className="flex justify-between items-center pt-3 mt-3">
            <span className="text-lg font-black text-gray-900">Total</span>
            <span className="text-2xl font-black text-gray-900">£{subtotal.toFixed(2)}</span>
          </div>
        </div>        
      </div>
    </div>
  );
}
