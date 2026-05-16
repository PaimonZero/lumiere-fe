import { Moon, Sun } from "lucide-react";
import useTheme from "../../hooks/useTheme.js";

export default function ThemeModeToggle({ compact = false, className = "" }) {
  const { isLight, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-mode-toggle ${compact ? "theme-mode-toggle--compact" : ""} ${className}`.trim()}
      aria-label={isLight ? "Chuyển sang dark mode" : "Chuyển sang light mode"}
      title={isLight ? "Dark mode" : "Light mode"}
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
      {!compact && <span>{isLight ? "Dark Mode" : "Light Mode"}</span>}
    </button>
  );
}
