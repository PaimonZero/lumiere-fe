import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  BookOpen,
  Brain,
  Search,
  Bot,
  Presentation,
  ClipboardList,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { selectIsAuthenticated } from "../../store/authSlice.js";

function useScrollReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!nodes.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.15 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

function AnimatedCounter({ to, suffix = "" }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame;
    let current = 0;
    const duration = 900;
    const step = Math.max(1, Math.ceil(to / (duration / 16)));

    const tick = () => {
      current = Math.min(to, current + step);
      setValue(current);
      if (current < to) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [to]);

  return (
    <span className="counter-animate">
      {value}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useScrollReveal();

  const primaryCta = isAuthenticated ? "/dashboard" : "/login";
  const primaryText = isAuthenticated ? "Vào Dashboard" : "Bắt đầu miễn phí";

  const features = useMemo(
    () => [
      {
        icon: BookOpen,
        title: "Trích xuất tài liệu",
        desc: "Upload PDF, Word, Excel, PPT để AI bóc tách nội dung nhanh.",
      },
      {
        icon: Brain,
        title: "Wiki tự động",
        desc: "Sinh cây kiến thức và đề xuất cấu trúc bài giảng theo chủ đề.",
      },
      {
        icon: Search,
        title: "Hybrid Search",
        desc: "Kết hợp semantic và keyword search để truy xuất chính xác hơn.",
      },
      {
        icon: Bot,
        title: "Multi-Agent",
        desc: "Các agent phối hợp phân tích, tóm tắt và đề xuất hoạt động học tập.",
      },
      {
        icon: Presentation,
        title: "Slide & Recap",
        desc: "Tạo slide dạy học và recap chỉ với vài câu lệnh đơn giản.",
      },
      {
        icon: ClipboardList,
        title: "Ngân hàng Quiz",
        desc: "Sinh bộ câu hỏi trắc nghiệm theo cấp độ và mục tiêu đánh giá.",
      },
    ],
    [],
  );

  const steps = [
    {
      number: "01",
      title: "Tải lên học liệu",
      description:
        "Tải lên tài liệu giảng dạy ở bất kỳ định dạng nào: PDF, Word, Powerpoint hoặc hình ảnh.",
    },
    {
      number: "02",
      title: "AI Phân tích & Tạo Wiki",
      description:
        "AI xử lý nội dung, trích xuất các khái niệm chính và xây dựng thư viện tri thức tự động.",
    },
    {
      number: "03",
      title: "Giáo viên tinh chỉnh",
      description:
        "Bạn giữ quyền kiểm soát tối đa. Tinh chỉnh nội dung, thêm ghi chú cá nhân để phù hợp với lớp học.",
    },
    {
      number: "04",
      title: "Xuất Slide, Quiz & Tóm tắt",
      description:
        "Chỉ với 1 cú nhấp chuột, hệ thống tạo ra bộ học liệu đa dạng sẵn sàng để sử dụng ngay.",
    },
  ];

  return (
    <div className="landing-page-shell landing-page-static-light h-screen overflow-y-auto text-[var(--color-text-primary)]">
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-lg"
        style={{
          borderColor: "var(--landing-border)",
          background: "var(--landing-nav-bg)",
        }}
      >
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-wide"
          >
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-md"
              style={{ background: "var(--color-ai-accent)" }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
              </svg>
            </span>
            Lumiere AI
          </Link>

          <div className="hidden items-center gap-4 text-sm md:flex">
            <a
              href="#features"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              Tính năng
            </a>
            <a
              href="#how-it-works"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              Cách hoạt động
            </a>
            <a
              href="#testimonials"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              Đánh giá
            </a>
            <Link
              to={primaryCta}
              className="glow-button rounded-full bg-[var(--color-ai-accent)] px-4 py-2 font-semibold text-white"
            >
              {primaryText}
            </Link>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            className="rounded-md border p-2 md:hidden"
            style={{
              borderColor: "var(--landing-border)",
              color: "var(--color-text-primary)",
              background: "var(--landing-surface)",
            }}
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>

        {mobileNavOpen && (
          <div
            className="border-t px-4 py-3 md:hidden"
            style={{
              borderColor: "var(--landing-border)",
              background: "var(--landing-nav-bg)",
            }}
          >
            <div className="flex flex-col gap-3 text-sm">
              <a href="#features" onClick={() => setMobileNavOpen(false)}>
                Tính năng
              </a>
              <a href="#how-it-works" onClick={() => setMobileNavOpen(false)}>
                Cách hoạt động
              </a>
              <a href="#testimonials" onClick={() => setMobileNavOpen(false)}>
                Đánh giá
              </a>
              <Link
                to={primaryCta}
                onClick={() => setMobileNavOpen(false)}
                className="rounded-full bg-[var(--color-ai-accent)] px-4 py-2 text-center font-semibold text-white"
              >
                {primaryText}
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="landing-gradient relative overflow-hidden px-4 py-24 md:px-6">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-widest text-white/90">
                Playful & Friendly Teaching AI
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                Tạo bài giảng nhanh hơn, sinh động hơn, và cá nhân hóa cho từng
                lớp học.
              </h1>
              <p className="max-w-xl text-base text-white/85 md:text-lg">
                Lumiere AI giúp giáo viên biến tài liệu thô thành bài học hoàn
                chỉnh: từ Wiki kiến thức, slide, recap cho tới ngân hàng quiz.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={primaryCta}
                  className="glow-button inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                >
                  {primaryText}
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center rounded-full border border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Xem cách hoạt động
                </a>
              </div>
            </div>

            <div className="float-animation glass-card rounded-3xl p-5 text-sm text-white/90">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-white/70">
                Live Preview
              </p>
              <div className="space-y-3">
                <div
                  className="rounded-xl p-3"
                  style={{ background: "var(--landing-live-bubble-strong)" }}
                >
                  Upload tài liệu Hóa học lớp 10 và tạo đề cương 45 phút.
                </div>
                <div
                  className="rounded-xl p-3"
                  style={{ background: "var(--landing-live-bubble-soft)" }}
                >
                  Đang phân tích nội dung, xây cây kiến thức, tạo 12 câu quiz
                  theo 3 mức độ...
                </div>
                <div
                  className="rounded-xl p-3"
                  style={{ background: "var(--landing-live-bubble-strong)" }}
                >
                  Đã xong: 1 bộ slide, 1 recap 1 trang, 12 câu quiz có đáp án.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          data-reveal
          className="scroll-reveal mx-auto w-full max-w-6xl px-4 py-20 md:px-6"
        >
          <div className="mb-10">
            <h2 className="text-3xl font-semibold">Tính năng nổi bật</h2>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              6 công cụ trọng tâm giúp giảm tải công việc soạn giảng mỗi tuần.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border p-5"
                  style={{
                    borderColor: "var(--landing-border)",
                    background: "var(--landing-surface)",
                  }}
                >
                  <div
                    className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: "rgba(99, 102, 241, 0.28)",
                      background: "rgba(79, 70, 229, 0.12)",
                      color: "var(--color-ai-accent-dark)",
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {feature.desc}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section
          id="how-it-works"
          data-reveal
          className="scroll-reveal mx-auto w-full max-w-6xl px-4 py-18 md:px-6"
        >
          <div className="how-it-works-section">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-5xl font-semibold leading-tight md:text-6xl">
                Quy trình 4 bước đơn giản
              </h2>
              <p className="text-xl leading-relaxed text-[var(--color-text-secondary)] md:text-2xl">
                Từ tài liệu thô đến bài giảng hoàn chỉnh chỉ trong tích tắc.
                Lumiere AI đồng hành cùng bạn trong mọi giai đoạn.
              </p>
            </div>

            <div className="how-it-works-timeline mt-10">
              <div className="how-it-works-line" aria-hidden="true" />
              <div className="grid gap-8 md:grid-cols-4 md:gap-6">
                {steps.map((step) => (
                  <article key={step.number} className="how-step-item">
                    <div className="how-step-number">{step.number}</div>
                    <h3 className="how-step-title">{step.title}</h3>
                    <p className="how-step-description">{step.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="testimonials"
          data-reveal
          className="scroll-reveal mx-auto w-full max-w-6xl px-4 py-16 md:px-6"
        >
          <div className="testimonial-section rounded-[34px] px-5 py-10 md:px-8 md:py-12">
            <h2 className="mb-10 text-center text-4xl font-semibold md:text-5xl">
              Nhà giáo nói về Lumiere AI
            </h2>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  quote:
                    "Lumiere AI đã thay đổi hoàn toàn cách tôi soạn giáo án. Thay vì mất cả tối, giờ tôi chỉ cần 15 phút để có một bài giảng hoàn chỉnh.",
                  name: "Cô Anina",
                  role: "Giảng viên Ngôn ngữ",
                  avatarText: "AN",
                },
                {
                  quote:
                    "Khả năng tạo Wiki từ tài liệu thô thực sự ấn tượng. Học sinh của tôi rất thích tra cứu kiến thức trên nền tảng này.",
                  name: "Thầy Jminy",
                  role: "Giáo viên Vật lý",
                  avatarText: "JM",
                  featured: true,
                },
                {
                  quote:
                    "Ngân hàng câu hỏi tự động của Lumiere cực kỳ thông minh, sát với nội dung bài dạy và có độ khó phân hóa rất tốt.",
                  name: "Cô Alexander",
                  role: "Giáo viên Lịch sử",
                  avatarText: "AL",
                },
              ].map((item) => (
                <article
                  key={item.name}
                  className={`testimonial-card ${item.featured ? "testimonial-card--featured" : ""}`}
                >
                  <p className="testimonial-quote">“{item.quote}”</p>

                  <div className="testimonial-author">
                    <div className="testimonial-avatar" aria-hidden="true">
                      {item.avatarText}
                    </div>
                    <div>
                      <p className="testimonial-name">{item.name}</p>
                      <p className="testimonial-role">{item.role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          data-reveal
          className="scroll-reveal mx-auto w-full max-w-6xl px-4 py-12 md:px-6"
        >
          <div
            className="grid gap-4 rounded-3xl border p-6 text-center md:grid-cols-3"
            style={{
              borderColor: "var(--landing-border)",
              background: "var(--landing-surface)",
            }}
          >
            <div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                <AnimatedCounter to={80} suffix="%" />
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Tiết kiệm thời gian soạn bài
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                <AnimatedCounter to={500} suffix="+" />
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Giáo viên đã sử dụng
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                <AnimatedCounter to={10000} suffix="+" />
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Bài giảng được tạo
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 text-center md:px-6">
          <h2 className="text-3xl font-semibold">
            Sẵn sàng bắt đầu với Lumiere AI?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--color-text-secondary)]">
            Bắt đầu miễn phí, xây bài giảng đầu tiên chỉ trong vài phút.
          </p>
          <div className="mt-6">
            <Link
              to={primaryCta}
              className="glow-button rounded-full bg-[var(--color-ai-accent)] px-7 py-3 text-sm font-semibold text-white"
            >
              {primaryText}
            </Link>
          </div>
          <p className="mt-10 text-xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} Lumiere AI. All rights reserved.
          </p>
        </section>
      </main>
    </div>
  );
}
