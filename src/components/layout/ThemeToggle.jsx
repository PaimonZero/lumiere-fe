import { Sun, Moon } from "lucide-react";
import useTheme from "../../hooks/useTheme.js";

export default function ThemeToggle() {
  const { isLight, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 w-full text-sm font-medium"
      style={{
        color: "var(--color-text-secondary)",
        background: "var(--color-bg-card)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--color-ai-accent)";
        e.currentTarget.style.background = "var(--color-bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--color-text-secondary)";
        e.currentTarget.style.background = "var(--color-bg-card)";
      }}
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
      {isLight ? "Dark Mode" : "Light Mode"}
    </button>
  );
}
