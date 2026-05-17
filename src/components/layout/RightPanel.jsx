/**
 * Lumiere AI — Right Panel
 * AI Outputs: Slides | Summary | Quiz
 * Reads aggregated outputs for the current conversation from Redux.
 */
import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Empty,
  Modal,
  Space,
  Spin,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message as antMessage,
} from "antd";
import {
  Presentation,
  FileText,
  HelpCircle,
  Maximize2,
  ExternalLink,
  Download,
  Layers,
  ListChecks,
} from "lucide-react";
import {
  selectConversationResult,
  selectIsGenerating,
} from "../../store/chatSlice.js";
import SlideModal from "../outputs/SlideModal.jsx";
import ContentModal from "../outputs/ContentModal.jsx";
import QuestionStudyModal from "../outputs/QuestionStudyModal.jsx";
import MarkdownRenderer from "../common/MarkdownRenderer.jsx";

const INITIAL_NOW_MS = Date.now();

const OUTPUT_TABS = [
  { id: "slide", label: "Slide", icon: Presentation },
  { id: "recap", label: "Tóm tắt", icon: FileText },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
];

function EmptyState({ icon: Icon, label, description }) {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <Space direction="vertical" size={2}>
          <Space align="center" size={6}>
            <Icon size={14} style={{ color: "var(--color-text-muted)" }} />
            <Typography.Text style={{ color: "var(--color-text-muted)" }}>
              {label}
            </Typography.Text>
          </Space>
          <Typography.Text
            style={{ color: "var(--color-text-muted)", fontSize: 12 }}
          >
            {description}
          </Typography.Text>
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
  if (diff <= 0) return "Slide đã hết hạn lưu trữ";

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `Còn ${days} ngày ${hours} giờ`;
  if (hours > 0) return `Còn ${hours} giờ ${minutes} phút`;
  return `Còn ${minutes} phút`;
}

function formatOutputCreatedAt(createdAt) {
  if (!createdAt) return "Vừa tạo";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Vừa tạo";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSelectedOutput(outputs, selectedId) {
  if (!outputs.length) return null;
  return (
    outputs.find((item) => item.id === selectedId) ||
    outputs[outputs.length - 1]
  );
}

function buildLegacySlideOutput(result) {
  if (
    !result ||
    !(
      result.presentation_id ||
      result.share_url ||
      result.slidev_markdown ||
      result.slides?.length > 0
    )
  ) {
    return null;
  }
  return {
    id: result.slide_output_id || result.presentation_id || "latest-slide",
    type: "slide",
    created_at: result.created_at,
    presentation_id: result.presentation_id || null,
    slides: result.slides || [],
    slide_count: result.slide_count ?? result.slides?.length ?? 0,
    slidev_markdown: result.slidev_markdown || "",
    share_url: result.share_url || "",
    slide_output_id: result.slide_output_id || null,
    slide_expires_at: result.slide_expires_at || null,
  };
}

function buildLegacySummaryOutput(result) {
  if (!result?.summary) return null;
  return {
    id: result.summary_output_id || "latest-summary",
    type: "summary",
    created_at: result.created_at,
    summary: result.summary,
    summary_output_id: result.summary_output_id || null,
  };
}

function buildLegacyQuizOutput(result) {
  if (!result?.questions?.length) return null;
  return {
    id: result.question_output_id || result.quiz_page_id || "latest-quiz",
    type: "question",
    created_at: result.created_at,
    questions: result.questions,
    quiz_page_id: result.quiz_page_id || null,
    question_output_id: result.question_output_id || null,
  };
}

// Badge for slide tab
export default function RightPanel() {
  const [manualTab, setManualTab] = useState({
    conversationId: null,
    tab: null,
  });
  const [localShare, setLocalShare] = useState({ outputId: null, url: null });
  const navigate = useNavigate();

  // Modal states
  const [slideModalOpen, setSlideModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [selectedQuizIndex, setSelectedQuizIndex] = useState(0);
  const [quizMode, setQuizMode] = useState("mcq");
  const [nowMs, setNowMs] = useState(INITIAL_NOW_MS);
  const [selectedOutputIds, setSelectedOutputIds] = useState({
    slide: null,
    summary: null,
    quiz: null,
  });

  const activeResult = useSelector(selectConversationResult);
  const isGenerating = useSelector(selectIsGenerating);
  const currentConversationId = useSelector(
    (state) => state.chat.currentConversationId,
  );

  const slideOutputs = useMemo(() => {
    if (!activeResult) return [];
    if (
      Array.isArray(activeResult.slide_outputs) &&
      activeResult.slide_outputs.length > 0
    ) {
      return activeResult.slide_outputs;
    }
    const legacy = buildLegacySlideOutput(activeResult);
    return legacy ? [legacy] : [];
  }, [activeResult]);

  const summaryOutputs = useMemo(() => {
    if (!activeResult) return [];
    if (
      Array.isArray(activeResult.summary_outputs) &&
      activeResult.summary_outputs.length > 0
    ) {
      return activeResult.summary_outputs;
    }
    const legacy = buildLegacySummaryOutput(activeResult);
    return legacy ? [legacy] : [];
  }, [activeResult]);

  const quizOutputs = useMemo(() => {
    if (!activeResult) return [];
    if (
      Array.isArray(activeResult.quiz_outputs) &&
      activeResult.quiz_outputs.length > 0
    ) {
      return activeResult.quiz_outputs;
    }
    const legacy = buildLegacyQuizOutput(activeResult);
    return legacy ? [legacy] : [];
  }, [activeResult]);

  const selectedSlideOutput = getSelectedOutput(
    slideOutputs,
    selectedOutputIds.slide,
  );
  const selectedSummaryOutput = getSelectedOutput(
    summaryOutputs,
    selectedOutputIds.summary,
  );
  const selectedQuizOutput = getSelectedOutput(
    quizOutputs,
    selectedOutputIds.quiz,
  );

  const slides = selectedSlideOutput?.slides || [];
  const slidevMarkdown = selectedSlideOutput?.slidev_markdown || "";
  const slideOutputId =
    selectedSlideOutput?.slide_output_id || selectedSlideOutput?.id;
  const shareUrl =
    localShare.outputId === slideOutputId
      ? localShare.url || selectedSlideOutput?.share_url || ""
      : selectedSlideOutput?.share_url || "";
  const questions = selectedQuizOutput?.questions || [];
  const summary = selectedSummaryOutput?.summary || "";

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const suggestedTab = useMemo(() => {
    if (!activeResult) return "slide";
    if (activeResult.intent === "question" && quizOutputs.length > 0) {
      return "quiz";
    }
    if (activeResult.intent === "summary" && summaryOutputs.length > 0) {
      return "recap";
    }
    if (activeResult.intent === "slide" && slideOutputs.length > 0) {
      return "slide";
    }
    return "slide";
  }, [
    activeResult,
    quizOutputs.length,
    slideOutputs.length,
    summaryOutputs.length,
  ]);

  const activeTab =
    manualTab.conversationId === currentConversationId && manualTab.tab
      ? manualTab.tab
      : suggestedTab;

  const slideBadge = slideOutputs.length > 0 ? slideOutputs.length : null;
  const quizBadge = quizOutputs.length > 0 ? quizOutputs.length : null;
  const recapBadge = summaryOutputs.length > 0 ? summaryOutputs.length : null;
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
        onRebuildComplete={(newUrl) =>
          setLocalShare({ outputId: slideOutputId, url: newUrl })
        }
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
          key={`${selectedQuizOutput?.id || "quiz"}-${selectedQuizIndex}-${quizMode}`}
          open={quizModalOpen}
          onClose={() => setQuizModalOpen(false)}
          questions={questions}
          initialIndex={selectedQuizIndex}
          initialMode={quizMode}
        />
      )}

      {/* Header */}
      <div
        className="px-4 py-3 border-b shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        <Typography.Text
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--color-text-muted)" }}
        >
          Kết quả AI
        </Typography.Text>
      </div>

      {/* Tab switcher */}
      <Tabs
        size="small"
        activeKey={activeTab}
        onChange={(tab) =>
          setManualTab({ conversationId: currentConversationId, tab })
        }
        className="pt-1 shrink-0"
        style={{ paddingInline: "12px" }}
        items={tabItems}
      />

      {/* Content area */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "8px 12px" }}>
        {isGenerating && (
          <div className="flex items-center justify-center h-20">
            <Space align="center" size={8}>
              <Spin size="small" />
              <Typography.Text
                style={{ color: "var(--color-text-muted)", fontSize: 12 }}
              >
                Đang xử lý…
              </Typography.Text>
            </Space>
          </div>
        )}

        {/* Slides tab */}
        {activeTab === "slide" &&
          !isGenerating &&
          (slideOutputs.length > 0 ? (
            <div className="space-y-3">
              <Typography.Text
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {slideOutputs.length} bài trình chiếu
              </Typography.Text>
              {[...slideOutputs].reverse().map((output, outputIndex) => {
                const outputSlides = output.slides || [];
                const outputCount = output.slide_count ?? outputSlides.length;
                const outputId = output.slide_output_id || output.id;
                const outputShareUrl =
                  localShare.outputId === outputId
                    ? localShare.url || output.share_url || ""
                    : output.share_url || "";
                const outputRemaining = formatRemainingTime(
                  output.slide_expires_at,
                  nowMs,
                );
                const openOutput = () => {
                  setSelectedOutputIds((current) => ({
                    ...current,
                    slide: output.id,
                  }));
                  if (output.presentation_id) {
                    navigate(`/presentations/${output.presentation_id}`);
                  } else {
                    setSlideModalOpen(true);
                  }
                };
                return (
                  <div
                    key={output.id || outputIndex}
                    className="rounded-xl border overflow-hidden"
                    style={{
                      background: "var(--color-bg-card)",
                      borderColor:
                        selectedSlideOutput?.id === output.id
                          ? "#7c3aed"
                          : "var(--color-border)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={openOutput}
                      className="w-full flex items-center justify-between px-4 py-3 text-left transition-all"
                      style={{ cursor: "pointer" }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: output.presentation_id
                              ? "rgba(124,58,237,0.18)"
                              : "var(--color-surface-strong)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Presentation
                            size={18}
                            style={{
                              color: output.presentation_id
                                ? "#a78bfa"
                                : "var(--color-ai-accent)",
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <Typography.Text
                            strong
                            ellipsis
                            style={{
                              color: "var(--color-text-primary)",
                              fontSize: 13,
                              display: "block",
                            }}
                          >
                            {output.presentation_id
                              ? "Mở Reveal.js Editor"
                              : outputShareUrl
                                ? "Bài trình chiếu"
                                : "Slide Markdown"}
                          </Typography.Text>
                          <Typography.Text
                            style={{
                              color: "var(--color-text-muted)",
                              fontSize: 11,
                            }}
                          >
                            {formatOutputCreatedAt(output.created_at)}
                            {outputCount ? ` · ${outputCount} slides` : ""}
                            {outputRemaining ? ` · ${outputRemaining}` : ""}
                          </Typography.Text>
                        </div>
                      </div>
                      {output.presentation_id ? (
                        <ExternalLink
                          size={15}
                          style={{ color: "#7c3aed", flexShrink: 0 }}
                        />
                      ) : (
                        <Maximize2
                          size={15}
                          style={{
                            color: "var(--color-text-muted)",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </button>
                    {outputSlides.length > 0 && (
                      <div className="px-4 pb-3 space-y-1">
                        {outputSlides.slice(0, 3).map((s, i) => (
                          <div
                            key={`${output.id}-${i}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                color: "#7c3aed",
                                fontWeight: 700,
                                background: "rgba(124,58,237,0.1)",
                                borderRadius: 4,
                                padding: "1px 5px",
                                flexShrink: 0,
                              }}
                            >
                              {i + 1}
                            </span>
                            <Typography.Text
                              ellipsis
                              style={{
                                color: "var(--color-text-secondary)",
                                fontSize: 12,
                              }}
                            >
                              {s.title || `Slide ${i + 1}`}
                            </Typography.Text>
                          </div>
                        ))}
                        {outputSlides.length > 3 && (
                          <Typography.Text
                            style={{
                              color: "var(--color-text-muted)",
                              fontSize: 11,
                            }}
                          >
                            +{outputSlides.length - 3} slides nữa...
                          </Typography.Text>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Presentation}
              label="Chưa có Slide"
              description='Yêu cầu "Tạo slide bài giảng..." để bắt đầu'
            />
          ))}

        {/* Summary tab */}
        {activeTab === "recap" &&
          !isGenerating &&
          (summaryOutputs.length > 0 ? (
            <div className="space-y-3">
              <Typography.Text
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {summaryOutputs.length} bản tóm tắt
              </Typography.Text>
              {[...summaryOutputs].reverse().map((output, outputIndex) => {
                const outputSummary = output.summary || "";
                const openOutput = () => {
                  setSelectedOutputIds((current) => ({
                    ...current,
                    summary: output.id,
                  }));
                  setSummaryModalOpen(true);
                };
                return (
                  <Card
                    key={output.id || outputIndex}
                    size="small"
                    hoverable
                    onClick={openOutput}
                    styles={{ body: { padding: 12 } }}
                    style={{
                      borderColor:
                        selectedSummaryOutput?.id === output.id
                          ? "var(--color-ai-accent)"
                          : "var(--color-border)",
                      background: "var(--color-bg-card)",
                      cursor: "pointer",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText
                          size={14}
                          style={{ color: "var(--color-ai-accent)" }}
                        />
                        <div>
                          <Typography.Text
                            strong
                            style={{
                              color: "var(--color-text-primary)",
                              fontSize: 13,
                              display: "block",
                            }}
                          >
                            Tóm tắt bài học
                          </Typography.Text>
                          <Typography.Text
                            style={{
                              color: "var(--color-text-muted)",
                              fontSize: 11,
                            }}
                          >
                            {formatOutputCreatedAt(output.created_at)}
                          </Typography.Text>
                        </div>
                      </div>
                      <Space size={4}>
                        <Tooltip title="Tải Markdown">
                          <Button
                            size="small"
                            type="text"
                            icon={<Download size={13} />}
                            onClick={(event) => {
                              event.stopPropagation();
                              const blob = new Blob([outputSummary], {
                                type: "text/markdown;charset=utf-8",
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = "tom-tat.md";
                              a.click();
                              URL.revokeObjectURL(url);
                              antMessage.success("Đã tải file .md");
                            }}
                            style={{ borderRadius: 6 }}
                          />
                        </Tooltip>
                        <Maximize2
                          size={12}
                          style={{ color: "var(--color-text-muted)" }}
                        />
                      </Space>
                    </div>
                    <MarkdownRenderer
                      className="mt-2 text-xs"
                      compact
                      style={{
                        color: "var(--color-text-secondary)",
                        maxHeight: 80,
                        overflow: "hidden",
                      }}
                    >
                      {outputSummary.length > 200
                        ? outputSummary.slice(0, 200) + "…"
                        : outputSummary}
                    </MarkdownRenderer>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              label="Chưa có tóm tắt"
              description='Yêu cầu "Tóm tắt bài học..." để tạo'
            />
          ))}

        {/* Quiz tab */}
        {activeTab === "quiz" &&
          !isGenerating &&
          (quizOutputs.length > 0 ? (
            <div className="space-y-3">
              <Typography.Text
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {quizOutputs.length} bộ quiz
              </Typography.Text>
              {[...quizOutputs].reverse().map((output, outputIndex) => {
                const outputQuestions = output.questions || [];
                const openOutput = (mode = "mcq", index = 0) => {
                  setSelectedOutputIds((current) => ({
                    ...current,
                    quiz: output.id,
                  }));
                  setSelectedQuizIndex(index);
                  setQuizMode(mode);
                  setQuizModalOpen(true);
                };
                return (
                  <Card
                    key={output.id || outputIndex}
                    size="small"
                    styles={{ body: { padding: 12 } }}
                    style={{
                      borderColor:
                        selectedQuizOutput?.id === output.id
                          ? "#10b981"
                          : "var(--color-border)",
                      background: "var(--color-bg-card)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <HelpCircle
                          size={15}
                          style={{ color: "#10b981", flexShrink: 0 }}
                        />
                        <div className="min-w-0">
                          <Typography.Text
                            strong
                            ellipsis
                            style={{
                              color: "var(--color-text-primary)",
                              fontSize: 13,
                              display: "block",
                            }}
                          >
                            Bộ câu hỏi trắc nghiệm
                          </Typography.Text>
                          <Typography.Text
                            style={{
                              color: "var(--color-text-muted)",
                              fontSize: 11,
                            }}
                          >
                            {formatOutputCreatedAt(output.created_at)} ·{" "}
                            {outputQuestions.length} câu hỏi
                          </Typography.Text>
                        </div>
                      </div>
                      {output.quiz_page_id && (
                        <Tooltip title="Mở trang Quiz">
                          <Button
                            size="small"
                            type="text"
                            icon={<ExternalLink size={13} />}
                            onClick={() =>
                              navigate(`/quiz/${output.quiz_page_id}`)
                            }
                          />
                        </Tooltip>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => openOutput("mcq")}
                        className="rounded-xl border px-3 py-3 text-left transition-colors"
                        style={{
                          background: "rgba(99,102,241,0.08)",
                          borderColor: "rgba(99,102,241,0.22)",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        <ListChecks
                          size={16}
                          style={{ color: "var(--color-ai-accent)" }}
                        />
                        <Typography.Text
                          strong
                          className="mt-2 block"
                          style={{
                            color: "var(--color-text-primary)",
                            fontSize: 12,
                          }}
                        >
                          Trắc nghiệm
                        </Typography.Text>
                        <Typography.Text
                          style={{
                            color: "var(--color-text-muted)",
                            fontSize: 11,
                          }}
                        >
                          Chọn đáp án
                        </Typography.Text>
                      </button>
                      <button
                        type="button"
                        onClick={() => openOutput("flashcard")}
                        className="rounded-xl border px-3 py-3 text-left transition-colors"
                        style={{
                          background: "rgba(16,185,129,0.08)",
                          borderColor: "rgba(16,185,129,0.24)",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        <Layers size={16} style={{ color: "#10b981" }} />
                        <Typography.Text
                          strong
                          className="mt-2 block"
                          style={{
                            color: "var(--color-text-primary)",
                            fontSize: 12,
                          }}
                        >
                          Flashcard
                        </Typography.Text>
                        <Typography.Text
                          style={{
                            color: "var(--color-text-muted)",
                            fontSize: 11,
                          }}
                        >
                          Ôn nhanh
                        </Typography.Text>
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {outputQuestions.slice(0, 4).map((q, i) => (
                        <button
                          key={`${output.id}-${i}`}
                          type="button"
                          onClick={() => openOutput("mcq", i)}
                          className="w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-left"
                          style={{
                            borderColor: "var(--color-border)",
                            background: "var(--color-bg-elevated)",
                            cursor: "pointer",
                          }}
                        >
                          <Tag
                            color="processing"
                            style={{
                              marginInlineEnd: 0,
                              flexShrink: 0,
                              fontSize: 11,
                            }}
                          >
                            Q{i + 1}
                          </Tag>
                          <Typography.Text
                            ellipsis
                            style={{
                              color: "var(--color-text-primary)",
                              flex: 1,
                              fontSize: 13,
                            }}
                          >
                            {q.question_text || q.question || q.prompt}
                          </Typography.Text>
                          <Maximize2
                            size={12}
                            style={{
                              color: "var(--color-text-muted)",
                              flexShrink: 0,
                            }}
                          />
                        </button>
                      ))}
                      {outputQuestions.length > 4 && (
                        <button
                          type="button"
                          onClick={() => openOutput("mcq")}
                          className="text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          style={{ color: "var(--color-ai-accent)" }}
                        >
                          <Maximize2 size={11} />
                          Xem tất cả {outputQuestions.length} câu hỏi
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={HelpCircle}
              label="Chưa có câu hỏi"
              description='Yêu cầu "Tạo câu hỏi trắc nghiệm..." để bắt đầu'
            />
          ))}
      </div>

      {/* Footer */}
      <div
        className="shrink-0 px-3 py-2.5 border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        <Typography.Text
          className="text-xs text-center w-full block"
          style={{ color: "var(--color-text-muted)" }}
        >
          {activeResult
            ? `${activeResult.intent} · ${((activeResult.processing_time_ms || 0) / 1000).toFixed(1)}s`
            : "Kết quả sẽ xuất hiện sau khi AI hoàn thành"}
        </Typography.Text>
      </div>
    </div>
  );
}

// ── Quiz Modal with navigation ──
function LegacyQuizModal({ open, onClose, questions, initialIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showAnswer, setShowAnswer] = useState(false);

  const q = questions[currentIndex];
  if (!q) return null;

  const goNext = () => {
    setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
    setShowAnswer(false);
  };
  const goPrev = () => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
    setShowAnswer(false);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      centered
      title={
        <div className="flex items-center justify-between">
          <span>
            Câu hỏi {currentIndex + 1} / {questions.length}
          </span>
          {q.bloom_level && <Tag>🧠 {q.bloom_level}</Tag>}
        </div>
      }
    >
      <div className="space-y-4">
        <Typography.Text strong style={{ fontSize: 15 }}>
          {q.question_text}
        </Typography.Text>

        <div className="space-y-2">
          {q.options?.map((opt, j) => (
            <div
              key={j}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-colors cursor-default"
              style={{
                background:
                  showAnswer && j === q.correct_answer
                    ? "var(--color-surface-strong)"
                    : "var(--color-bg-card)",
                border: `1px solid ${showAnswer && j === q.correct_answer ? "var(--color-primary)" : "var(--color-border)"}`,
                color:
                  showAnswer && j === q.correct_answer
                    ? "var(--color-primary)"
                    : "var(--color-text-primary)",
                fontWeight: showAnswer && j === q.correct_answer ? 600 : 400,
              }}
            >
              <span className="font-medium w-5 shrink-0">
                {String.fromCharCode(65 + j)}.
              </span>
              <span>{opt}</span>
              {showAnswer && j === q.correct_answer && (
                <span style={{ marginLeft: "auto" }}>✓</span>
              )}
            </div>
          ))}
        </div>

        {showAnswer && q.explanation && (
          <div
            className="p-3 rounded-lg text-sm"
            style={{
              background: "rgba(99,102,241,0.08)",
              color: "var(--color-text-secondary)",
            }}
          >
            💡 {q.explanation}
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="px-5 py-2 rounded-full text-sm border transition-colors disabled:opacity-40"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
              cursor: currentIndex === 0 ? "not-allowed" : "pointer",
            }}
          >
            ← Trước
          </button>
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="px-6 py-2 rounded-full text-sm font-medium transition-opacity"
            style={{
              background: "var(--color-primary)",
              color: "white",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {showAnswer ? "Ẩn đáp án" : "Xem đáp án"}
          </button>
          <button
            onClick={goNext}
            disabled={currentIndex === questions.length - 1}
            className="px-5 py-2 rounded-full text-sm border transition-colors disabled:opacity-40"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
              cursor:
                currentIndex === questions.length - 1
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Sau →
          </button>
        </div>
      </div>
    </Modal>
  );
}
