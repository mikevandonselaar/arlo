import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import HomeCarousel from './HomeCarousel';

interface HomePageProps {
  onAddToCart: (product: never) => void;
  onStartScanning: () => void;
  onNavigateToHeadsUp: () => void;
}

export function HomePage({ onNavigateToHeadsUp }: HomePageProps) {
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          setCity(data.address?.city || data.address?.town || data.address?.village || null);
        } catch { /* silent */ }
      },
      () => setCity(null),
    );
  }, []);

  const availableHeight = window.innerHeight - 56 - 34;

  const handleJoin = () => {
    console.log('User joined arlo.');
  };

  return (
    <div className="h-full bg-[#EDF0F5] dark:bg-[#0F0F0F] flex flex-col">

      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-[#651610] text-2xl leading-none">arlo.</span>
          <span className="px-2 py-0.5 rounded-full bg-[#FFC8FF] text-[#651610] text-[9px] font-black tracking-widest uppercase">
            alpha
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-white dark:bg-[#1A1A1A] rounded-full pl-2.5 pr-3.5 py-1.5 shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-[#651610] flex-shrink-0" />
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-none">
            {city ?? 'Locating…'}
          </span>
        </div>
      </div>

      <HomeCarousel
        availableHeight={availableHeight}
        onJoin={handleJoin}
        onFeedback={onNavigateToHeadsUp}
      />

    </div>
  );
}
