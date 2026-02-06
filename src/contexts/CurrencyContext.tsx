'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface DefaultCurrency {
  id: number;
  name: string;
  symbol: string;
}

interface CurrencyContextType {
  defaultCurrency: DefaultCurrency | null;
  setDefaultCurrency: (currency: DefaultCurrency | null) => void;
  clearDefaultCurrency: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [defaultCurrency, setDefaultCurrencyState] = useState<DefaultCurrency | null>(null);

  useEffect(() => {
    // Load default currency from localStorage on mount
    const storedDefault = localStorage.getItem('default_currency');
    if (storedDefault) {
      try {
        setDefaultCurrencyState(JSON.parse(storedDefault));
      } catch (error) {
        console.error('Error parsing default currency from localStorage:', error);
      }
    }

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'default_currency') {
        if (e.newValue) {
          try {
            setDefaultCurrencyState(JSON.parse(e.newValue));
          } catch (error) {
            console.error('Error parsing updated default currency:', error);
          }
        } else {
          setDefaultCurrencyState(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setDefaultCurrency = (currency: DefaultCurrency | null) => {
    setDefaultCurrencyState(currency);
    if (currency) {
      localStorage.setItem('default_currency', JSON.stringify(currency));
    } else {
      localStorage.removeItem('default_currency');
    }
  };

  const clearDefaultCurrency = () => {
    setDefaultCurrencyState(null);
    localStorage.removeItem('default_currency');
  };

  const value: CurrencyContextType = {
    defaultCurrency,
    setDefaultCurrency,
    clearDefaultCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);

  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }

  return context;
}