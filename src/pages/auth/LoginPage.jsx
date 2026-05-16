/**
 * Lumiere AI — Login Page
 * Email/Password + Google OAuth button
 * Google button only shown when VITE_GOOGLE_CLIENT_ID is set
 */
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  login,
  register,
  googleLogin,
  clearError,
  selectAuth,
} from "../../store/authSlice.js";
import { Eye, EyeOff, Loader2, Mail, Lock, User } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import apiClient from "../../services/apiClient.js";

// ── Google login button (conditionally rendered) ──────────────
// Separated to avoid calling useGoogleLogin when client_id is absent
function GoogleButton({ onGoogleSuccess, disabled }) {
  const triggerLogin = useGoogleLogin({
    onSuccess: onGoogleSuccess,
    onError: () => console.error("Google login failed"),
    flow: "implicit",
  });
  return (
    <button
      type="button"
      onClick={() => triggerLogin()}
      disabled={disabled}
      className="w-full py-2.5 rounded-lg font-medium text-sm border transition-colors duration-150 cursor-pointer flex items-center justify-center gap-3 disabled:opacity-60"
      style={{
        background: "var(--color-bg-card)",
        borderColor: "var(--color-border)",
        color: "var(--color-text-primary)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "var(--color-ai-accent)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--color-border)")
      }
    >
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
      Tiếp tục với Google
    </button>
  );
}

// ── Main Login Page ───────────────────────────────────────────
export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error: authError } = useSelector(selectAuth);

  const [mode, setMode] = useState("login"); // 'login' | 'register' | 'forgot'
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: otp + new pass
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    otp: "",
  });
  const [infoMessage, setInfoMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = status === "loading" || localLoading;
  const error = authError || localError;
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    setLocalError("");
    setInfoMessage("");

    if (mode === "forgot") {
      await handleForgotFlow();
      return;
    }

    const action =
      mode === "login"
        ? login({
            email: form.email,
            password: form.password,
            rememberMe,
          })
        : register(form);
    const result = await dispatch(action);
    if (result.type.endsWith("/fulfilled")) navigate("/dashboard");
  };

  const handleForgotFlow = async () => {
    setLocalLoading(true);
    try {
      if (forgotStep === 1) {
        const res = await apiClient.post("/api/auth/forgot-password", {
          email: form.email,
        });
        setInfoMessage(res.data.message);
        setForgotStep(2);
      } else {
        const res = await apiClient.post("/api/auth/reset-password", {
          email: form.email,
          otp: form.otp,
          new_password: form.password,
        });
        setInfoMessage(res.data.message + " Đang quay lại trang đăng nhập...");
        setTimeout(() => {
          setMode("login");
          setForgotStep(1);
          setInfoMessage("");
          setForm({ ...form, password: "", otp: "" });
        }, 3000);
      }
    } catch (err) {
      setLocalError(err.response?.data?.detail || "Thao tác thất bại");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    const result = await dispatch(
      googleLogin(tokenResponse.credential || tokenResponse.access_token),
    );
    if (result.type.endsWith("/fulfilled")) navigate("/dashboard");
  };

  return (
    <div className="rounded-2xl p-8 w-full max-w-md shadow-xl glass-panel">
      {/* Tab: login / register */}
      {mode !== "forgot" ? (
        <div
          className="flex rounded-lg p-1 mb-6"
          style={{ background: "var(--color-bg-card)" }}
        >
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                dispatch(clearError());
                setLocalError("");
              }}
              className="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer"
              style={{
                background:
                  mode === m ? "var(--color-ai-accent)" : "transparent",
                color: mode === m ? "white" : "var(--color-text-muted)",
              }}
            >
              {m === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-6">
          <button
            onClick={() => {
              setMode("login");
              setForgotStep(1);
              setLocalError("");
              setInfoMessage("");
            }}
            className="text-xs flex items-center gap-1 hover:underline mb-2 cursor-pointer"
            style={{ color: "var(--color-text-muted)" }}
          >
            ← Quay lại đăng nhập
          </button>
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {forgotStep === 1 ? "Quên mật khẩu?" : "Đặt lại mật khẩu"}
          </h2>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {forgotStep === 1
              ? "Nhập email để nhận mã xác minh OTP."
              : `Mã OTP đã được gửi đến ${form.email}`}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full name (register only) */}
        {mode === "register" && (
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Họ và tên
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-text-muted)" }}
              />
              <input
                type="text"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                placeholder="Nguyễn Văn A"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-all duration-150"
                style={{
                  background: "var(--color-bg-card)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--color-ai-accent)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--color-border)")
                }
              />
            </div>
          </div>
        )}

        {/* Email - Hidden in forgot step 2 */}
        {(mode !== "forgot" || forgotStep === 1) && (
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-text-muted)" }}
              />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="teacher@school.edu.vn"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-all duration-150"
                style={{
                  background: "var(--color-bg-card)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--color-ai-accent)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--color-border)")
                }
              />
            </div>
          </div>
        )}

        {/* OTP Input (Forgot Step 2 only) */}
        {mode === "forgot" && forgotStep === 2 && (
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Mã OTP (6 số)
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={form.otp}
              onChange={(e) =>
                setForm({ ...form, otp: e.target.value.replace(/\D/g, "") })
              }
              placeholder="123456"
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all duration-150 text-center tracking-[0.5em] font-bold"
              style={{
                background: "var(--color-bg-card)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>
        )}

        {/* Password (login/register/forgot-step2) */}
        {(mode !== "forgot" || forgotStep === 2) && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                className="block text-sm font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {mode === "forgot" ? "Mật khẩu mới" : "Mật khẩu"}
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setMode("forgot")}
                  className="text-xs hover:underline cursor-pointer"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Quên mật khẩu?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-text-muted)" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm outline-none transition-all duration-150"
                style={{
                  background: "var(--color-bg-card)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--color-ai-accent)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--color-border)")
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: "var(--color-text-muted)" }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        )}

        {mode === "login" && (
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="cursor-pointer"
            />
            <span
              className="text-sm leading-tight"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Ghi nhớ đăng nhập
            </span>
          </label>
        )}

        {/* Info Message */}
        {infoMessage && (
          <div
            className="px-4 py-3 rounded-lg text-sm"
            style={{
              background: "rgba(34,197,94,0.1)",
              color: "var(--color-success)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            {infoMessage}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="px-4 py-3 rounded-lg text-sm"
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "var(--color-error)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            {error}
          </div>
        )}

        {/* Legal Checkboxes (Register only) */}
        {mode === "register" && (
          <div className="space-y-3 pt-2 pb-2">
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input type="checkbox" required id="accept-terms" className="mt-1 cursor-pointer" />
              <span className="text-sm leading-tight" style={{ color: "var(--color-text-secondary)" }}>
                Tôi đã đọc và đồng ý với <Link to="/terms" className="hover:underline font-medium" style={{ color: "var(--color-primary)" }}>Điều khoản sử dụng</Link> và <Link to="/terms" className="hover:underline font-medium" style={{ color: "var(--color-primary)" }}>Chính sách bảo mật</Link>
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input type="checkbox" required id="accept-ai-processing" className="mt-1 cursor-pointer" />
              <span className="text-sm leading-tight" style={{ color: "var(--color-text-secondary)" }}>
                Tôi đồng ý cho phép hệ thống AI xử lý nội dung (theo <Link to="/terms#section-5" className="hover:underline font-medium" style={{ color: "var(--color-primary)" }}>Điều 5 — Xử lý AI</Link>)
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input type="checkbox" id="accept-marketing" className="mt-1 cursor-pointer" />
              <span className="text-sm leading-tight" style={{ color: "var(--color-text-secondary)" }}>
                Nhận thông báo cập nhật từ Lumiere AI (không bắt buộc)
              </span>
            </label>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors duration-150 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "var(--color-ai-accent)", color: "white" }}
          onMouseEnter={(e) =>
            !isLoading &&
            (e.currentTarget.style.background = "var(--color-ai-accent-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--color-ai-accent)")
          }
        >
          {isLoading && <Loader2 size={16} className="animate-spin" />}
          {mode === "login"
            ? "Đăng nhập"
            : mode === "register"
              ? "Tạo tài khoản"
              : forgotStep === 1
                ? "Gửi mã OTP"
                : "Xác nhận đổi mật khẩu"}
        </button>
      </form>

      {/* Google OAuth section — only when configured */}
      {mode !== "forgot" && googleClientId && (
        <>
          <div className="flex items-center gap-3 my-5">
            <div
              className="flex-1 h-px"
              style={{ background: "var(--color-border)" }}
            />
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              hoặc
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "var(--color-border)" }}
            />
          </div>
          <GoogleButton
            onGoogleSuccess={handleGoogleSuccess}
            disabled={isLoading}
          />
        </>
      )}

      {/* No Google configured hint */}
      {mode !== "forgot" && !googleClientId && (
        <p
          className="text-center mt-4 text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          Cài VITE_GOOGLE_CLIENT_ID để bật đăng nhập Google
        </p>
      )}
    </div>
  );
}
