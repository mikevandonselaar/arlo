import { createContext, useContext, useState } from 'react';

export type Currency = 'GBP' | 'EUR' | 'USD';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: '£',
  EUR: '€',
  USD: '$',
};

const STORAGE_KEY = 'arlo-currency';

interface CurrencyContextValue {
  currency: Currency;
  symbol: string;
  setCurrency: (c: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'GBP',
  symbol: '£',
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as Currency | null) ?? 'GBP'; // default GBP for London alpha
  });

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  };

  return (
    <CurrencyContext.Provider value={{ currency, symbol: CURRENCY_SYMBOLS[currency], setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
