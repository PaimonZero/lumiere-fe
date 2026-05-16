/**
 * Lumiere AI — Auth Layout
 * Modern Split-Screen Layout (Left: Brand/Illustration, Right: Auth Form)
 */
import { Outlet } from "react-router-dom";
import { Typography } from "antd";
import ThemeModeToggle from "../components/common/ThemeModeToggle.jsx";
import { BookOpen, Sparkles, GraduationCap } from "lucide-react";

const { Title, Text } = Typography;

export default function AuthLayout() {
  return (
    <div className="h-screen w-full overflow-hidden bg-mesh-soft flex flex-row">
      {/* ── Left Side: Brand & Inspiring Message (Hidden on Mobile) ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
           style={{ background: 'var(--color-bg-elevated)', borderRight: '1px solid var(--color-border)' }}>
        
        {/* Subtle decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
             style={{ background: "var(--color-primary)" }} />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
             style={{ background: "var(--gradient-mint)" }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
               style={{ background: "var(--color-primary)" }}>
            <BookOpen size={20} color="white" />
          </div>
          <span className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
            Lumiere AI
          </span>
        </div>

        {/* Hero Message */}
        <div className="relative z-10 flex flex-col gap-6 max-w-lg">
          <h1 className="text-4xl leading-tight font-bold"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
            Khơi nguồn cảm hứng, <br />
            <span style={{ color: "var(--color-primary)" }}>Kiến tạo tri thức</span>
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Trợ lý AI đắc lực dành riêng cho giảng viên và nhà giáo dục. Tối ưu hóa thời gian soạn bài, chấm điểm và cá nhân hóa lộ trình học tập cho học sinh.
          </p>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-center gap-3 glass-panel px-4 py-3 rounded-xl w-fit">
              <Sparkles size={20} style={{ color: "var(--color-primary)" }} />
              <Text style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>Soạn giáo án thông minh trong tích tắc</Text>
            </div>
            <div className="flex items-center gap-3 glass-panel px-4 py-3 rounded-xl w-fit">
              <GraduationCap size={20} style={{ color: "var(--color-primary)" }} />
              <Text style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>Đánh giá tiến độ học sinh chuẩn xác</Text>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10">
          <Text style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
            © {new Date().getFullYear()} Lumiere AI. Phát triển cho nền giáo dục tương lai.
          </Text>
        </div>
      </div>

      {/* ── Right Side: Auth Form ── */}
      <main className="w-full lg:w-1/2 flex flex-col relative z-10 p-6 sm:p-12 h-full overflow-y-auto">
        <div className="absolute top-6 right-6">
          <ThemeModeToggle compact />
        </div>

        {/* Mobile Logo */}
        <div className="lg:hidden flex justify-center items-center gap-2 mb-8 mt-12">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: "var(--color-primary)" }}>
            <BookOpen size={16} color="white" />
          </div>
          <span className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
            Lumiere AI
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center w-full max-w-md mx-auto">
          <div className="text-center mb-8 hidden lg:block">
            <Title level={3} style={{ margin: 0, fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>Chào mừng trở lại</Title>
            <Text style={{ color: "var(--color-text-muted)" }}>Đăng nhập để tiếp tục với Lumiere AI</Text>
          </div>
          
          <div className="w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
