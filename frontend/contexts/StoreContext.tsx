'use client';

import { createContext, useContext } from 'react';

export interface StoreContextType {
  store: any;
  loading: boolean;
  refreshStore: () => Promise<void>;
}

export const StoreContext = createContext<StoreContextType>({
  store: null,
  loading: true,
  refreshStore: async () => {},
});

export const useStore = () => useContext(StoreContext);
