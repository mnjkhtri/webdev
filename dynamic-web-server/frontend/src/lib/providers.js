"use client";

import { createContext, useContext, useState } from "react";

const AppContext = createContext({});

export function AppProvider({ children }) {
  const [state, setState] = useState(null);

  return (
    <AppContext.Provider value={{ state, setState }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}