# Lumiere AI 3.2 — Design System (MASTER)

> Global Source of Truth. Page-specific overrides live in `design-system/pages/<page>.md`.
> Generated via ui-ux-pro-max — prompt: "Design a minimal AI chatbot platform with conversational UI preview, streaming text animation, feature cards with AI capabilities, integration logos. Use neutral tones with AI blue accent."

---

## 1. Brand Identity

| Token | Value |
|-------|-------|
| Brand Name | **Lumiere AI** |
| Tagline | *Transforming Raw Pedagogy into Compounding Digital Wisdom* |
| Personality | Minimal · Precise · Intelligent · Trustworthy |
| Style Category | **AI-Native UI** |
| Pattern | 3-Column Dashboard · Conversational layout |

---

## 2. Color Palette

### Primary — AI-Native (Neutral + AI Blue)

| Role | CSS Variable | Hex | Usage |
|------|-------------|-----|-------|
| AI Accent (Primary) | `--color-ai-accent` | `#6366F1` | Buttons, active states, links, streaming cursor |
| AI Accent Hover | `--color-ai-accent-hover` | `#4F46E5` | Hover on primary buttons |
| AI Accent Light | `--color-ai-accent-light` | `#E0E7FF` | User bubble background, badge background |
| Success / Complete | `--color-success` | `#10B981` | CoT step complete, upload success |
| Warning | `--color-warning` | `#F59E0B` | Processing state |
| Error | `--color-error` | `#EF4444` | Error state |

### Dark Mode (Primary — OLED Optimized)

| Role | CSS Variable | Hex | Usage |
|------|-------------|-----|-------|
| Background (deepest) | `--color-bg-base` | `#09090B` | App root background |
| Background (elevated) | `--color-bg-elevated` | `#18181B` | Panels, sidebars |
| Background (card) | `--color-bg-card` | `#27272A` | Cards, chat bubbles |
| Background (hover) | `--color-bg-hover` | `#3F3F46` | Hover states |
| Border | `--color-border` | `#3F3F46` | Panel dividers, input borders |
| Border (subtle) | `--color-border-subtle` | `#27272A` | Subtle separators |
| Text (primary) | `--color-text-primary` | `#FAFAFA` | Headings, primary text |
| Text (secondary) | `--color-text-secondary` | `#A1A1AA` | Subtext, captions |
| Text (muted) | `--color-text-muted` | `#71717A` | Placeholder, disabled |

### Light Mode (Override when needed)

| Role | Hex |
|------|-----|
| Background | `#FAFAFA` |
| Elevated | `#FFFFFF` |
| Card | `#F4F4F5` |
| Border | `#E4E4E7` |
| Text primary | `#09090B` |
| Text secondary | `#52525B` |

### AI Bubble Colors

```css
--ai-bubble-bg: var(--color-bg-card);       /* #27272A in dark */
--user-bubble-bg: var(--color-ai-accent-light); /* #E0E7FF */
--user-bubble-text: #1E1B4B;
```

---

## 3. Typography

### Font Pairing: **Fira Code + Inter**

| Role | Font | Weight | Google Fonts |
|------|------|--------|-------------|
| Heading / Mono | Fira Code | 400, 500, 600, 700 | [Link](https://fonts.google.com/specimen/Fira+Code) |
| Body / UI | Inter | 300, 400, 500, 600 | [Link](https://fonts.google.com/specimen/Inter) |

```css
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

--font-mono: 'Fira Code', monospace;   /* Logo, code blocks, CoT steps */
--font-body: 'Inter', sans-serif;       /* All UI text */
```

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-xs` | 0.75rem (12px) | 400 | 1.5 | Timestamps, captions |
| `--text-sm` | 0.875rem (14px) | 400 | 1.5 | Body, sidebar items |
| `--text-base` | 1rem (16px) | 400 | 1.625 | Chat messages |
| `--text-lg` | 1.125rem (18px) | 500 | 1.5 | Card titles |
| `--text-xl` | 1.25rem (20px) | 600 | 1.4 | Section headers |
| `--text-2xl` | 1.5rem (24px) | 700 | 1.3 | Page titles |

---

## 4. Spacing System

```css
--space-1: 0.25rem;   /* 4px  */
--space-2: 0.5rem;    /* 8px  */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px -- base gap */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
```

---

## 5. Layout — 3-Column Dashboard

```
┌──────────────┬──────────────────────────┬──────────────┐
│  Left Panel  │    Center Panel (Main)   │  Right Panel │
│   280px      │        flex-1            │    320px     │
│  collapsible │                          │  collapsible │
│              │  ┌────────────────────┐  │              │
│ • Wiki Tree  │  │   Chat Messages    │  │ • Slides     │
│ • MDXEditor  │  │   (scrollable)     │  │ • Recap      │
│ • Hist       │  ├────────────────────┤  │ • Quiz       │
│              │  │   CoT Visualizer   │  │              │
│              │  ├────────────────────┤  │              │
│              │  │   Chat Input       │  │              │
│              │  └────────────────────┘  │              │
└──────────────┴──────────────────────────┴──────────────┘
```

```css
--layout-left-width: 280px;
--layout-right-width: 320px;
--layout-header-height: 56px;
--layout-input-height: 80px;
```

**Responsive breakpoints:**
- `< 768px`: Single column; Left/Right panels become bottom sheets
- `768px – 1024px`: Left panel collapsible (icon-only mode); Right hidden
- `> 1024px`: Full 3-column layout

---

## 6. Component Tokens

### Input / Chat Input

```css
--input-height: 48px;
--input-bg: var(--color-bg-elevated);
--input-border: 1px solid var(--color-border);
--input-border-radius: 0.75rem;
--input-padding: 0 1rem;
--input-focus-ring: 0 0 0 2px var(--color-ai-accent);
```

### Chat Bubbles

```css
--bubble-radius-user: 1rem 1rem 0.25rem 1rem;    /* User: squared bottom-right */
--bubble-radius-ai:   1rem 1rem 1rem 0.25rem;    /* AI: squared bottom-left */
--bubble-max-width: 75%;
--message-gap: 1rem;
--typing-dot-size: 8px;
```

### CoT Visualizer

```css
--cot-step-height: 40px;
--cot-line-color: var(--color-border);
--cot-active-color: var(--color-ai-accent);
--cot-done-color: var(--color-success);
--cot-pulse-duration: 1.5s;
```

### Cards (Output Panel)

```css
--card-bg: var(--color-bg-elevated);
--card-border: 1px solid var(--color-border);
--card-radius: 0.75rem;
--card-padding: 1rem;
--card-hover-shadow: 0 4px 24px rgba(99, 102, 241, 0.15);
```

---

## 7. Animation & Effects

### Streaming Text Animation
```css
@keyframes streaming-cursor {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
.streaming-cursor::after {
  content: '▋';
  color: var(--color-ai-accent);
  animation: streaming-cursor 0.8s ease-in-out infinite;
}
```

### Typing Indicator (3-dot pulse)
```css
@keyframes typing-dot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%           { transform: scale(1);   opacity: 1; }
}
.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
```

### CoT Step Pulse (active state)
```css
@keyframes cot-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50%      { box-shadow: 0 0 0 6px rgba(99, 102, 241, 0); }
}
```

### Transitions
```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Tailwind CSS v4 Configuration

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-ai-accent: #6366F1;
  --color-ai-accent-hover: #4F46E5;
  --color-ai-accent-light: #E0E7FF;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;

  --color-bg-base: #09090B;
  --color-bg-elevated: #18181B;
  --color-bg-card: #27272A;
  --color-bg-hover: #3F3F46;
  --color-border: #3F3F46;
  --color-border-subtle: #27272A;

  --color-text-primary: #FAFAFA;
  --color-text-secondary: #A1A1AA;
  --color-text-muted: #71717A;

  --font-body: 'Inter', sans-serif;
  --font-mono: 'Fira Code', monospace;

  --radius-sm: 0.375rem;
  --radius-base: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
}
```

---

## 9. Icon System

**Library**: Lucide React — consistent 24×24 viewBox, `stroke-width: 1.5`

```jsx
import { MessageSquare, BookOpen, FileText, Download, ChevronRight, Loader2, Check } from 'lucide-react';
// Sizing: w-4 h-4 (sm), w-5 h-5 (base), w-6 h-6 (lg)
```

**NO emojis** as UI icons. Use Lucide SVGs exclusively.

---

## 10. Feature Card Template (AI Capabilities)

```
┌─────────────────────────────┐
│  [Icon 24px - AI accent]    │
│  Title — Inter 600 18px     │
│  Description — Inter 400    │
│  14px text-secondary        │
│                             │
│  [Tag] [Tag]                │
└─────────────────────────────┘
Border: 1px solid --color-border
Hover: box-shadow --card-hover-shadow + border ai-accent
Transition: 200ms ease
```

---

## 11. Anti-Patterns to Avoid

| ❌ Don't | ✅ Do |
|---------|-------|
| Emoji icons (🚀 📚 🎓) | Lucide SVG icons |
| `bg-white` on dark UI | `bg-[var(--color-bg-elevated)]` |
| Instant state transitions | `transition-all duration-200` |
| Multiple overlapping fixed elements | Planned z-index stack |
| `z-index: 9999` | Structured z-index scale |
| Render 1000s of messages | Virtualize chat list |
| Polling for CoT status | SSE streaming |

---

## 12. Z-Index Stack

```css
--z-base: 0;
--z-dropdown: 10;
--z-sidebar: 20;
--z-header: 30;
--z-modal-backdrop: 40;
--z-modal: 50;
--z-toast: 60;
```

---

## 13. Pre-Delivery Checklist

- [ ] No emojis as icons (Lucide SVG only)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150–300ms)
- [ ] Text contrast minimum 4.5:1 (WCAG AA)
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] SSE streaming, not polling
- [ ] CoT steps animated, not static
