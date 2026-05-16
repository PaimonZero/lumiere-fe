/**
 * Lumiere AI — Quick Tour Component (Enhanced)
 * Spotlight overlay that dims everything EXCEPT the target element.
 * Card positions itself near the highlighted area.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  BookOpen,
  MessageSquare,
  Terminal,
  Layout,
} from "lucide-react";

const PAD = 8; // padding around spotlight hole
const CARD_GAP = 16; // gap between spotlight and card
const CARD_W = 340; // card width px
const CARD_H_EST = 220; // estimated card height for positioning

const STEPS = [
  {
    title: "Chào mừng tới Lumiere AI",
    content:
      "Khám phá nền tảng hỗ trợ giáo dục thông minh — biến kiến thức thành bài giảng và câu hỏi chỉ trong vài giây.",
    icon: Sparkles,
    target: "[data-tour='header']",
  },
  {
    title: "Kho tri thức & Hội thoại",
    content:
      "Quản lý tài liệu Wiki và xem lịch sử hội thoại tại đây. AI sẽ học từ tài liệu để phản hồi chính xác.",
    icon: BookOpen,
    target: "[data-tour='left-panel']",
  },
  {
    title: "Chat với AI",
    content:
      "Chat để soạn bài, tóm tắt hoặc thảo luận. Quá trình tư duy (CoT) được hiển thị trực quan.",
    icon: MessageSquare,
    target: "[data-tour='chat']",
  },
  {
    title: "Nhập liệu & Upload",
    content:
      "Gõ câu hỏi hoặc kéo thả tài liệu tại đây. AI sẽ phân tích và phản hồi ngay.",
    icon: Terminal,
    target: "[data-tour='settings']",
  },
  {
    title: "Kết quả AI",
    content:
      "Quiz, Slide, hay Bản tóm tắt sẽ xuất hiện tại đây, sẵn sàng để bạn xuất bản.",
    icon: Layout,
    target: "[data-tour='right-panel']",
  },
];

function getTargetEl(step) {
  if (!step.target) return null;
  return document.querySelector(step.target);
}

/**
 * Compute where to place the card relative to the spotlight rect.
 * Returns { top, left } in px (fixed positioning).
 */
function computeCardPos(rect, vw, vh) {
  if (!rect) {
    // No target → center screen
    return { top: (vh - CARD_H_EST) / 2, left: (vw - CARD_W) / 2 };
  }

  const spotRight = rect.left + rect.width + PAD;
  const spotBottom = rect.top + rect.height + PAD;
  const spotCenterX = rect.left + rect.width / 2;

  // 1. Try BELOW the spotlight
  if (spotBottom + CARD_GAP + CARD_H_EST < vh) {
    let left = spotCenterX - CARD_W / 2;
    left = Math.max(12, Math.min(left, vw - CARD_W - 12));
    return { top: spotBottom + CARD_GAP, left };
  }

  // 2. Try ABOVE
  if (rect.top - PAD - CARD_GAP - CARD_H_EST > 0) {
    let left = spotCenterX - CARD_W / 2;
    left = Math.max(12, Math.min(left, vw - CARD_W - 12));
    return { top: rect.top - PAD - CARD_GAP - CARD_H_EST, left };
  }

  // 3. Try RIGHT
  if (spotRight + CARD_GAP + CARD_W < vw) {
    let top = rect.top;
    top = Math.max(12, Math.min(top, vh - CARD_H_EST - 12));
    return { top, left: spotRight + CARD_GAP };
  }

  // 4. Try LEFT
  if (rect.left - PAD - CARD_GAP - CARD_W > 0) {
    let top = rect.top;
    top = Math.max(12, Math.min(top, vh - CARD_H_EST - 12));
    return { top, left: rect.left - PAD - CARD_GAP - CARD_W };
  }

  // fallback: center
  return { top: (vh - CARD_H_EST) / 2, left: (vw - CARD_W) / 2 };
}

export default function QuickTour() {
  const [isOpen, setIsOpen] = useState(() => !localStorage.getItem("lumiere_tour_completed"));
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null); // target element's bounding rect
  const [pos, setPos] = useState(null); // card { top, left }
  const rafRef = useRef(null);

  // ── open / close ──────────────────────────────────
  useEffect(() => {
    const open = () => {
      setStep(0);
      setIsOpen(true);
    };
    window.addEventListener("start-lumiere-tour", open);
    return () => window.removeEventListener("start-lumiere-tour", open);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem("lumiere_tour_completed", "true");
  }, []);

  // ── track target rect continuously ────────────────
  useEffect(() => {
    if (!isOpen) return;

    const measure = () => {
      const el = getTargetEl(STEPS[step]);
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        setPos(
          computeCardPos(
            { top: r.top, left: r.left, width: r.width, height: r.height },
            vw,
            vh,
          ),
        );
      } else {
        setRect(null);
        setPos(computeCardPos(null, vw, vh));
      }
      rafRef.current = requestAnimationFrame(measure);
    };

    // small initial delay so DOM settles after step change
    const t = setTimeout(() => {
      rafRef.current = requestAnimationFrame(measure);
    }, 60);

    return () => {
      clearTimeout(t);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isOpen, step]);

  if (!isOpen || !pos) return null;

  const Icon = STEPS[step].icon;
  // Spotlight hole dimensions (with padding)
  const hole = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        w: rect.width + PAD * 2,
        h: rect.height + PAD * 2,
      }
    : null;

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: 99999 }}>
      {/* ── SVG overlay: dims everything except the hole ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "auto" }}
        onClick={close}
      >
        <defs>
          <mask id="tour-mask">
            {/* White = visible (dimmed area) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black = transparent hole */}
            {hole && (
              <rect
                x={hole.left}
                y={hole.top}
                width={hole.w}
                height={hole.h}
                rx="12"
                ry="12"
                fill="black"
                style={{ transition: "all 0.45s cubic-bezier(.4,0,.2,1)" }}
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* ── Spotlight border glow ── */}
      {hole && (
        <div
          className="absolute rounded-xl pointer-events-none"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.w,
            height: hole.h,
            border: "2px solid rgba(99, 102, 241, 0.5)",
            transition: "all 0.45s cubic-bezier(.4,0,.2,1)",
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.15)",
          }}
        />
      )}

      {/* ── Tour card ── */}
      <div
        className="absolute pointer-events-auto rounded-xl border overflow-hidden"
        style={{
          width: CARD_W,
          top: pos.top,
          left: pos.left,
          transition:
            "top 0.45s cubic-bezier(.4,0,.2,1), left 0.45s cubic-bezier(.4,0,.2,1)",
          background: "rgba(15, 23, 42, 0.97)",
          borderColor: "rgba(99, 102, 241, 0.25)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-[60px] pointer-events-none"
          style={{ background: "rgba(99,102,241,0.08)" }}
        />

        <div className="relative p-5">
          {/* Progress bar + step counter */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full"
                  style={{
                    width: i === step ? 16 : 6,
                    background:
                      i <= step
                        ? "var(--color-ai-accent)"
                        : "rgba(255,255,255,0.08)",
                    transition: "width 0.3s, background 0.3s",
                  }}
                />
              ))}
            </div>
            <span
              className="text-[10px] font-mono tracking-wider"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {step + 1}/{STEPS.length}
            </span>
          </div>

          {/* Icon + text */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="p-2 rounded-lg shrink-0"
              style={{
                background: "rgba(99,102,241,0.12)",
                color: "var(--color-ai-accent)",
              }}
            >
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-white mb-1 leading-snug">
                {STEPS[step].title}
              </h3>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {STEPS[step].content}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={close}
              className="text-[11px] font-medium cursor-pointer py-1 px-1 rounded transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Bỏ qua
            </button>
            <div className="flex items-center gap-1.5">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border cursor-pointer transition-colors"
                  style={{
                    borderColor: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.6)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.08)")
                  }
                >
                  <ChevronLeft size={14} />
                </button>
              )}
              <button
                onClick={() =>
                  step < STEPS.length - 1 ? setStep((s) => s + 1) : close()
                }
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold text-[13px] cursor-pointer transition-all"
                style={{ background: "var(--color-ai-accent)", color: "white" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.filter = "brightness(1.15)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.filter = "brightness(1)")
                }
              >
                {step === STEPS.length - 1 ? "Đã hiểu" : "Tiếp tục"}
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Close X */}
        <button
          onClick={close}
          className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          <X size={12} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
