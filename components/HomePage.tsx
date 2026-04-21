import { useState, useRef } from 'react';
import { MapPin, Star, Store, ArrowRight, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Product } from './MainApp';

interface HomePageProps {
  onAddToCart: (product: Product) => void;
}

interface Campaign {
  id: string;
  brand: string;
  title: string;
  subtitle: string;
  image: string;
  location: string;
  storeCount: number;
  exclusive: boolean;
  color: string;
  badge?: string;
}

const campaigns: Campaign[] = [
  {
    id: '1',
    brand: 'NN07',
    title: 'No Nationality',
    subtitle: 'The Copenhagen Edit. Minimalist essentials for the modern traveler.',
    image: 'https://images.unsplash.com/photo-1580837303653-5112afbac20d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2FuZGluYXZpYW4lMjBtZW5zd2VhciUyMG1pbmltYWxpc3QlMjBmYXNoaW9ufGVufDF8fHx8MTc2OTcxNzE4OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    location: 'Soho, London',
    storeCount: 2,
    exclusive: true,
    color: '#51EAA7',
    badge: 'NEW IN'
  },
  {
    id: '2',
    brand: 'NUDE PROJECT',
    title: 'By Friends, For Friends',
    subtitle: 'Barcelona streetwear arrives in London. In-store exclusive drops.',
    image: 'https://images.unsplash.com/photo-1763034281294-27b792125e71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlZXR3ZWFyJTIwYWVzdGhldGljJTIwZmFzaGlvbiUyMHlvdW5nJTIwYWR1bHRzfGVufDF8fHx8MTc2OTcxNzE4OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    location: 'Shoreditch, London',
    storeCount: 1,
    exclusive: true,
    color: '#eca0ff',
    badge: 'EXCLUSIVE'
  },
  {
    id: '3',
    brand: 'ADIDAS',
    title: 'Originals Archive',
    subtitle: 'Classic silhouettes re-imagined. Scannable at Oxford St.',
    image: 'https://images.unsplash.com/photo-1724934732583-22704a86c00d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZGlkYXMlMjBzbmVha2VycyUyMGxpZmVzdHlsZSUyMGZhc2hpb258ZW58MXx8fHwxNzY5NzE3MTg1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    location: 'Oxford St, London',
    storeCount: 12,
    exclusive: false,
    color: '#aab2ff',
    badge: 'RESTOCK'
  },
  {
    id: '4',
    brand: 'COS',
    title: 'Spring Tailoring',
    subtitle: 'Functional design for everyday life. Shop the new collection.',
    image: 'https://images.unsplash.com/photo-1759229874709-a8d0de083b91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3MlMjBtaW5pbWFsaXN0JTIwZmFzaGlvbiUyMHdvbWVuc3dlYXJ8ZW58MXx8fHwxNzY5NzE3MTg1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    location: 'Regent St, London',
    storeCount: 4,
    exclusive: true,
    color: '#51EAA7',
    badge: 'COLLECTION'
  },
  {
    id: '5',
    brand: 'KODA INSIDER',
    title: 'The Store Tour',
    subtitle: 'Discover hidden gems across London. Unlock VIP pricing.',
    image: 'https://images.unsplash.com/photo-1765009433753-c7462637d21f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBmYXNoaW9uJTIwc3RvcmUlMjBpbnRlcmlvciUyMGx1eHVyeXxlbnwxfHx8fDE3Njk3MTcxODV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    location: 'London Wide',
    storeCount: 25,
    exclusive: true,
    color: '#eca0ff',
    badge: 'INSIDER'
  }
];

export function HomePage({ onAddToCart }: HomePageProps) {
  const [currentCampaign, setCurrentCampaign] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const width = scrollContainerRef.current.clientWidth;
      const newIndex = Math.round(scrollLeft / width);
      setCurrentCampaign(newIndex);
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shopping in</span>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#51EAA7]" />
            <span className="text-sm font-bold">Amsterdam, UK</span>
          </div>
        </div>
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <Zap className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Hero Swiper */}
      <div className="relative flex-1">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory h-full no-scrollbar"
          style={{ scrollbarWidth: 'none' }}
        >
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="min-w-full snap-start relative h-full px-4 pb-4">
              <div className="relative h-full rounded-[40px] overflow-hidden shadow-xl">
                <img
                  src={campaign.image}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                
                {/* Badge */}
                <div className="absolute top-6 right-6">
                  <div 
                    className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-tighter text-white"
                    style={{ backgroundColor: campaign.color }}
                  >
                    {campaign.badge}
                  </div>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <span className="text-[10px] font-black tracking-widest uppercase opacity-70">
                    {campaign.brand}
                  </span>
                  <h2 className="text-4xl font-black leading-none mb-4 mt-1">
                    {campaign.title}
                  </h2>
                  <p className="text-sm opacity-80 mb-6 font-medium">
                    {campaign.subtitle}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Store className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold">{campaign.storeCount} Nearby</span>
                    </div>
                    
                    <Button 
                      className="bg-white text-black hover:bg-white/90 rounded-full px-6 font-bold flex gap-2 items-center"
                    >
                      Locate <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Page Indicators */}
        <div className="absolute bottom-10 left-12 flex gap-1.5 pointer-events-none">
          {campaigns.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentCampaign
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
