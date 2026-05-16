/**
 * Lumiere AI — Right Panel
 * AI Outputs: Slides | Summary | Quiz
 * Reads from the lastResult in Redux store.
 */
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, Empty, Modal, Space, Spin, Tabs, Tag, Tooltip, Typography, message as antMessage } from 'antd';
import { Presentation, FileText, HelpCircle, Maximize2, ExternalLink, Download, Layers, ListChecks } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { selectLastResult, selectIsGenerating } from '../../store/chatSlice.js';
import SlideModal from '../outputs/SlideModal.jsx';
import ContentModal from '../outputs/ContentModal.jsx';
import QuestionStudyModal from '../outputs/QuestionStudyModal.jsx';

const INITIAL_NOW_MS = Date.now();

const OUTPUT_TABS = [
  { id: 'slide', label: 'Slide', icon: Presentation },
  { id: 'recap', label: 'Tóm tắt', icon: FileText },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle },
];

function EmptyState({ icon: Icon, label, description }) {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <Space direction="vertical" size={2}>
          <Space align="center" size={6}>
            <Icon size={14} style={{ color: 'var(--color-text-muted)' }} />
            <Typography.Text style={{ color: 'var(--color-text-muted)' }}>{label}</Typography.Text>
          </Space>
          <Typography.Text style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{description}</Typography.Text>
        </Space>
      }
    />
  );
}

function formatRemainingTime(expiresAt, nowMs) {
  if (!expiresAt) return null;

  const expiresMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresMs)) return null;

  const diff = expiresMs - nowMs;
  if (diff <= 0) return 'Slide đã hết hạn lưu trữ';

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `Còn ${days} ngày ${hours} giờ`;
  if (hours > 0) return `Còn ${hours} giờ ${minutes} phút`;
  return `Còn ${minutes} phút`;
}

// Badge for slide tab
export default function RightPanel() {
  const [manualTab, setManualTab] = useState({ result: null, tab: null });
  const [localShare, setLocalShare] = useState({ outputId: null, url: null });
  const navigate = useNavigate();

  // Modal states
  const [slideModalOpen, setSlideModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [selectedQuizIndex, setSelectedQuizIndex] = useState(0);
  const [quizMode, setQuizMode] = useState('mcq');
  const [nowMs, setNowMs] = useState(INITIAL_NOW_MS);

  const lastResult = useSelector(selectLastResult);
  const isGenerating = useSelector(selectIsGenerating);

  const slides = lastResult?.slides || [];
  const slidevMarkdown = lastResult?.slidev_markdown || '';
  const slideOutputId = lastResult?.slide_output_id;
  const slideExpiresAt = lastResult?.slide_expires_at;
  const shareUrl = localShare.outputId === slideOutputId
    ? (localShare.url || lastResult?.share_url || '')
    : (lastResult?.share_url || '');
  const slideRemaining = formatRemainingTime(slideExpiresAt, nowMs);
  // presentation_id từ Reveal.js mới
  const presentationId = lastResult?.presentation_id || null;
  // quiz_page_id từ question pipeline
  const quizPageId = lastResult?.quiz_page_id || null;

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const suggestedTab = useMemo(() => {
    if (!lastResult) return 'slide';
    if (lastResult.intent === 'question' && lastResult.questions?.length > 0) {
      return 'quiz';
    }
    if (lastResult.intent === 'summary' && lastResult.summary) {
      return 'recap';
    }
    if (lastResult.intent === 'slide' && (lastResult.presentation_id || lastResult.share_url || lastResult.slidev_markdown || lastResult.slides?.length > 0)) {
      return 'slide';
    }
    return 'slide';
  }, [lastResult]);

  const activeTab = manualTab.result === lastResult && manualTab.tab ? manualTab.tab : suggestedTab;

  const questions = lastResult?.questions || [];
  const summary = lastResult?.summary || '';

  // Badge: ưu tiên presentation_id
  const slideBadge = (presentationId || shareUrl || slidevMarkdown || slides.length > 0) ? '✓' : null;
  const quizBadge = questions.length > 0 ? questions.length : null;
  const recapBadge = summary ? '✓' : null;
  const badges = { slide: slideBadge, recap: recapBadge, quiz: quizBadge };

  const tabItems = OUTPUT_TABS.map(({ id, label, icon: Icon }) => ({
    key: id,
    label: (
      <Space size={6}>
        <Icon size={14} />
        <span>{label}</span>
        {badges[id] ? <Badge count={badges[id]} size="small" /> : null}
      </Space>
    ),
  }));

  return (
    <div className="flex flex-col h-full" data-tour="output">
      {/* Slide Modal */}
      <SlideModal
        open={slideModalOpen}
        onClose={() => setSlideModalOpen(false)}
        shareUrl={shareUrl}
        slidevMarkdown={slidevMarkdown}
        slides={slides}
        outputId={slideOutputId}
        onRebuildComplete={(newUrl) => setLocalShare({ outputId: slideOutputId, url: newUrl })}
      />

      {/* Summary Modal */}
      <ContentModal
        open={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        title="Tóm tắt bài học"
        content={summary}
      />

      {/* Quiz Modal */}
      {quizModalOpen && questions.length > 0 && (
        <QuestionStudyModal
          key={`${selectedQuizIndex}-${quizMode}`}
          open={quizModalOpen}
          onClose={() => setQuizModalOpen(false)}
          questions={questions}
          initialIndex={selectedQuizIndex}
          initialMode={quizMode}
        />
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <Typography.Text className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
          Kết quả AI
        </Typography.Text>
      </div>

      {/* Tab switcher */}
      <Tabs
        size="small"
        activeKey={activeTab}
        onChange={(tab) => setManualTab({ result: lastResult, tab })}
        className="pt-1 shrink-0"
        style={{ paddingInline: '12px' }}
        items={tabItems}
      />

      {/* Content area */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '8px 12px' }}>
        {isGenerating && (
          <div className="flex items-center justify-center h-20">
            <Space align="center" size={8}>
              <Spin size="small" />
              <Typography.Text style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Đang xử lý…</Typography.Text>
            </Space>
          </div>
        )}

        {/* Slides tab */}
        {activeTab === 'slide' && !isGenerating && (
          presentationId ? (
            /* ── Reveal.js Presentation (mới) ── */
            <div className="space-y-3">
              {/* Nút mở Reveal.js Editor */}
              <button
                onClick={() => navigate(`/presentations/${presentationId}`)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(79,70,229,0.08))',
                  borderColor: '#7c3aed',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.15))'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(79,70,229,0.08))'}
              >
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'rgba(124,58,237,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Presentation size={18} style={{ color: '#a78bfa' }} />
                  </div>
                  <div className="text-left">
                    <Typography.Text strong style={{ color: 'var(--color-text-primary)', fontSize: 13, display: 'block' }}>
                      Mở Reveal.js Editor
                    </Typography.Text>
                    <Typography.Text style={{ color: '#a78bfa', fontSize: 11 }}>
                      Chỉnh sửa WYSIWYG · Tạo ảnh AI · Export PDF/PPTX
                    </Typography.Text>
                  </div>
                </div>
                <ExternalLink size={15} style={{ color: '#7c3aed', flexShrink: 0 }} />
              </button>

              {/* Thông tin slide */}
              {slides.length > 0 && (
                <div style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10, padding: '10px 12px',
                }}>
                  <Typography.Text style={{ color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {slides.length} slides đã tạo
                  </Typography.Text>
                  <div className="mt-2 space-y-1">
                    {slides.slice(0, 4).map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 10, color: '#7c3aed', fontWeight: 700,
                          background: 'rgba(124,58,237,0.1)', borderRadius: 4,
                          padding: '1px 5px', flexShrink: 0,
                        }}>
                          {i + 1}
                        </span>
                        <Typography.Text ellipsis style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                          {s.title || `Slide ${i + 1}`}
                        </Typography.Text>
                      </div>
                    ))}
                    {slides.length > 4 && (
                      <Typography.Text style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>
                        +{slides.length - 4} slides nữa...
                      </Typography.Text>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : shareUrl ? (
            /* ── Slidev legacy (có share URL) ── */
            <div className="space-y-3">
              <button
                onClick={() => setSlideModalOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all hover:border-[var(--color-ai-accent)]"
                style={{
                  background: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Presentation size={16} style={{ color: 'var(--color-ai-accent)' }} />
                  <div className="text-left">
                    <Typography.Text strong style={{ color: 'var(--color-text-primary)', fontSize: 13 }}>
                      Bài trình chiếu
                    </Typography.Text>
                    <br />
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      Nhấn để mở trình chiếu
                    </Typography.Text>
                    {slideRemaining && (
                      <>
                        <br />
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          {slideRemaining}
                        </Typography.Text>
                      </>
                    )}
                  </div>
                </div>
                <Maximize2 size={16} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </div>
          ) : slidevMarkdown ? (
            /* ── Slidev legacy (chỉ có markdown) ── */
            <button
              onClick={() => setSlideModalOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all hover:border-[var(--color-ai-accent)]"
              style={{
                background: 'var(--color-bg-card)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-center gap-2">
                <Presentation size={16} style={{ color: 'var(--color-ai-accent)' }} />
                <div className="text-left">
                  <Typography.Text strong style={{ color: 'var(--color-text-primary)', fontSize: 13 }}>
                    Slide Markdown
                  </Typography.Text>
                  <br />
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    Nhấn để xem nội dung
                  </Typography.Text>
                </div>
              </div>
              <Maximize2 size={16} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          ) : (
            <EmptyState
              icon={Presentation}
              label="Chưa có Slide"
              description='Yêu cầu "Tạo slide bài giảng..." để bắt đầu'
            />
          )
        )}

        {/* Summary tab */}
        {activeTab === 'recap' && !isGenerating && (
          summary ? (
            <div className="space-y-3">
              {/* Download .md shortcut */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Tooltip title="Tải Markdown">
                  <Button
                    size="small"
                    icon={<Download size={13} />}
                    onClick={() => {
                      const blob = new Blob([summary], { type: 'text/markdown;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = 'tom-tat.md'; a.click();
                      URL.revokeObjectURL(url);
                      antMessage.success('Đã tải file .md');
                    }}
                    style={{ borderRadius: 6, fontSize: 12 }}
                  >
                    .md
                  </Button>
                </Tooltip>
              </div>
              <button
                onClick={() => setSummaryModalOpen(true)}
                className="w-full text-left"
              >
                <Card
                  size="small"
                  hoverable
                  styles={{ body: { padding: 12 } }}
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-bg-card)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={14} style={{ color: 'var(--color-ai-accent)' }} />
                      <Typography.Text strong style={{ color: 'var(--color-text-primary)', fontSize: 13 }}>
                        Tóm tắt bài học
                      </Typography.Text>
                    </div>
                    <Maximize2 size={12} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                  <div className="mt-2 text-xs markdown-content" style={{ color: 'var(--color-text-secondary)', maxHeight: 80, overflow: 'hidden' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {summary.length > 200 ? summary.slice(0, 200) + '…' : summary}
                    </ReactMarkdown>
                  </div>
                </Card>
              </button>
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              label="Chưa có tóm tắt"
              description='Yêu cầu "Tóm tắt bài học..." để tạo'
            />
          )
        )}

        {/* Quiz tab */}
        {activeTab === 'quiz' && !isGenerating && (
          questions.length > 0 ? (
            <div className="space-y-2">
              {/* Quiz Page CTA */}
              {quizPageId && (
                <button
                  onClick={() => navigate(`/quiz/${quizPageId}`)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all mb-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))',
                    borderColor: '#10b981',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.15))'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))'}
                >
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'rgba(16,185,129,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <HelpCircle size={16} style={{ color: '#34d399' }} />
                    </div>
                    <div className="text-left">
                      <Typography.Text strong style={{ color: 'var(--color-text-primary)', fontSize: 13, display: 'block' }}>
                        Mở trang Quiz (Quizlet)
                      </Typography.Text>
                      <Typography.Text style={{ color: '#34d399', fontSize: 11 }}>
                        Quiz đầy đủ · 4 đáp án · Giải thích
                      </Typography.Text>
                    </div>
                  </div>
                  <ExternalLink size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedQuizIndex(0); setQuizMode('mcq'); setQuizModalOpen(true); }}
                  className="rounded-xl border px-3 py-3 text-left transition-colors"
                  style={{
                    background: 'rgba(99,102,241,0.08)',
                    borderColor: 'rgba(99,102,241,0.22)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <ListChecks size={16} style={{ color: 'var(--color-ai-accent)' }} />
                  <Typography.Text strong className="mt-2 block" style={{ color: 'var(--color-text-primary)', fontSize: 12 }}>
                    Trắc nghiệm
                  </Typography.Text>
                  <Typography.Text style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>
                    Chọn đáp án, xem đúng/sai
                  </Typography.Text>
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedQuizIndex(0); setQuizMode('flashcard'); setQuizModalOpen(true); }}
                  className="rounded-xl border px-3 py-3 text-left transition-colors"
                  style={{
                    background: 'rgba(16,185,129,0.08)',
                    borderColor: 'rgba(16,185,129,0.24)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <Layers size={16} style={{ color: '#10b981' }} />
                  <Typography.Text strong className="mt-2 block" style={{ color: 'var(--color-text-primary)', fontSize: 12 }}>
                    Flashcard
                  </Typography.Text>
                  <Typography.Text style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>
                    Lật thẻ để ôn nhanh
                  </Typography.Text>
                </button>
              </div>

              <div className="flex items-center justify-between mb-1">
                <Typography.Text style={{ color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {questions.length} câu hỏi
                </Typography.Text>
                <button
                  onClick={() => { setSelectedQuizIndex(0); setQuizMode('mcq'); setQuizModalOpen(true); }}
                  className="text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  style={{ color: 'var(--color-ai-accent)' }}
                >
                  <Maximize2 size={11} />
                  Xem tất cả
                </button>
              </div>
              {questions.map((q, i) => (
                <Card
                  key={i}
                  size="small"
                  hoverable
                  onClick={() => { setSelectedQuizIndex(i); setQuizMode('mcq'); setQuizModalOpen(true); }}
                  styles={{ body: { padding: '10px 12px' } }}
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-bg-card)',
                    cursor: 'pointer',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Tag color="processing" style={{ marginInlineEnd: 0, flexShrink: 0, fontSize: 11 }}>
                      Q{i + 1}
                    </Tag>
                    <Typography.Text
                      ellipsis
                      style={{ color: 'var(--color-text-primary)', flex: 1, fontSize: 13 }}
                    >
                      {q.question_text}
                    </Typography.Text>
                    <Maximize2 size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={HelpCircle}
              label="Chưa có câu hỏi"
              description='Yêu cầu "Tạo câu hỏi trắc nghiệm..." để bắt đầu'
            />
          )
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-3 py-2.5 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <Typography.Text className="text-xs text-center w-full block" style={{ color: 'var(--color-text-muted)' }}>
          {lastResult
            ? `${lastResult.intent} · ${((lastResult.processing_time_ms || 0) / 1000).toFixed(1)}s`
            : "Kết quả sẽ xuất hiện sau khi AI hoàn thành"
          }
        </Typography.Text>
      </div>
    </div>
  );
}

// ── Quiz Modal with navigation ──
// eslint-disable-next-line no-unused-vars
function LegacyQuizModal({ open, onClose, questions, initialIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showAnswer, setShowAnswer] = useState(false);

  const q = questions[currentIndex];
  if (!q) return null;

  const goNext = () => { setCurrentIndex(i => Math.min(i + 1, questions.length - 1)); setShowAnswer(false); };
  const goPrev = () => { setCurrentIndex(i => Math.max(i - 1, 0)); setShowAnswer(false); };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      centered
      title={
        <div className="flex items-center justify-between">
          <span>Câu hỏi {currentIndex + 1} / {questions.length}</span>
          {q.bloom_level && <Tag>🧠 {q.bloom_level}</Tag>}
        </div>
      }
    >
      <div className="space-y-4">
        <Typography.Text strong style={{ fontSize: 15 }}>{q.question_text}</Typography.Text>

        <div className="space-y-2">
          {q.options?.map((opt, j) => (
            <div
              key={j}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-colors cursor-default"
              style={{
                background: showAnswer && j === q.correct_answer
                  ? 'var(--color-surface-strong)'
                  : 'var(--color-bg-card)',
                border: `1px solid ${showAnswer && j === q.correct_answer ? 'var(--color-primary)' : 'var(--color-border)'}`,
                color: showAnswer && j === q.correct_answer
                  ? 'var(--color-primary)'
                  : 'var(--color-text-primary)',
                fontWeight: showAnswer && j === q.correct_answer ? 600 : 400,
              }}
            >
              <span className="font-medium w-5 shrink-0">{String.fromCharCode(65 + j)}.</span>
              <span>{opt}</span>
              {showAnswer && j === q.correct_answer && <span style={{ marginLeft: 'auto' }}>✓</span>}
            </div>
          ))}
        </div>

        {showAnswer && q.explanation && (
          <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--color-text-secondary)' }}>
            💡 {q.explanation}
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="px-5 py-2 rounded-full text-sm border transition-colors disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
          >
            ← Trước
          </button>
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="px-6 py-2 rounded-full text-sm font-medium transition-opacity"
            style={{ background: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {showAnswer ? 'Ẩn đáp án' : 'Xem đáp án'}
          </button>
          <button
            onClick={goNext}
            disabled={currentIndex === questions.length - 1}
            className="px-5 py-2 rounded-full text-sm border transition-colors disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', cursor: currentIndex === questions.length - 1 ? 'not-allowed' : 'pointer' }}
          >
            Sau →
          </button>
        </div>
      </div>
    </Modal>
  );
}
