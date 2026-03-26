'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Currency = 'MGA' | 'EUR' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  convert: (amountMGA: number | null | undefined) => string;
  convertRaw: (amountMGA: number | null | undefined) => number;
  symbol: string;
  rates: Record<Currency, number>;
}

// Approximate rates (MGA base). Updated periodically.
// 1 EUR ≈ 5,000 MGA, 1 USD ≈ 4,600 MGA (approximate rates for Madagascar)
const DEFAULT_RATES: Record<Currency, number> = {
  MGA: 1,
  EUR: 0.0002,   // 1 MGA = 0.0002 EUR → 5,000 MGA = 1 EUR
  USD: 0.000217, // 1 MGA = 0.000217 USD → 4,600 MGA = 1 USD
};

const SYMBOLS: Record<Currency, string> = {
  MGA: 'Ar',
  EUR: '€',
  USD: '$',
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'MGA',
  setCurrency: () => {},
  convert: () => '',
  convertRaw: () => 0,
  symbol: 'Ar',
  rates: DEFAULT_RATES,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('MGA');
  const [rates, setRates] = useState<Record<Currency, number>>(DEFAULT_RATES);

  useEffect(() => {
    const saved = localStorage.getItem('mada-spot-currency') as Currency | null;
    if (saved === 'EUR' || saved === 'USD' || saved === 'MGA') {
      setCurrencyState(saved);
    }
  }, []);

  // Try to fetch live rates once (free API)
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/MGA');
        if (res.ok) {
          const data = await res.json();
          if (data.rates) {
            setRates({
              MGA: 1,
              EUR: data.rates.EUR || DEFAULT_RATES.EUR,
              USD: data.rates.USD || DEFAULT_RATES.USD,
            });
          }
        }
      } catch {
        // Silently use default rates
      }
    };
    fetchRates();
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('mada-spot-currency', c);
  };

  const convertRaw = useCallback((amountMGA: number | null | undefined): number => {
    if (!amountMGA && amountMGA !== 0) return 0;
    return amountMGA * rates[currency];
  }, [currency, rates]);

  const convert = useCallback((amountMGA: number | null | undefined): string => {
    if (!amountMGA && amountMGA !== 0) return '-';
    if (amountMGA === 0) return `0 ${SYMBOLS[currency]}`;

    const converted = amountMGA * rates[currency];
    const sym = SYMBOLS[currency];

    if (currency === 'MGA') {
      return `${converted.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ${sym}`;
    }
    // EUR/USD : show 2 decimals for amounts < 100, 0 for bigger
    const decimals = converted < 100 ? 2 : 0;
    return `${converted.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${sym}`;
  }, [currency, rates]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, convertRaw, symbol: SYMBOLS[currency], rates }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
