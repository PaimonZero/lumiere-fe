import { useCallback, useEffect, useState } from "react";

const THEME_STORAGE_KEY = "theme";
const VALID_THEMES = new Set(["light", "dark"]);
const listeners = new Set();
let currentTheme;

function getInitialTheme() {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (VALID_THEMES.has(stored)) return stored;

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function getCurrentTheme() {
  if (!VALID_THEMES.has(currentTheme)) {
    currentTheme = getInitialTheme();
  }
  return currentTheme;
}

function applyTheme(theme) {
  if (typeof document === "undefined") return;

  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.colorMode = theme;
}

function startThemeTransition(duration = 320) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.add("theme-animating");
  window.setTimeout(() => {
    root.classList.remove("theme-animating");
  }, duration);
}

function setGlobalTheme(nextTheme, { animate = false } = {}) {
  const previousTheme = getCurrentTheme();
  const resolvedTheme =
    typeof nextTheme === "function" ? nextTheme(previousTheme) : nextTheme;

  if (!VALID_THEMES.has(resolvedTheme)) return previousTheme;

  if (animate && resolvedTheme !== previousTheme) {
    startThemeTransition();
  }

  currentTheme = resolvedTheme;
  applyTheme(resolvedTheme);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
  }

  listeners.forEach((listener) => listener(resolvedTheme));
  return resolvedTheme;
}

export default function useTheme() {
  const [theme, setThemeState] = useState(getCurrentTheme);

  useEffect(() => {
    const syncTheme = (nextTheme) => setThemeState(nextTheme);
    listeners.add(syncTheme);
    setGlobalTheme(getCurrentTheme());

    const handleStorage = (event) => {
      if (event.key === THEME_STORAGE_KEY && VALID_THEMES.has(event.newValue)) {
        setGlobalTheme(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      listeners.delete(syncTheme);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setTheme = useCallback((nextTheme) => {
    setGlobalTheme(nextTheme, { animate: true });
  }, []);

  const toggleTheme = useCallback(() => {
    setGlobalTheme((current) => (current === "light" ? "dark" : "light"), {
      animate: true,
    });
  }, []);

  return {
    theme,
    isLight: theme === "light",
    setTheme,
    toggleTheme,
  };
}
