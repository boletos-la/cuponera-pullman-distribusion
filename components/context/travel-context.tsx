"use client";

import { createContext, useContext, useState } from "react";

interface TravelContextType {
  origin: string | null;
  destination: string | null;
  setOrigin: (city: string | null) => void;
  setDestination: (city: string | null) => void;
}

const TravelContext = createContext<TravelContextType | null>(null);

export function TravelProvider({ children }: { children: React.ReactNode }) {
  const [origin, setOrigin] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);

  return (
    <TravelContext.Provider
      value={{ origin, destination, setOrigin, setDestination }}
    >
      {children}
    </TravelContext.Provider>
  );
}

export function useTravel() {
  const ctx = useContext(TravelContext);
  if (!ctx) throw new Error("useTravel must be used inside <TravelProvider />");
  return ctx;
}
