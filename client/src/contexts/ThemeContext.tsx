import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  switchable = true,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("fittrack-theme") : null;
    if (stored === "dark" || stored === "light") {
      return stored as Theme;
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("fittrack-theme", theme);
  }, [theme, switchable]);

  // Ensure app switches to dark mode by default on sign-in
  useEffect(() => {
    const handleSignIn = () => {
      setTheme("dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("fittrack-theme", "dark");
    };

    window.addEventListener("fittrack:signin", handleSignIn);
    window.addEventListener("storage", handleSignIn);

    return () => {
      window.removeEventListener("fittrack:signin", handleSignIn);
      window.removeEventListener("storage", handleSignIn);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
