/**
 * Lumiere AI — Pricing Page (SePay VietQR)
 *
 * Flow:
 *  1. User click "Đăng ký" → POST /api/payments/create
 *  2. Nhận { qr_url, transfer_content, amount } → hiển thị QR modal
 *  3. User quét QR / chuyển khoản với nội dung = order_id
 *  4. Frontend polling GET /api/payments/verify/:orderId mỗi 3s
 *  5. Backend verify qua SePay transaction API → trả về PAID
 *  6. Đóng modal, hiển thị thành công
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, ArrowLeft, Loader2, AlertCircle, CheckCircle, X, Copy,
} from 'lucide-react';
import { paymentService } from '../../services/paymentService.js';

// ── Plan config ───────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free',
    name: 'Gói Free',
    price: 0,
    icon: '🎓',
    color: '#6b7280',
    border: 'rgba(107,114,128,0.4)',
    bg: 'rgba(107,114,128,0.08)',
    badge: null,
    features: [
      '10 lượt tạo slide / tháng',
      '2 lượt tải PDF / tháng',
      'Reset vào đầu tháng sau',
    ],
  },
  {
    id: 'pro',
    name: 'Gói Pro',
    price: 50_000,
    icon: '⚡',
    color: '#818cf8',
    border: '#818cf8',
    bg: 'rgba(129,140,248,0.1)',
    badge: null,
    features: [
      '20 lượt tạo slide / tháng',
      '10 lượt tải PDF / tháng',
      'Ưu tiên hỗ trợ',
    ],
  },
  {
    id: 'max',
    name: 'Gói MAX',
    price: 100_000,
    icon: '🚀',
    color: '#f59e0b',
    border: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    badge: 'PHỔ BIẾN',
    features: [
      '50 lượt tạo slide / tháng',
      '30 lượt tải PDF / tháng',
      'Xuất PDF chất lượng cao',
    ],
  },
  {
    id: 'unlimited',
    name: 'Gói Unlimited',
    price: 500_000,
    icon: '♾️',
    color: '#4ade80',
    border: '#4ade80',
    bg: 'rgba(74,222,128,0.1)',
    badge: null,
    features: [
      'Không giới hạn tạo slide',
      'Không giới hạn tải PDF',
      'Hỗ trợ 24/7',
    ],
  },
];

function formatPrice(price) {
  if (price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function QuotaBar({ used, limit, color }) {
  if (limit === -1) return (
    <div style={{ fontSize: 12, color: '#4ade80', marginTop: 4 }}>∞ Không giới hạn</div>
  );
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isWarning = pct >= 80;
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>
        <span>{used} / {limit} đã dùng</span>
        <span style={{ color: isWarning ? '#f87171' : '#9ca3af' }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: isWarning ? '#f87171' : color,
          borderRadius: 2, transition: 'width 0.3s',
        }} />
      </div>
    </div>
  );
}

// ── QR Payment Modal ──────────────────────────────────────────────────────────
function QRModal({ paymentData, onClose, onPaid }) {
  const [pollingStatus, setPollingStatus] = useState('polling'); // polling | paid | failed | timeout
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    // Start polling immediately
    pollingRef.current = setInterval(async () => {
      attemptsRef.current += 1;
      try {
        const result = await paymentService.verifyPayment(paymentData.order_id);
        if (result.status === 'PAID') {
          clearInterval(pollingRef.current);
          setPollingStatus('paid');
          setTimeout(() => onPaid(result), 1500);
        } else if (result.status === 'FAILED' || result.status === 'CANCELLED') {
          clearInterval(pollingRef.current);
          setPollingStatus('failed');
        } else if (attemptsRef.current >= 40) {
          // 40 × 3s = 2 minutes max
          clearInterval(pollingRef.current);
          setPollingStatus('timeout');
        }
      } catch {
        if (attemptsRef.current >= 40) {
          clearInterval(pollingRef.current);
          setPollingStatus('timeout');
        }
      }
    }, 3000);

    return () => clearInterval(pollingRef.current);
  }, [paymentData.order_id, onPaid]);

  const copyContent = () => {
    navigator.clipboard.writeText(paymentData.transfer_content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isPaid = pollingStatus === 'paid';
  const isFailed = pollingStatus === 'failed';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#1A2444', borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '28px 28px 24px',
        width: '100%', maxWidth: 420,
        position: 'relative',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        {/* Close button */}
        {!isPaid && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.08)', border: 'none',
              borderRadius: 8, color: '#9ca3af', cursor: 'pointer',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        )}

        {/* Paid state */}
        {isPaid ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(74,222,128,0.15)', border: '2px solid #4ade80',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <CheckCircle size={32} color="#4ade80" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>
              Thanh toán thành công! 🎉
            </div>
            <div style={{ fontSize: 14, color: '#9AA8C7' }}>
              Gói <strong style={{ color: '#f0f4ff' }}>{paymentData.plan_name}</strong> đã được kích hoạt.
            </div>
          </div>
        ) : isFailed ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <AlertCircle size={40} color="#f87171" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>
              Thanh toán thất bại
            </div>
            <div style={{ fontSize: 14, color: '#9AA8C7', marginBottom: 20 }}>
              Vui lòng thử lại hoặc liên hệ hỗ trợ.
            </div>
            <button onClick={onClose} style={{
              background: '#374151', border: 'none', borderRadius: 8,
              color: '#f0f4ff', cursor: 'pointer', padding: '8px 20px', fontSize: 14,
            }}>
              Đóng
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>
                Quét QR để thanh toán
              </div>
              <div style={{ fontSize: 13, color: '#9AA8C7' }}>
                {paymentData.plan_name} — {formatPrice(paymentData.amount)}
              </div>
            </div>

            {/* QR Code */}
            <div style={{
              background: '#fff', borderRadius: 12, padding: 12,
              display: 'flex', justifyContent: 'center', marginBottom: 20,
            }}>
              <img
                src={paymentData.qr_url}
                alt="VietQR"
                width={240}
                height={240}
                style={{ display: 'block', borderRadius: 8 }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>

            {/* Transfer info */}
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 16,
            }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Thông tin chuyển khoản</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#9AA8C7' }}>Ngân hàng</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{paymentData.bank_code}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#9AA8C7' }}>Số tài khoản</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>{paymentData.bank_account}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#9AA8C7' }}>Số tiền</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                  {formatPrice(paymentData.amount)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#9AA8C7' }}>Nội dung CK</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: '#818cf8',
                    fontFamily: 'monospace', letterSpacing: 1,
                  }}>
                    {paymentData.transfer_content}
                  </span>
                  <button
                    onClick={copyContent}
                    title="Sao chép"
                    style={{
                      background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(129,140,248,0.15)',
                      border: `1px solid ${copied ? '#4ade80' : '#818cf8'}`,
                      borderRadius: 6, cursor: 'pointer',
                      padding: '2px 6px', display: 'flex', alignItems: 'center',
                    }}
                  >
                    {copied
                      ? <CheckCircle size={12} color="#4ade80" />
                      : <Copy size={12} color="#818cf8" />
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* Polling status */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 13, color: pollingStatus === 'timeout' ? '#fbbf24' : '#9AA8C7',
            }}>
              {pollingStatus === 'timeout' ? (
                <>
                  <AlertCircle size={14} color="#fbbf24" />
                  Chưa nhận được thanh toán. Vui lòng kiểm tra lại.
                </>
              ) : (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Đang chờ xác nhận thanh toán...
                </>
              )}
            </div>

            <div style={{ fontSize: 11, color: '#4b5563', textAlign: 'center', marginTop: 8 }}>
              ⚠️ Nhập đúng nội dung chuyển khoản để hệ thống tự động xác nhận
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const navigate = useNavigate();
  const [quota, setQuota] = useState(null);
  const [loadingQuota, setLoadingQuota] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [error, setError] = useState(null);
  const [activePayment, setActivePayment] = useState(null); // payment data for QR modal
  const [paidPlan, setPaidPlan] = useState(null); // plan just paid

  const loadQuota = () => {
    paymentService.getQuota()
      .then(setQuota)
      .catch(() => setQuota(null))
      .finally(() => setLoadingQuota(false));
  };

  useEffect(() => { loadQuota(); }, []);

  const handleCheckout = async (planId) => {
    setCheckoutLoading(planId);
    setError(null);
    try {
      const data = await paymentService.createPayment(planId);
      setActivePayment(data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Không thể tạo đơn hàng');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePaid = (result) => {
    setActivePayment(null);
    setPaidPlan(result.plan_id);
    loadQuota(); // refresh quota display
  };

  const currentPlan = quota?.plan || 'free';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0E1530 0%, #1a1a2e 100%)',
      color: '#F0F4FF',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '32px 24px 60px',
    }}>
      {/* QR Modal */}
      {activePayment && (
        <QRModal
          paymentData={activePayment}
          onClose={() => setActivePayment(null)}
          onPaid={handlePaid}
        />
      )}

      {/* Back */}
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          background: 'none', border: 'none', color: '#9AA8C7',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 14, marginBottom: 28, padding: '4px 0',
        }}
      >
        <ArrowLeft size={16} /> Về Dashboard
      </button>

      {/* Success banner after payment */}
      {paidPlan && (
        <div style={{
          background: 'rgba(74,222,128,0.12)', border: '1px solid #4ade80',
          borderRadius: 12, padding: '14px 20px', marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <CheckCircle size={20} color="#4ade80" />
          <div>
            <div style={{ fontWeight: 600, color: '#4ade80' }}>Thanh toán thành công! 🎉</div>
            <div style={{ fontSize: 13, color: '#9AA8C7', marginTop: 2 }}>
              Gói <strong>{PLANS.find(p => p.id === paidPlan)?.name || paidPlan}</strong> đã được kích hoạt.
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-block', padding: '4px 14px',
          background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.35)',
          borderRadius: 20, fontSize: 13, color: '#a78bfa', marginBottom: 14,
        }}>
          💎 Nâng cấp tài khoản
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px', lineHeight: 1.2 }}>
          Chọn gói phù hợp với bạn
        </h1>
        <p style={{ color: '#9AA8C7', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>
          Tạo bài giảng tương tác với AI. Thanh toán qua VietQR — chuyển khoản ngân hàng.
        </p>
      </div>

      {/* Current quota summary */}
      {!loadingQuota && quota && (
        <div style={{
          maxWidth: 860, margin: '0 auto 36px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '16px 24px',
          display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <div style={{ fontSize: 13, color: '#9AA8C7' }}>
            Gói hiện tại: <strong style={{ color: '#f0f4ff' }}>{quota.plan_name || quota.plan}</strong>
            {quota.quota_reset_at && (
              <span style={{ marginLeft: 8, color: '#6b7280' }}>
                · Reset: {new Date(quota.quota_reset_at).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: '#9AA8C7', marginBottom: 2 }}>Tạo slide</div>
            <QuotaBar used={quota.slides_used} limit={quota.slides_limit} color="#818cf8" />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: '#9AA8C7', marginBottom: 2 }}>Tải PDF</div>
            <QuotaBar used={quota.pdf_used} limit={quota.pdf_limit} color="#f59e0b" />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171',
          borderRadius: 8, padding: '10px 16px', marginBottom: 20,
          color: '#f87171', textAlign: 'center', fontSize: 14,
          maxWidth: 860, margin: '0 auto 20px',
        }}>
          {error}
        </div>
      )}

      {/* Plans grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 20,
        maxWidth: 960,
        margin: '0 auto',
      }}>
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const isLoading = checkoutLoading === plan.id;

          return (
            <div
              key={plan.id}
              style={{
                background: '#1A2444',
                border: `2px solid ${isCurrentPlan ? plan.border : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 16,
                padding: '24px 20px',
                position: 'relative',
                transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                boxShadow: isCurrentPlan ? `0 0 20px ${plan.color}30` : 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = plan.border;
                e.currentTarget.style.boxShadow = `0 8px 24px ${plan.color}25`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = isCurrentPlan ? plan.border : 'rgba(255,255,255,0.08)';
                e.currentTarget.style.boxShadow = isCurrentPlan ? `0 0 20px ${plan.color}30` : 'none';
              }}
            >
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%',
                  transform: 'translateX(-50%)',
                  background: plan.color, color: '#000',
                  padding: '3px 12px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  {plan.badge}
                </div>
              )}
              {isCurrentPlan && (
                <div style={{
                  position: 'absolute', top: -12, right: 16,
                  background: '#1A2444', border: `1px solid ${plan.border}`,
                  color: plan.color, padding: '2px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 600,
                }}>
                  ✓ Đang dùng
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: plan.bg, border: `1px solid ${plan.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {plan.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#f0f4ff' }}>{plan.name}</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: plan.color }}>
                  {formatPrice(plan.price)}
                </span>
                {plan.price > 0 && (
                  <span style={{ color: '#9AA8C7', fontSize: 13, marginLeft: 4 }}>/tháng</span>
                )}
              </div>

              <ul style={{
                listStyle: 'none', padding: 0, margin: '0 0 20px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                    <Check size={14} color="#4ade80" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: '#d1d5db' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  if (!isCurrentPlan && plan.price > 0 && !isLoading) {
                    handleCheckout(plan.id);
                  }
                }}
                disabled={isCurrentPlan || plan.price === 0 || isLoading}
                style={{
                  width: '100%', padding: '10px 0',
                  background: isCurrentPlan || plan.price === 0
                    ? 'rgba(255,255,255,0.05)'
                    : `linear-gradient(135deg, ${plan.color}cc, ${plan.color})`,
                  border: `1px solid ${plan.border}`,
                  borderRadius: 8,
                  color: isCurrentPlan || plan.price === 0 ? plan.color : '#000',
                  fontWeight: 700, fontSize: 14,
                  cursor: (isCurrentPlan || plan.price === 0 || isLoading) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: isLoading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'opacity 0.2s',
                }}
              >
                {isLoading ? (
                  <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Đang tạo QR...</>
                ) : isCurrentPlan ? (
                  '✓ Gói hiện tại'
                ) : plan.price === 0 ? (
                  'Gói miễn phí'
                ) : (
                  `Thanh toán VietQR`
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust badges */}
      <div style={{
        textAlign: 'center', marginTop: 44, color: '#6b7280', fontSize: 12,
        display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap',
      }}>
        <span>🔒 Bảo mật SSL</span>
        <span>🏦 Chuyển khoản VietQR</span>
        <span>⚡ Kích hoạt tự động</span>
        <span>↩️ Hoàn tiền trong 7 ngày</span>
      </div>
      <div style={{ textAlign: 'center', marginTop: 12, color: '#4b5563', fontSize: 12 }}>
        Xác nhận thanh toán tự động qua{' '}
        <a href="https://sepay.vn" target="_blank" rel="noopener noreferrer"
          style={{ color: '#818cf8', textDecoration: 'none' }}>SePay</a>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
