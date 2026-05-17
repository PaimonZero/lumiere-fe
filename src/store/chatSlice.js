/**
 * Lumiere AI — Redux Store: Chat Slice
 * Manages chat messages, AI generation state, and progress events.
 */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { generateService } from "../services/generateService";
import { conversationService } from "../services/conversationService";
import { outlineService } from "../services/outlineService";

function normalizeTraceEvent(step, index = 0) {
  if (typeof step === "string") {
    return {
      id: `trace_${Date.now()}_${index}`,
      status: "running",
      title: step,
      message: step,
      phase: "log",
      timestamp: new Date().toISOString(),
    };
  }
  const item = step || {};
  const message = item.message || item.title || item.error || "";
  return {
    id: item.id || `${item.timestamp || Date.now()}_${index}`,
    status: item.status || (item.error ? "error" : "running"),
    title: item.title || message || item.node || "Dang xu ly",
    message,
    phase: item.phase || item.node || "log",
    type: item.type || "log",
    tool: item.tool || "",
    metadata: item.metadata || {},
    timestamp: item.timestamp || new Date().toISOString(),
    node: item.node || "",
  };
}

function traceStartsWith(trace = [], prefix = []) {
  if (!prefix.length || trace.length < prefix.length) return false;
  return prefix.every((step, index) => {
    const candidate = trace[index];
    if (!candidate) return false;
    if (step.id && candidate.id) return step.id === candidate.id;
    return (
      step.phase === candidate.phase &&
      step.title === candidate.title &&
      step.message === candidate.message
    );
  });
}

function hasSlidePayload(payload = {}) {
  return Boolean(
    payload.presentation_id ||
    payload.slidev_markdown ||
    payload.share_url ||
    payload.slide_output_id ||
    (Array.isArray(payload.slides) && payload.slides.length > 0),
  );
}

function parseContentData(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function sortOutputItems(items = []) {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime() || 0;
    const bTime = new Date(b.created_at || 0).getTime() || 0;
    return aTime - bTime;
  });
}

function outputIdentity(item = {}) {
  return (
    item.id ||
    item.slide_output_id ||
    item.summary_output_id ||
    item.question_output_id ||
    item.quiz_output_id ||
    item.quiz_page_id ||
    `${item.type || "output"}_${item.created_at || ""}`
  );
}

function upsertOutputItem(list = [], item) {
  if (!item) return list;
  const key = outputIdentity(item);
  const index = list.findIndex((existing) => outputIdentity(existing) === key);
  if (index >= 0) {
    const next = [...list];
    next[index] = { ...next[index], ...item };
    return sortOutputItems(next);
  }
  return sortOutputItems([...list, item]);
}

function lastItem(items = []) {
  return items.length ? items[items.length - 1] : null;
}

function normalizeQuestionsData(data) {
  const parsed = parseContentData(data);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    if (Array.isArray(parsed.questions)) return parsed.questions;
    if (Array.isArray(parsed.data)) return parsed.data;
    if (Array.isArray(parsed.items)) return parsed.items;
  }
  return [];
}

function normalizeSummaryText(data) {
  const parsed = parseContentData(data);
  if (typeof parsed === "string") return parsed;
  if (parsed && typeof parsed === "object") {
    return parsed.text || parsed.summary || parsed.markdown || "";
  }
  return "";
}

function normalizeSlideOutputFromResult(
  payload = {},
  fallbackCreatedAt = new Date().toISOString(),
) {
  if (!hasSlidePayload(payload)) return null;
  const slides = Array.isArray(payload.slides) ? payload.slides : [];
  const slideOutputId =
    payload.slide_output_id || payload.output_id || payload.id || null;
  return {
    id:
      slideOutputId || payload.presentation_id || `slide_${fallbackCreatedAt}`,
    type: "slide",
    created_at: payload.created_at || payload.createdAt || fallbackCreatedAt,
    presentation_id: payload.presentation_id || null,
    slides,
    slide_count: payload.slide_count ?? slides.length,
    slidev_markdown: payload.slidev_markdown || "",
    share_url: payload.share_url || "",
    slide_output_id: slideOutputId,
    slide_expires_at: payload.slide_expires_at || payload.expires_at || null,
    image_source: payload.image_source || "",
    template_slug: payload.template_slug || "",
    template_name: payload.template_name || "",
    context_quality: payload.context_quality || null,
    external_sources: payload.external_sources || [],
  };
}

function normalizeSummaryOutputFromResult(
  payload = {},
  fallbackCreatedAt = new Date().toISOString(),
) {
  const summary = payload.summary || "";
  if (!summary) return null;
  const summaryOutputId =
    payload.summary_output_id || payload.output_id || payload.id || null;
  return {
    id: summaryOutputId || `summary_${fallbackCreatedAt}_${summary.length}`,
    type: "summary",
    created_at: payload.created_at || payload.createdAt || fallbackCreatedAt,
    summary,
    summary_output_id: summaryOutputId,
  };
}

function normalizeQuizOutputFromResult(
  payload = {},
  fallbackCreatedAt = new Date().toISOString(),
) {
  const questions = Array.isArray(payload.questions)
    ? payload.questions
    : normalizeQuestionsData(payload.content_data);
  if (!questions.length) return null;
  const questionOutputId =
    payload.question_output_id ||
    payload.quiz_output_id ||
    payload.output_id ||
    payload.id ||
    null;
  return {
    id:
      questionOutputId ||
      payload.quiz_page_id ||
      `quiz_${fallbackCreatedAt}_${questions.length}`,
    type: "question",
    created_at: payload.created_at || payload.createdAt || fallbackCreatedAt,
    questions,
    quiz_page_id: payload.quiz_page_id || null,
    question_output_id: questionOutputId,
  };
}

function normalizeOutputRow(output = {}) {
  const data = parseContentData(output.content_data);

  if (output.type === "slide") {
    const dataObject =
      data && typeof data === "object" && !Array.isArray(data) ? data : {};
    const slides = Array.isArray(dataObject.slides)
      ? dataObject.slides
      : Array.isArray(dataObject.html_slides)
        ? dataObject.html_slides
        : [];
    const slidevMarkdown =
      typeof data === "string"
        ? data
        : dataObject.text ||
          dataObject.markdown ||
          dataObject.slidev_markdown ||
          "";

    return {
      id: output.id,
      type: "slide",
      created_at: output.created_at,
      format: output.format,
      presentation_id: dataObject.presentation_id || null,
      slides,
      slide_count: dataObject.slide_count ?? slides.length,
      slidev_markdown: slidevMarkdown,
      share_url: output.share_url || dataObject.share_url || "",
      slide_output_id: output.id,
      slide_expires_at: output.expires_at || null,
      slidev_theme: output.slidev_theme || "",
      build_status: output.build_status || "",
      image_source: dataObject.image_source || "",
      template_slug: dataObject.template_slug || "",
      template_name: dataObject.template_name || "",
      context_quality: dataObject.context_quality || null,
      external_sources: dataObject.external_sources || [],
    };
  }

  if (output.type === "question" || output.type === "quiz") {
    const dataObject =
      data && typeof data === "object" && !Array.isArray(data) ? data : {};
    const questions = normalizeQuestionsData(data);
    return {
      id: output.id,
      type: "question",
      created_at: output.created_at,
      format: output.format,
      questions,
      quiz_page_id: dataObject.quiz_page_id || dataObject.quizPageId || null,
      question_output_id: output.id,
    };
  }

  if (output.type === "summary") {
    const summary = normalizeSummaryText(data);
    return {
      id: output.id,
      type: "summary",
      created_at: output.created_at,
      format: output.format,
      summary,
      summary_output_id: output.id,
    };
  }

  return null;
}

function applyLatestFields(result = {}) {
  const slideOutputs = sortOutputItems(result.slide_outputs || []);
  const summaryOutputs = sortOutputItems(result.summary_outputs || []);
  const quizOutputs = sortOutputItems(result.quiz_outputs || []);
  const latestSlide = lastItem(slideOutputs);
  const latestSummary = lastItem(summaryOutputs);
  const latestQuiz = lastItem(quizOutputs);
  const latestAny = lastItem(
    sortOutputItems([
      ...slideOutputs.map((item) => ({ ...item, _intent: "slide" })),
      ...summaryOutputs.map((item) => ({ ...item, _intent: "summary" })),
      ...quizOutputs.map((item) => ({ ...item, _intent: "question" })),
    ]),
  );

  return {
    ...result,
    success: result.success ?? true,
    intent:
      result.intent && result.intent !== "unknown"
        ? result.intent
        : latestAny?._intent || "unknown",
    slide_outputs: slideOutputs,
    summary_outputs: summaryOutputs,
    quiz_outputs: quizOutputs,
    slides: latestSlide?.slides || [],
    slide_count: latestSlide?.slide_count ?? latestSlide?.slides?.length ?? 0,
    slidev_markdown: latestSlide?.slidev_markdown || "",
    share_url: latestSlide?.share_url || "",
    slide_output_id: latestSlide?.slide_output_id || latestSlide?.id || null,
    slide_expires_at: latestSlide?.slide_expires_at || null,
    presentation_id: latestSlide?.presentation_id || null,
    summary: latestSummary?.summary || "",
    summary_output_id:
      latestSummary?.summary_output_id || latestSummary?.id || null,
    questions: latestQuiz?.questions || [],
    quiz_page_id: latestQuiz?.quiz_page_id || null,
    question_output_id:
      latestQuiz?.question_output_id || latestQuiz?.id || null,
  };
}

function buildConversationResultFromOutputs(outputs = [], presentations = []) {
  const result = {
    success: true,
    intent: "unknown",
    slide_outputs: [],
    summary_outputs: [],
    quiz_outputs: [],
  };

  const sortedOutputs = sortOutputItems(outputs);
  sortedOutputs.forEach((output) => {
    const item = normalizeOutputRow(output);
    if (!item) return;
    if (item.type === "slide")
      result.slide_outputs = upsertOutputItem(result.slide_outputs, item);
    if (item.type === "summary" && item.summary)
      result.summary_outputs = upsertOutputItem(result.summary_outputs, item);
    if (item.type === "question" && item.questions?.length > 0)
      result.quiz_outputs = upsertOutputItem(result.quiz_outputs, item);
  });

  const latestPresentation =
    presentations.length > 0
      ? [...presentations].sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
        )[0]
      : null;
  const hasMappedPresentation = result.slide_outputs.some(
    (item) => item.presentation_id,
  );
  if (
    !hasMappedPresentation &&
    latestPresentation &&
    result.slide_outputs.length > 0
  ) {
    const latestSlide = result.slide_outputs[result.slide_outputs.length - 1];
    latestSlide.presentation_id = latestPresentation.id;
  }

  return applyLatestFields(result);
}

function mergeConversationResult(prev = {}, next = {}) {
  if (!next || typeof next !== "object") return applyLatestFields(prev || {});
  const createdAt =
    next.created_at || next.createdAt || new Date().toISOString();
  const merged = {
    ...(prev || {}),
    success: next.success ?? prev?.success ?? true,
    confidence: next.confidence ?? prev?.confidence,
    processing_time_ms: next.processing_time_ms ?? prev?.processing_time_ms,
    errors: next.errors ?? prev?.errors ?? [],
    logs: next.logs ?? prev?.logs ?? [],
    trace: next.trace ?? prev?.trace ?? [],
    trace_events: next.trace_events ?? prev?.trace_events ?? [],
    intent: next.intent || prev?.intent || "unknown",
    slide_outputs: [...(prev?.slide_outputs || [])],
    summary_outputs: [...(prev?.summary_outputs || [])],
    quiz_outputs: [...(prev?.quiz_outputs || [])],
  };

  if (Array.isArray(next.slide_outputs)) {
    next.slide_outputs.forEach((item) => {
      merged.slide_outputs = upsertOutputItem(merged.slide_outputs, item);
    });
  } else {
    const slideOutput = normalizeSlideOutputFromResult(next, createdAt);
    if (slideOutput)
      merged.slide_outputs = upsertOutputItem(
        merged.slide_outputs,
        slideOutput,
      );
  }

  if (Array.isArray(next.summary_outputs)) {
    next.summary_outputs.forEach((item) => {
      merged.summary_outputs = upsertOutputItem(merged.summary_outputs, item);
    });
  } else if (next.intent === "summary") {
    const summaryOutput = normalizeSummaryOutputFromResult(next, createdAt);
    if (summaryOutput)
      merged.summary_outputs = upsertOutputItem(
        merged.summary_outputs,
        summaryOutput,
      );
  }

  if (Array.isArray(next.quiz_outputs)) {
    next.quiz_outputs.forEach((item) => {
      merged.quiz_outputs = upsertOutputItem(merged.quiz_outputs, item);
    });
  } else if (next.intent === "question") {
    const quizOutput = normalizeQuizOutputFromResult(next, createdAt);
    if (quizOutput)
      merged.quiz_outputs = upsertOutputItem(merged.quiz_outputs, quizOutput);
  }

  return applyLatestFields(merged);
}

// ── Async Thunks ──

export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      return await conversationService.getConversations();
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  },
);

export const loadConversation = createAsyncThunk(
  "chat/loadConversation",
  async (id, { rejectWithValue }) => {
    try {
      const [conv, presentations] = await Promise.all([
        conversationService.getConversation(id),
        // Fetch presentations list để fallback khi output không có presentation_id
        import("../services/presentationService.js")
          .then((m) => m.presentationService.list())
          .catch(() => []),
      ]);
      return { ...conv, _presentations: presentations };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  },
);

export const deleteConversationThunk = createAsyncThunk(
  "chat/deleteConversation",
  async (id, { rejectWithValue }) => {
    try {
      await conversationService.deleteConversation(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  },
);

export const confirmOutline = createAsyncThunk(
  "chat/confirmOutline",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const stage1Trace = getState().chat.stage1Trace || [];
      const result = await outlineService.confirmOutline({
        ...payload,
        stage1_trace: payload.stage1_trace || stage1Trace,
      });
      return result;
    } catch (err) {
      console.error("Confirm outline failed:", err);
      return rejectWithValue(
        err.response?.data?.detail || err.message || "Confirm outline failed",
      );
    }
  },
);

export const generateContent = createAsyncThunk(
  "chat/generateContent",
  async (
    {
      content,
      sessionId,
      conversationId,
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
    },
    { rejectWithValue },
  ) => {
    try {
      const result = await generateService.generate({
        content,
        session_id: sessionId,
        conversation_id: conversationId,
        mode,
        image_source: imageSource,
        animation_style: animationStyle,
        slide_template_slug: slideTemplateSlug,
        slide_content_depth: slideContentDepth,
        slide_count: slideCount,
        slide_request: slideRequest,
        output_format: outputFormat,
        quiz_theme: quizTheme,
        difficulty: difficulty,
        bloom_level: bloomLevel,
      });
      return result;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail || err.message || "Generation failed",
      );
    }
  },
);

// ── Slice ──

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversations: [], // list of historical conversations
    currentConversationId: null, // active conversation
    messages: [], // { id, role, content, created_at, outputs? }
    agentProgress: [], // Socket.IO progress events from nodes
    isGenerating: false, // true while /api/generate is in flight
    lastResult: null, // Last GenerateResponse from backend
    conversationResults: {}, // Aggregated outputs per conversation
    error: null,
    pendingOutline: null,
    pendingSessionInfo: null,
    stage1Trace: [], // Preserved CoT from Stage 1 (outline planning)
  },
  reducers: {
    setConversationId: (state, action) => {
      state.currentConversationId = action.payload;
    },
    addUserMessage: (state, action) => {
      state.messages.push({
        id: Date.now().toString(),
        role: "user",
        content: action.payload,
        created_at: new Date().toISOString(),
      });
    },

    addAssistantMessage: (state, action) => {
      state.messages.push({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: action.payload.content || "",
        outputs: action.payload.outputs || null,
        intent: action.payload.intent || "unknown",
        created_at: new Date().toISOString(),
      });
    },

    addAgentProgress: (state, action) => {
      state.agentProgress.push(
        normalizeTraceEvent(action.payload, state.agentProgress.length),
      );
    },

    clearAgentProgress: (state) => {
      state.agentProgress = [];
    },

    clearChat: (state) => {
      state.messages = [];
      state.agentProgress = [];
      state.lastResult = null;
      state.conversationResults = {};
      state.error = null;
      state.isGenerating = false;
      state.currentConversationId = null;
      // Clear persisted conversation ID
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("lumiere_last_conv_id");
      }
    },

    clearError: (state) => {
      state.error = null;
    },
    clearPendingOutline: (state) => {
      state.pendingOutline = null;
      state.pendingSessionInfo = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // -- Fetch Conversations --
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
      })

      // -- Load Conversation --
      .addCase(loadConversation.fulfilled, (state, action) => {
        const payload = action.payload;
        state.currentConversationId = payload.id;
        state.messages = (payload.messages || []).map((message) => ({
          ...message,
          cot_log: (message.cot_log || []).map((step, i) =>
            normalizeTraceEvent(step, i),
          ),
        }));
        state.agentProgress = [];
        state.isGenerating = false;
        state.error = null;

        // Presentations list để fallback lookup
        const presentations = payload._presentations || [];

        if (payload.outputs && payload.outputs.length > 0) {
          const structuredResult = buildConversationResultFromOutputs(
            payload.outputs,
            presentations,
          );
          state.lastResult = structuredResult;
          if (payload.id) {
            state.conversationResults[payload.id] = structuredResult;
          }
        } else {
          state.lastResult = null;
          if (payload.id) {
            state.conversationResults[payload.id] = null;
          }
        }
      })

      // -- Delete Conversation --
      .addCase(deleteConversationThunk.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(
          (c) => c.id !== action.payload,
        );
        if (state.currentConversationId === action.payload) {
          state.currentConversationId = null;
          state.messages = [];
          state.lastResult = null;
        }
        if (
          Object.prototype.hasOwnProperty.call(
            state.conversationResults,
            action.payload,
          )
        ) {
          delete state.conversationResults[action.payload];
        }
      })

      // -- Generate Content --
      .addCase(generateContent.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
        state.agentProgress = [];
      })
      .addCase(generateContent.fulfilled, (state, action) => {
        state.isGenerating = false;

        if (action.payload.status === "outline_ready") {
          if (action.payload.conversation_id) {
            state.currentConversationId = action.payload.conversation_id;
          }
          state.pendingOutline = action.payload.outline;
          state.pendingSessionInfo = {
            session_id: action.payload.session_id,
            conversation_id: action.payload.conversation_id,
            image_source: action.payload.image_source,
            animation_style: action.payload.animation_style,
            slide_template_slug: action.payload.slide_template_slug,
            slideTopic: action.payload.slideTopic,
          };
          // Save Stage 1 CoT so it can be merged with Stage 2 later
          const s1Trace = (action.payload.trace || []).map((step, i) =>
            normalizeTraceEvent(step, i),
          );
          state.stage1Trace = s1Trace;
          // Also keep in agentProgress so the UI keeps showing them
          state.agentProgress = s1Trace;
          return;
        }

        if (action.payload.conversation_id) {
          state.currentConversationId = action.payload.conversation_id;
        }
        const conversationId =
          action.payload.conversation_id || state.currentConversationId;
        if (conversationId) {
          const mergedResult = mergeConversationResult(
            state.conversationResults[conversationId],
            action.payload,
          );
          state.conversationResults[conversationId] = mergedResult;
          state.lastResult = mergedResult;
        } else {
          state.lastResult = mergeConversationResult(
            state.lastResult,
            action.payload,
          );
        }

        const result = action.payload;
        const intent = result.intent || "unknown";
        const responseTrace = result.trace?.length
          ? result.trace
          : result.trace_events;
        const trace = (
          responseTrace?.length ? responseTrace : state.agentProgress
        ).map((step, i) => normalizeTraceEvent(step, i));

        let content = "";
        let outputs = {};

        if (intent === "qa" && result.qa_answer) {
          content = result.qa_answer;
        } else if (intent === "summary" && result.summary) {
          content = result.summary;
        } else if (intent === "question" && result.questions?.length > 0) {
          content = `Đã tạo ${result.questions.length} câu hỏi trắc nghiệm.`;
          outputs.questions = result.questions;
          if (result.quiz_page_id) {
            outputs.quiz_page_id = result.quiz_page_id;
            content += ` [Mở trang Quiz →](/quiz/${result.quiz_page_id})`;
          }
        } else if (intent === "quota_exceeded") {
          content = `⚠️ **Hết quota:** ${result.errors?.[0] || "Bạn đã dùng hết giới hạn tháng này. Vui lòng [nâng cấp gói](/pricing) để tiếp tục."}`;
        } else if (
          intent === "slide" &&
          (result.presentation_id ||
            result.slides?.length > 0 ||
            result.slidev_markdown)
        ) {
          // Pipeline mới: presentation_id là đủ để hiển thị nút mở editor
          const slideCount = result.slides?.length || 0;
          content = result.presentation_id
            ? `Đã tạo bài trình chiếu${slideCount > 0 ? ` (${slideCount} slides)` : ""}. Mở ở tab **Slide** bên phải →`
            : result.slidev_markdown
              ? "Đã tạo bài trình chiếu."
              : `Đã tạo ${slideCount} slide bài giảng.`;
          if (result.slides?.length > 0) outputs.slides = result.slides;
          if (result.slidev_markdown)
            outputs.slidev_markdown = result.slidev_markdown;
          if (result.share_url) outputs.share_url = result.share_url;
          if (result.slide_output_id)
            outputs.slide_output_id = result.slide_output_id;
          if (result.slide_expires_at)
            outputs.slide_expires_at = result.slide_expires_at;
          if (result.presentation_id)
            outputs.presentation_id = result.presentation_id;
          if (result.image_source) outputs.image_source = result.image_source;
          if (result.image_assets?.length > 0)
            outputs.image_assets = result.image_assets;
          if (result.external_sources?.length > 0)
            outputs.external_sources = result.external_sources;
          if (result.template_slug)
            outputs.template_slug = result.template_slug;
          if (result.template_name)
            outputs.template_name = result.template_name;
          if (result.context_quality)
            outputs.context_quality = result.context_quality;
          if (result.questions?.length > 0)
            outputs.questions = result.questions;
          if (result.summary) outputs.summary = result.summary;
        } else {
          content =
            result.qa_answer || result.summary || "Đã hoàn thành xử lý.";
        }

        if (result.external_sources?.length > 0) {
          outputs.external_sources = result.external_sources;
        }

        state.messages.push({
          id: Date.now().toString(),
          role: "assistant",
          content,
          outputs: Object.keys(outputs).length > 0 ? outputs : null,
          cot_log: trace,
          intent,
          created_at: new Date().toISOString(),
        });
      })
      .addCase(generateContent.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload;
        state.messages.push({
          id: Date.now().toString(),
          role: "assistant",
          content: `Lỗi: ${state.error}`,
          created_at: new Date().toISOString(),
        });
      })

      // -- Confirm Outline (Stage 2) --
      .addCase(confirmOutline.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
        // DON'T reset agentProgress — keep Stage 1 CoT visible
        // Add a "creating slides" step so user sees progress continues
        state.agentProgress.push(
          normalizeTraceEvent(
            {
              phase: "confirm_outline",
              title: "Đang tạo slide từ outline đã duyệt...",
              status: "running",
              tool: "slide_pipeline",
              node: "slide",
            },
            state.agentProgress.length,
          ),
        );
      })
      .addCase(confirmOutline.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.pendingOutline = null;
        state.pendingSessionInfo = null;

        const result = action.payload;
        if (result.conversation_id) {
          state.currentConversationId = result.conversation_id;
        }
        const conversationId =
          result.conversation_id || state.currentConversationId;
        const slideResult = { ...result, intent: "slide" };
        if (conversationId) {
          const mergedResult = mergeConversationResult(
            state.conversationResults[conversationId],
            slideResult,
          );
          state.conversationResults[conversationId] = mergedResult;
          state.lastResult = mergedResult;
        } else {
          state.lastResult = mergeConversationResult(
            state.lastResult,
            slideResult,
          );
        }

        // Merge Stage 1 trace (saved earlier) with Stage 2 trace from backend
        const returnedTrace = (result.trace || result.logs || []).map(
          (step, i) => normalizeTraceEvent(step, state.stage1Trace.length + i),
        );
        const fullTrace = traceStartsWith(returnedTrace, state.stage1Trace)
          ? returnedTrace
          : [...state.stage1Trace, ...returnedTrace];
        state.stage1Trace = []; // clear after merge

        const outputs = {};
        if (result.presentation_id)
          outputs.presentation_id = result.presentation_id;
        if (result.slides) outputs.slides = result.slides;
        if (result.slide_output_id)
          outputs.slide_output_id = result.slide_output_id;

        state.messages.push({
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Đã tạo slide dựa trên dàn ý bạn duyệt.",
          outputs,
          intent: "slide",
          cot_log: fullTrace,
          processingTime: result.processing_time_ms || null,
          created_at: new Date().toISOString(),
        });
      })
      .addCase(confirmOutline.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload;
        // Don't clear pendingOutline so user can retry
        state.messages.push({
          id: Date.now().toString(),
          role: "assistant",
          content: `Lỗi tạo slide: ${action.payload || "Unknown error"}`,
          created_at: new Date().toISOString(),
        });
      });
  },
});

export const {
  setConversationId,
  addUserMessage,
  addAssistantMessage,
  addAgentProgress,
  clearAgentProgress,
  clearChat,
  clearError,
  clearPendingOutline,
} = chatSlice.actions;

// ── Selectors ──
export const selectMessages = (state) => state.chat.messages;
export const selectAgentProgress = (state) => state.chat.agentProgress;
export const selectIsGenerating = (state) => state.chat.isGenerating;
export const selectLastResult = (state) => state.chat.lastResult;
export const selectConversationResult = (state) => {
  const conversationId = state.chat.currentConversationId;
  if (
    conversationId &&
    Object.prototype.hasOwnProperty.call(
      state.chat.conversationResults,
      conversationId,
    )
  ) {
    return state.chat.conversationResults[conversationId];
  }
  return state.chat.lastResult;
};
export const selectChatError = (state) => state.chat.error;

export default chatSlice.reducer;
