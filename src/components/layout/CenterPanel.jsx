/**
 * Lumiere AI — Center Panel
 * Chat messages + Agent Progress + Chat Input
 *
 * Uses POST /api/generate (non-streaming) + Socket.IO for real-time progress.
 */
import { useEffect, useMemo, useRef, useState, useCallback, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Carousel, Collapse, Flex, Form, Input, InputNumber, Modal, Select, Segmented, Space, Typography } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Paperclip, Loader2, UploadCloud, Presentation, FileText, ListChecks, Check, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { uploadService } from "../../services/uploadService.js";
import { slideTemplateService } from "../../services/slideTemplateService.js";
import { getSocket, joinSession } from "../../services/socketClient.js";
import {
  buildSlideDisplayMessage,
  buildSummaryDisplayMessage,
  buildQuestionDisplayMessage,
} from "../../lib/slideRequestMapping.js";
import { notify } from "../common/Notifications.jsx";
import ActivityTracePanel from "../cot/ActivityTracePanel.jsx";
import OutlineDeckModal from "../cot/OutlineDeckModal.jsx";
import { confirmOutline, clearPendingOutline } from "../../store/chatSlice.js";
import {
  addUserMessage,
  addAgentProgress,
  clearAgentProgress,
  generateContent,
  fetchConversations,
  selectMessages,
  selectAgentProgress,
  selectIsGenerating,
} from "../../store/chatSlice.js";

const SUPPORTED_UPLOAD_EXTENSIONS = [".pdf", ".docx", ".pptx", ".xlsx", ".txt", ".md"];

const SUPPORTED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/markdown",
]);

const { TextArea } = Input;
const DocumentReviewModal = lazy(() => import("../outputs/DocumentReviewModal.jsx"));

function svgText(value) {
  return String(value || "Template")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function templateFallbackPreview(template) {
  const name = svgText(template?.name);
  const scheme = template?.scheme === "dark" ? "dark" : "light";
  const bg = scheme === "dark" ? "#111827" : "#f8fafc";
  const fg = scheme === "dark" ? "#f8fafc" : "#111827";
  const accent = scheme === "dark" ? "#38bdf8" : "#4f46e5";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600"><rect width="960" height="600" fill="${bg}"/><rect x="56" y="56" width="848" height="488" rx="28" fill="none" stroke="${accent}" stroke-width="8"/><circle cx="798" cy="132" r="54" fill="${accent}" opacity=".22"/><rect x="96" y="132" width="360" height="26" rx="13" fill="${accent}" opacity=".35"/><text x="96" y="285" font-family="Inter,Arial,sans-serif" font-size="62" font-weight="800" fill="${fg}">${name}</text><text x="96" y="348" font-family="Inter,Arial,sans-serif" font-size="28" fill="${fg}" opacity=".62">Preview image unavailable</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const ACTION_LABELS = {
  slide: "Tạo Slide",
  summary: "Tạo Summary",
  question: "Tạo Question",
};

const PROMPT_PRESETS = [
  { label: "Tạo Slide", icon: Presentation },
  { label: "Tạo Summary", icon: FileText },
  { label: "Tạo Question", icon: ListChecks },
];

const ACTION_BUTTONS = [
  {
    type: "slide",
    label: "Tạo Slide",
    description: "Thiết kế bài giảng theo phong cách Gamma",
    icon: Presentation,
  },
  {
    type: "summary",
    label: "Tạo Summary",
    description: "Tóm tắt nhanh, mạch lạc như NotebookLM",
    icon: FileText,
  },
  {
    type: "question",
    label: "Tạo Question",
    description: "Sinh bộ câu hỏi theo Bloom và độ khó",
    icon: ListChecks,
  },
];

const defaultActionValues = {
  slide: {
    topic: "",
    extraRequirement: "",
    audience: "hocsinh-thcs",
    slideCount: 12,
    slideTemplateSlug: "daisy-days",
    slideContentDepth: "detailed",

    imageSource: "ai",
    interactionMode: "after-each-section",
    interactionTypes: ["mcq-checkpoint", "fill-blank"],
  },
  summary: {
    topic: "",
    extraRequirement: "",
    format: "bullet",
    length: "medium",
  },
  question: {
    topic: "",
    extraRequirement: "",
    questionCount: 8,
    difficulty: "mixed",
    bloomLevel: "mixed",
  },
};

function buildSlideRequestPayload(values) {
  return {
    topic: values.topic?.trim() || "",
    extra_requirements: values.extraRequirement?.trim() || "",
    audience: values.audience || "thcs",
    slide_template_slug: values.slideTemplateSlug || "daisy-days",
    slide_count: values.slideCountMode === "custom" ? values.slideCount : null,

    image_source: values.imageSource || "ai",
    animation_style: values.animationStyle || "none",
    interaction_mode: values.interactionMode || "after-each-section",
    interaction_types: values.interactionTypes || [],
  };
}

function isSupportedUploadFile(file) {
  if (!file) return false;
  if (SUPPORTED_UPLOAD_MIME_TYPES.has(file.type)) return true;
  const lowerName = file.name?.toLowerCase() ?? "";
  return SUPPORTED_UPLOAD_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

// ── Socket session ID (stable per tab) ──
const SESSION_ID = `session-${Date.now()}`;

export default function CenterPanel() {
  const dispatch = useDispatch();
  const messages = useSelector(selectMessages);
  const agentProgress = useSelector(selectAgentProgress);
  const isGenerating = useSelector(selectIsGenerating);
  const pendingOutline = useSelector((state) => state.chat.pendingOutline);
  const pendingSessionInfo = useSelector((state) => state.chat.pendingSessionInfo);

  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedUpload, setParsedUpload] = useState(null); // { filename, file_key, markdown }
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState("slide");
  const [slideTemplates, setSlideTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [actionForm] = Form.useForm();
  const dragDepthRef = useRef(0);
  const previewCarouselRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Setup Socket.IO for progress events ──
  useEffect(() => {
    const socket = getSocket();
    joinSession(SESSION_ID);

    const handleProgress = (data) => {
      dispatch(addAgentProgress(data));
    };

    socket.on("agent_progress", handleProgress);

    return () => {
      socket.off("agent_progress", handleProgress);
    };
  }, [dispatch]);

  // Auto-scroll on new messages/progress
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentProgress, isGenerating]);

  useEffect(() => {
    if (!actionModalOpen || actionType !== "slide" || slideTemplates.length > 0) return;
    let alive = true;
    setTemplatesLoading(true);
    setTemplatesError("");
    slideTemplateService
      .list()
      .then((items) => {
        if (alive) setSlideTemplates(Array.isArray(items) ? items : []);
      })
      .catch((error) => {
        console.warn("Failed to load slide templates", error);
        if (alive) setTemplatesError("Khong tai duoc template preview. Vui long thu lai.");
      })
      .finally(() => {
        if (alive) setTemplatesLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [actionModalOpen, actionType, slideTemplates.length]);

  const currentConversationId = useSelector((state) => state.chat.currentConversationId);

  const previewUrls = useMemo(() => {
    if (!previewTemplate) return [];
    const urls = (previewTemplate.preview_urls || []).slice(0, 3);
    return urls.length ? urls : [templateFallbackPreview(previewTemplate)];
  }, [previewTemplate]);

  const sendMessage = useCallback(
    async (message, {
      mode,

      imageSource,
      animationStyle,
      slideTemplateSlug,
      slideContentDepth,
      slideCount,
      slideRequest,
      outputFormat,
      quizTheme,
      difficulty,
      bloomLevel,
    } = {}) => {
      if (!message || isGenerating) return;

      dispatch(addUserMessage(message));
      dispatch(clearAgentProgress());

      try {
        await dispatch(
          generateContent({
            content: message,
            sessionId: SESSION_ID,
            conversationId: currentConversationId,
            mode,

            imageSource,
            animationStyle,
            slideTemplateSlug,
            slideContentDepth,
            slideCount,
            slideRequest,
            outputFormat,
            quizTheme,
            difficulty,
            bloomLevel,
          })
        ).unwrap();
      } catch {
        // Error state is handled inside generateContent.
      }

      dispatch(fetchConversations());
    },
    [currentConversationId, dispatch, isGenerating]
  );

  // ── Send message ──
  const handleSend = useCallback(async () => {
    const message = input.trim();
    if (!message || isGenerating) return;

    setInput("");
    await sendMessage(message);
  }, [input, isGenerating, sendMessage]);

  const openActionModal = (type) => {
    setActionType(type);
    actionForm.setFieldsValue(defaultActionValues[type]);
    setActionModalOpen(true);
  };

  const handleConfirmOutline = async (editedOutline) => {
    if (!pendingSessionInfo) return;
    // Close modal immediately so user can see CoT progress
    const sessionInfo = { ...pendingSessionInfo };
    dispatch(clearPendingOutline());
    dispatch(confirmOutline({
      ...sessionInfo,
      outline: editedOutline
    }));
  };

  const handleActionSubmit = async () => {
    const values = await actionForm.validateFields();

    let displayMessage;
    let slideRequest;

    let imageSource;
    let animationStyle;
    let slideTemplateSlug;
    let slideContentDepth;
    let slideCount;
    let outputFormat;
    let quizTheme;
    let difficulty;
    let bloomLevel;

    if (actionType === "slide") {
      const selectedTemplate = slideTemplates.find((t) => t.slug === values.slideTemplateSlug);
      displayMessage = buildSlideDisplayMessage(values, selectedTemplate?.name);
      slideRequest = buildSlideRequestPayload(values);

      imageSource = values.imageSource;
      animationStyle = values.animationStyle || "none";
      slideTemplateSlug = values.slideTemplateSlug || "daisy-days";
      slideContentDepth = "detailed";
      slideCount = values.slideCountMode === "custom" ? values.slideCount : undefined;
    } else if (actionType === "summary") {
      displayMessage = buildSummaryDisplayMessage(values);
    } else {
      displayMessage = buildQuestionDisplayMessage(values);
      outputFormat = "interactive-html";
      quizTheme = values.quizTheme || "modern-dark";
      difficulty = values.difficulty || "mixed";
      bloomLevel = values.bloomLevel || "mixed";
    }

    setActionModalOpen(false);
    actionForm.resetFields();
    await sendMessage(displayMessage, {
      mode: actionType,

      imageSource,
      animationStyle,
      slideTemplateSlug,
      slideContentDepth,
      slideCount,
      slideRequest,
      outputFormat,
      quizTheme,
      difficulty,
      bloomLevel,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── File upload (Step 1: Parse) ──
  const handleFileUpload = async (file) => {
    if (!isSupportedUploadFile(file)) {
      alert("Hỗ trợ: PDF, DOCX, PPTX, XLSX, TXT, MD");
      return;
    }

    setIsUploading(true);
    // Auto-switch to Wiki tab and show loading item with filename
    window.dispatchEvent(new CustomEvent('switch-wiki-tab', { detail: { filename: file.name } }));

    const notifKey = notify.uploadStart(file.name);

    try {
      const result = await uploadService.uploadFileForParse(file, true);
      setParsedUpload({
        filename: result.filename,
        file_key: result.file_key,
        markdown: result.markdown,
      });
      notify.uploadSuccess(notifKey, result.filename, result.chunks_created || 'nhiều');
    } catch (error) {
      console.error("Upload failed:", error);
      notify.uploadError(error.message, notifKey);
      dispatch(addAgentProgress({
        node: "upload",
        message: `Lỗi upload: ${error.message}`,
        timestamp: new Date().toISOString(),
      }));
    } finally {
      setIsUploading(false);
      // Clear loading item in LeftPanel
      window.dispatchEvent(new CustomEvent('upload-wiki-done'));
    }
  };

  // ── File upload (Step 2: Confirm) ──
  const handleConfirmUpload = async (filename, file_key, markdownContent) => {
    try {
      await uploadService.editUpload(filename, file_key, markdownContent);
      await uploadService.confirmUpload(filename, file_key, markdownContent);
      dispatch(addUserMessage(`📎 Đã tải lên và xác nhận: ${filename}`));
      setParsedUpload(null);
    } catch (error) {
      console.error("Confirm failed:", error);
      notify.uploadError(error.message);
      alert("Lỗi khi xử lý đoạn tài liệu: " + error.message);
    }
  };

  const handleCancelUpload = async () => {
    if (parsedUpload) {
      try {
        await uploadService.cancelUpload(parsedUpload.file_key);
        dispatch(addAgentProgress({
          node: "upload",
          message: `🚫 Đã hủy tải lên tài liệu ${parsedUpload.filename}`,
          timestamp: new Date().toISOString(),
        }));
      } catch (e) {
        console.error("Cancel failed:", e);
      }
      setParsedUpload(null);
    }
  };

  // ── Drag & Drop ──
  const hasDraggedFiles = (e) => e.dataTransfer?.types?.includes?.("Files");

  const handleDragEnter = (e) => {
    e.preventDefault();
    if (!hasDraggedFiles(e)) return;
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!hasDraggedFiles(e)) return;
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!hasDraggedFiles(e)) return;
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full bg-transparent relative">
      <OutlineDeckModal
        open={Boolean(pendingOutline)}
        outlineData={pendingOutline}
        onConfirm={handleConfirmOutline}
        onCancel={() => dispatch(clearPendingOutline())}
        loading={isGenerating}
      />

      <Modal
        title={ACTION_LABELS[actionType]}
        open={actionModalOpen}
        onCancel={() => setActionModalOpen(false)}
        onOk={handleActionSubmit}
        okText="Tạo ngay"
        cancelText="Hủy"
        okButtonProps={{
          loading: isGenerating,
          style: { borderRadius: 9999, fontWeight: 500 },
        }}
        cancelButtonProps={{
          style: { borderRadius: 9999 },
        }}
        width={720}
        centered
        destroyOnClose>
        <Form form={actionForm} layout="vertical" initialValues={defaultActionValues[actionType]}>
          <Form.Item
            name="topic"
            label="Chủ đề"
            rules={[{ required: true, message: "Vui lòng nhập chủ đề" }]}
          >
            <TextArea rows={2} placeholder="Ví dụ: Sóng âm - Vật lí 12" />
          </Form.Item>

          <Form.Item name="extraRequirement" label="Yêu cầu thêm" tooltip="Không bắt buộc. Có thể ghi mục tiêu bài học, phạm vi kiến thức hoặc lưu ý của giáo viên.">
            <TextArea rows={2} placeholder="Ví dụ: nhấn mạnh công thức, ứng dụng thực tế và lỗi học sinh hay nhầm" />
          </Form.Item>

          {actionType === "slide" && (
            <>
            <Space style={{ width: "100%" }} size={12} wrap align="start">
              <Form.Item name="audience" label="Đối tượng học" style={{ minWidth: 220, flex: 1 }}>
                <Select
                  options={[
                    { value: "hocsinh-th", label: "Học sinh tiểu học" },
                    { value: "hocsinh-thcs", label: "Học sinh THCS" },
                    { value: "hocsinh-thpt", label: "Học sinh THPT" },
                    { value: "sinhvien", label: "Sinh viên" },
                    { value: "giaovien", label: "Giáo viên" },
                  ]}
                />
              </Form.Item>
              <Form.Item name="imageSource" label="Nguồn ảnh" style={{ minWidth: 260, flex: 1 }}>
                <Segmented
                  block
                  options={[
                    { value: "ai", label: "GPT Image 2" },
                    { value: "web", label: "Web" },
                  ]}
                />
              </Form.Item>
            </Space>

            <Form.Item name="slideTemplateSlug" hidden>
              <Input />
            </Form.Item>
            <Form.Item label="Template slide">
              <Form.Item shouldUpdate noStyle>
                {({ getFieldValue, setFieldValue }) => {
                  const selectedSlug = getFieldValue("slideTemplateSlug") || "daisy-days";
                  return (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                        gap: 12,
                        maxHeight: 420,
                        overflowY: "auto",
                        paddingRight: 4,
                      }}
                    >
                      {templatesLoading && <div style={{ color: "#94a3b8", padding: 12 }}>Dang tai template preview...</div>}
                      {!templatesLoading && templatesError && <div style={{ color: "#fca5a5", padding: 12 }}>{templatesError}</div>}
                      {!templatesLoading && !templatesError && slideTemplates.length === 0 && (
                        <div style={{ color: "#94a3b8", padding: 12 }}>Chua co template preview.</div>
                      )}
                      {!templatesLoading && slideTemplates.map((template) => {
                        const selected = selectedSlug === template.slug;
                        const previewUrl = template.preview_urls?.[0];
                        return (
                          <Card
                            key={template.slug}
                            hoverable
                            onClick={() => setFieldValue("slideTemplateSlug", template.slug)}
                            styles={{ body: { padding: 12 } }}
                            style={{
                              borderRadius: 8,
                              border: selected ? "2px solid #4f46e5" : "1px solid rgba(15,23,42,.14)",
                              background: selected ? "#eef2ff" : "#ffffff",
                              overflow: "hidden",
                              boxShadow: selected ? "0 10px 30px rgba(79,70,229,.16)" : "0 8px 22px rgba(15,23,42,.08)",
                            }}
                            cover={
                              <img
                                src={previewUrl || templateFallbackPreview(template)}
                                alt={template.name}
                                onError={(event) => {
                                  event.currentTarget.onerror = null;
                                  event.currentTarget.src = templateFallbackPreview(template);
                                }}
                                style={{ width: "100%", aspectRatio: "16 / 10", objectFit: "cover", background: "#f8fafc" }}
                              />
                            }
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 800, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {template.name}
                                </div>
                                <div style={{ fontSize: 12, color: "#475569", minHeight: 52, lineHeight: 1.4, marginTop: 4 }}>
                                  {template.tagline}
                                </div>
                              </div>
                              {selected && <Check size={18} color="#4f46e5" />}
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                              {[template.scheme, template.density].filter(Boolean).map((tag) => (
                                <span key={tag} style={{ fontSize: 11, color: "#334155", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 999, padding: "2px 7px" }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <Button
                              size="small"
                              icon={<Eye size={14} />}
                              onClick={(event) => {
                                event.stopPropagation();
                                setPreviewTemplate(template);
                              }}
                              style={{ marginTop: 10, width: "100%", borderRadius: 6 }}
                            >
                              Xem preview
                            </Button>
                          </Card>
                        );
                      })}
                    </div>
                  );
                }}
              </Form.Item>
            </Form.Item>
            </>
          )}

          <Collapse
            ghost
            items={[
              {
                key: "advanced",
                label: "Tùy chọn nâng cao",
                children: (
                  <>
                    {actionType === "slide" && (
                      <>
                        <Space style={{ width: "100%" }} size={12} wrap>
                          <Form.Item
                            name="slideCountMode"
                            label="Số slide"
                            initialValue="auto"
                          >
                            <Select
                              options={[
                                { value: "auto", label: "🤖 AI tự động chọn" },
                                { value: "custom", label: "✍️ Tự nhập" },
                              ]}
                            />
                          </Form.Item>

                          <Form.Item shouldUpdate noStyle>
                            {({ getFieldValue }) =>
                              getFieldValue("slideCountMode") === "custom" ? (
                                <Form.Item
                                  name="slideCount"
                                  label="Nhập số slide"
                                  initialValue={10}
                                >
                                  <InputNumber
                                    min={5}
                                    max={30}
                                    style={{ width: "100%" }}
                                  />
                                </Form.Item>
                              ) : null
                            }
                          </Form.Item>

                        </Space>
                        <Form.Item initialValue="auto" name="animationStyle" label="Animation minh hoạ" tooltip="AI sẽ tạo animation giải thích khái niệm theo phong cách này. Chỉ animation hoạt động đúng mới được hiển thị.">
                          <Select
                            options={[
                              { value: "none", label: "Không có animation" },
                              { value: "auto", label: "Tự động chọn phù hợp" },
                              { value: "science-sim", label: "🔬 Mô phỏng khoa học (sóng, lực, phân tử)" },
                              { value: "diagram-draw", label: "📊 Vẽ biểu đồ / sơ đồ" },
                              { value: "timeline", label: "📅 Timeline / Tiến trình" },
                              { value: "mind-map", label: "🧠 Mind-map mở rộng" },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item name="interactionMode" label="Chế độ tương tác">
                          <Select
                            options={[
                              { value: "after-each-section", label: "Sau mỗi phần" },
                              { value: "after-2-3-sections", label: "Sau 2-3 phần" },
                              { value: "end-only", label: "Cuối bài" },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item name="interactionTypes" label="Loại tương tác">
                          <Select
                            mode="multiple"
                            maxTagCount="responsive"
                            options={[
                              { value: "mcq-checkpoint", label: "Trắc nghiệm nhanh" },
                              { value: "fill-blank", label: "Điền chỗ trống" },
                              { value: "true-false", label: "Đúng / Sai" },
                              { value: "drag-drop", label: "Kéo thả ghép đôi" },
                              { value: "scenario", label: "Tình huống thực tế" },
                            ]}
                          />
                        </Form.Item>
                      </>
                    )}

                    {actionType === "summary" && (
                      <Space style={{ width: "100%" }} size={12} wrap>
                        <Form.Item name="format" label="Định dạng" style={{ minWidth: 180, flex: 1 }}>
                          <Select
                            options={[
                              { value: "bullet", label: "Bullet points" },
                              { value: "outline", label: "Dàn ý" },
                              { value: "teaching-note", label: "Ghi chú giảng dạy" },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item name="length" label="Độ dài" style={{ minWidth: 180, flex: 1 }}>
                          <Select
                            options={[
                              { value: "short", label: "Ngắn" },
                              { value: "medium", label: "Vừa" },
                              { value: "long", label: "Chi tiết" },
                            ]}
                          />
                        </Form.Item>
                      </Space>
                    )}

                    {actionType === "question" && (
                      <Space style={{ width: "100%" }} size={12} wrap>
                        <Form.Item name="questionCount" label="Số câu hỏi" style={{ minWidth: 160, flex: 1 }}>
                          <InputNumber min={3} max={20} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item name="difficulty" label="Độ khó" style={{ minWidth: 180, flex: 1 }}>
                          <Select
                            options={[
                              { value: "easy", label: "Dễ" },
                              { value: "medium", label: "Trung bình" },
                              { value: "hard", label: "Khó" },
                              { value: "mixed", label: "Trộn mức độ" },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item name="bloomLevel" label="Bloom" style={{ minWidth: 180, flex: 1 }}>
                          <Select
                            options={[
                              { value: "remember-understand", label: "Nhớ / Hiểu" },
                              { value: "apply-analyze", label: "Vận dụng / Phân tích" },
                              { value: "evaluate-create", label: "Đánh giá / Sáng tạo" },
                              { value: "mixed", label: "Trộn Bloom" },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item name="quizTheme" label="Giao diện Quiz" style={{ minWidth: 200, flex: 1 }} tooltip="Trang quiz Quizlet-style được tạo ra sau khi generate">
                          <Select
                            options={[
                              { value: "modern-dark", label: "🌙 Modern Dark" },
                              { value: "clean-light", label: "☀️ Clean Light" },
                              { value: "playful", label: "🎨 Playful (màu sắc)" },
                            ]}
                          />
                        </Form.Item>
                      </Space>
                    )}
                  </>
                ),
              },
            ]}
          />
        </Form>
        <div
          className="mt-2 pt-3 text-xs"
          style={{
            borderTop: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-muted)',
          }}
        >
          💡 AI sẽ tự tổng hợp các lựa chọn của bạn thành prompt tối ưu nhất.
        </div>
      </Modal>

      <Modal
        title={previewTemplate?.name || "Template preview"}
        open={Boolean(previewTemplate)}
        onCancel={() => setPreviewTemplate(null)}
        footer={null}
        width={920}
        centered
      >
        {previewTemplate && (
          <div>
            <p style={{ color: "#94a3b8", marginTop: 0 }}>{previewTemplate.tagline}</p>
            <div style={{ position: "relative" }}>
              <Carousel ref={previewCarouselRef} autoplay autoplaySpeed={2600} dots dotPosition="bottom">
                {previewUrls.map((url, index) => (
                  <div key={`${previewTemplate.slug}-${index}`}>
                    <div style={{ padding: "0 6px 24px" }}>
                      <img
                        src={url}
                        alt={`${previewTemplate.name} preview ${index + 1}`}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = templateFallbackPreview(previewTemplate);
                        }}
                        style={{
                          width: "100%",
                          maxHeight: "58vh",
                          objectFit: "contain",
                          borderRadius: 8,
                          background: "#f8fafc",
                          border: "1px solid rgba(148,163,184,.28)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </Carousel>
              {previewUrls.length > 1 && (
                <>
                  <Button
                    shape="circle"
                    icon={<ChevronLeft size={20} />}
                    aria-label="Previous preview"
                    onClick={() => previewCarouselRef.current?.prev()}
                    style={{
                      position: "absolute",
                      left: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 3,
                      width: 40,
                      height: 40,
                      boxShadow: "0 8px 24px rgba(15,23,42,.24)",
                    }}
                  />
                  <Button
                    shape="circle"
                    icon={<ChevronRight size={20} />}
                    aria-label="Next preview"
                    onClick={() => previewCarouselRef.current?.next()}
                    style={{
                      position: "absolute",
                      right: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 3,
                      width: 40,
                      height: 40,
                      boxShadow: "0 8px 24px rgba(15,23,42,.24)",
                    }}
                  />
                </>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <Button
                type="primary"
                icon={<Check size={15} />}
                onClick={() => {
                  actionForm.setFieldValue("slideTemplateSlug", previewTemplate.slug);
                  setPreviewTemplate(null);
                }}
              >
                Chon template nay
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Document Review Modal ── */}
      {parsedUpload && (
        <Suspense
          fallback={
            <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: "var(--color-bg-elevated)" }}>
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-ai-accent)" }} />
            </div>
          }
        >
          <DocumentReviewModal
            parsedDoc={parsedUpload}
            onConfirm={handleConfirmUpload}
            onCancel={handleCancelUpload}
          />
        </Suspense>
      )}

      {/* ── Messages area ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4" data-tour="chat">
        {messages.length === 0 && !isGenerating && (
          <div className="empty-state-container">
            <div
              className="shrink-0 flex items-center justify-center mb-6"
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "var(--color-surface-strong)",
                border: "1px solid var(--color-border)",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ display: "block", flexShrink: 0 }}
              >
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
              </svg>
            </div>
            <h3
              className="text-2xl mb-2"
              style={{ 
                fontFamily: "var(--font-display)", 
                color: "var(--color-text-primary)",
                fontWeight: 300,
                letterSpacing: "-0.3px"
              }}
            >
              Lumiere AI sẵn sàng hỗ trợ
            </h3>
            <p
              className="text-sm max-w-xs mb-8"
              style={{ color: "var(--color-text-muted)", lineHeight: 1.6 }}
            >
              Q/A trực tiếp ở khung chat. Tạo Slide/Summary/Question bằng cấu hình nhanh như NotebookLM + Gamma.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl px-4">
              {ACTION_BUTTONS.map(({ type, label, description, icon: Icon }) => (
                <Card
                  key={type}
                  hoverable
                  onClick={() => openActionModal(type)}
                  style={{ 
                    borderColor: "var(--color-border)", 
                    textAlign: "left",
                    borderRadius: "var(--radius-xl)",
                    background: "var(--color-bg-card)"
                  }}
                  styles={{ body: { padding: 20 } }}
                >
                  <Space direction="vertical" size={6}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: 'var(--color-surface-strong)' }}>
                      <Icon size={16} color="var(--color-primary)" />
                    </div>
                    <Typography.Text strong style={{ fontSize: 16 }}>{label}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                      {description}
                    </Typography.Text>
                  </Space>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} fade-in`}
          >
            <div
              className={`max-w-[75%] px-4 py-3 text-sm ${msg.role === "user" ? "bubble-user" : "bubble-ai"}`}
            >
              {msg.role === "user" ? (
                <p>{msg.content}</p>
              ) : (
                <div>
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Show inline outputs (questions/slides) */}
                  {msg.outputs?.questions && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-ai-accent)' }}>
                        📝 Câu hỏi trắc nghiệm ({msg.outputs.questions.length})
                      </p>
                      {msg.outputs.questions.map((q, i) => (
                        <div key={i} className="mb-3 text-xs">
                          <p className="font-medium mb-1">
                            <span className="opacity-50">Q{i + 1}.</span> {q.question_text}
                          </p>
                          <div className="pl-3 space-y-0.5">
                            {q.options?.map((opt, j) => (
                              <p
                                key={j}
                                className={j === q.correct_answer ? "font-semibold" : "opacity-70"}
                                style={j === q.correct_answer ? { color: 'var(--color-ai-accent)' } : {}}
                              >
                                {opt} {j === q.correct_answer && "✓"}
                              </p>
                            ))}
                          </div>
                          {q.explanation && (
                            <p className="pl-3 mt-1 opacity-60 italic">{q.explanation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Slide output — ưu tiên Reveal.js Editor */}
                  {(msg.outputs?.presentation_id || msg.outputs?.slides) && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                      {msg.outputs?.presentation_id ? (
                        /* ── Reveal.js Editor button ── */
                        <a
                          href={`/presentations/${msg.outputs.presentation_id}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', borderRadius: 10,
                            background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(79,70,229,0.12))',
                            border: '1px solid rgba(124,58,237,0.5)',
                            color: '#a78bfa', textDecoration: 'none',
                            fontSize: 13, fontWeight: 600,
                          }}
                        >
                          <span style={{ fontSize: 16 }}>🎯</span>
                          <div style={{ flex: 1 }}>
                            <div>Mở Reveal.js Editor</div>
                            {msg.outputs.slides?.length > 0 && (
                              <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 400, marginTop: 2 }}>
                                {msg.outputs.slides.length} slides · WYSIWYG · Export PDF/PPTX
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: 16 }}>→</span>
                        </a>
                      ) : (
                        /* ── Fallback: slide list (khi không có presentation_id) ── */
                        <>
                          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-ai-accent)' }}>
                            📊 Slide bài giảng ({msg.outputs.slides.length})
                          </p>
                          {msg.outputs.slides.slice(0, 3).map((s, i) => (
                            <div key={i} className="mb-1 p-2 rounded-lg text-xs" style={{ background: 'var(--color-bg-elevated)' }}>
                              <p className="font-semibold">{s.slide_number}. {s.title}</p>
                            </div>
                          ))}
                          {msg.outputs.slides.length > 3 && (
                            <p className="text-xs opacity-50">+{msg.outputs.slides.length - 3} slides nữa...</p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Processing time badge */}
                  {msg.processingTime && (
                    <p className="text-xs mt-2 opacity-40">
                      ⏱ {(msg.processingTime / 1000).toFixed(1)}s · {msg.intent}
                    </p>
                  )}
                  {msg.cot_log?.length > 0 && (
                    <div className="mt-3">
                      <ActivityTracePanel steps={msg.cot_log} defaultCollapsed />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Generating indicator with progress */}
        {isGenerating && (
          <div className="flex flex-col gap-2 fade-in">
            {/* Agent progress steps */}
            {agentProgress.length > 0 && (
              <ActivityTracePanel steps={agentProgress} defaultCollapsed={false} isLive />
            )}

            {/* Typing indicator */}
            <div className="flex justify-start">
              <div className="max-w-[75%] px-4 py-3 text-sm bubble-ai">
                <div className="flex items-center gap-1.5 py-1">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Chat Input ── */}
      <div
        className="shrink-0 border-t glass-panel relative z-10"
        style={{ borderColor: "var(--color-border)" }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="px-4 pt-4 pb-0 relative">
          {/* Drag Overlay */}
          {isDragging && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl overflow-hidden"
              style={{
                background: "var(--color-bg-card)",
                opacity: 0.95,
                border: "2px dashed var(--color-primary)",
              }}
            >
              <div className="flex flex-col items-center justify-center gap-2"
                   style={{ color: "var(--color-primary)" }}>
                <UploadCloud size={32} />
                <span className="font-semibold text-sm">Thả tài liệu vào đây</span>
              </div>
            </div>
          )}

          {/* Prompt Presets — open structured modal */}
          <div className="flex flex-wrap gap-2 mb-3">
            {ACTION_BUTTONS.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => openActionModal(type)}
                disabled={isGenerating || isUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all duration-150"
                style={{
                  background: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (!isGenerating && !isUploading) {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                <Icon size={12} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div
            className="flex items-end gap-2 rounded-2xl border pl-4 pr-2 py-3 transition-all duration-150 shadow-sm"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
            }}
          >
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.docx,.pptx,.xlsx,.txt,.md"
              className="hidden"
              onChange={(e) => {
                if (e.target.files.length > 0) handleFileUpload(e.target.files[0]);
                e.target.value = null;
              }}
            />

            {/* File attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isGenerating}
              className={`shrink-0 w-8 h-8 flex items-center justify-center cursor-pointer transition-colors duration-150 rounded-full hover:bg-zinc-100 ${isUploading ? "opacity-50" : ""}`}
              style={{ color: "var(--color-text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
              title="Upload tài liệu"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={18} />}
            </button>

            {/* Input textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isUploading ? "Đang xử lý tài liệu..." :
                isGenerating ? "AI đang xử lý..." :
                "Nhập câu hỏi hoặc kéo thả tài liệu..."
              }
              rows={1}
              disabled={isGenerating || isUploading}
              className="flex-1 resize-none text-[15px] outline-none bg-transparent leading-relaxed disabled:opacity-50 py-1"
              style={{
                color: "var(--color-text-primary)",
                maxHeight: "120px",
                minHeight: "28px",
                fontFamily: 'var(--font-body)',
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating || isUploading}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--color-primary)", color: "white" }}
              onMouseEnter={(e) => !isGenerating && !isUploading && (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <Flex justify="center" style={{ marginTop: '4px' }}>
            <Typography.Text type="secondary" style={{ fontSize: '11px', lineHeight: 1 }}>
              Enter để gửi · Shift+Enter xuống dòng · {isUploading ? "Đang Upload…" : "Kéo thả file"}
            </Typography.Text>
          </Flex>
        </div>
      </div>
    </div>
  );
}
