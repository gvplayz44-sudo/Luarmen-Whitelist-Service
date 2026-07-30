import React, { createContext, useContext, useState } from 'react';

type Theme = 'dark';
const ThemeContext = createContext<{ theme: Theme }>({ theme: 'dark' });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<Theme>('dark');
  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}