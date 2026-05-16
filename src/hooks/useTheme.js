import { useEffect, useState } from "react";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function applyTheme(theme) {
  if (typeof document === "undefined") return;

  const isDark = theme === "dark";
  // Toggle .dark on <html> — this drives both Tailwind dark: variants and our CSS .dark {} block
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.dataset.theme = theme;
}

function startThemeTransition(duration = 320) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.add("theme-animating");
  window.setTimeout(() => {
    root.classList.remove("theme-animating");
  }, duration);
}

export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    startThemeTransition();
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  return {
    theme,
    isLight: theme === "light",
    setTheme,
    toggleTheme,
  };
}
