import { useCallback, useEffect, useState } from "react";
import { readStored, writeStored } from "./storage";

type Theme = "light" | "dark";

const THEME_KEY = "kg_theme";

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(() =>
    readStored("localStorage", THEME_KEY) === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeStored("localStorage", THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(current => (current === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
