/**
 * Lumiere AI — Redux Store: Chat Slice
 * Manages chat messages, AI generation state, and progress events.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { generateService } from '../services/generateService';
import { conversationService } from '../services/conversationService';
import { outlineService } from '../services/outlineService';

function normalizeTraceEvent(step, index = 0) {
  if (typeof step === 'string') {
    return {
      id: `trace_${Date.now()}_${index}`,
      status: 'running',
      title: step,
      message: step,
      phase: 'log',
      timestamp: new Date().toISOString(),
    };
  }
  const item = step || {};
  const message = item.message || item.title || item.error || '';
  return {
    id: item.id || `${item.timestamp || Date.now()}_${index}`,
    status: item.status || (item.error ? 'error' : 'running'),
    title: item.title || message || item.node || 'Dang xu ly',
    message,
    phase: item.phase || item.node || 'log',
    type: item.type || 'log',
    tool: item.tool || '',
    metadata: item.metadata || {},
    timestamp: item.timestamp || new Date().toISOString(),
    node: item.node || '',
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

// ── Async Thunks ──

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      return await conversationService.getConversations();
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  }
);

export const loadConversation = createAsyncThunk(
  'chat/loadConversation',
  async (id, { rejectWithValue }) => {
    try {
      const [conv, presentations] = await Promise.all([
        conversationService.getConversation(id),
        // Fetch presentations list để fallback khi output không có presentation_id
        import('../services/presentationService.js').then(m => m.presentationService.list()).catch(() => []),
      ]);
      return { ...conv, _presentations: presentations };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  }
);

export const deleteConversationThunk = createAsyncThunk(
  'chat/deleteConversation',
  async (id, { rejectWithValue }) => {
    try {
      await conversationService.deleteConversation(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  }
);

export const confirmOutline = createAsyncThunk(
  'chat/confirmOutline',
  async (payload, { rejectWithValue, getState }) => {
    try {
      const stage1Trace = getState().chat.stage1Trace || [];
      const result = await outlineService.confirmOutline({
        ...payload,
        stage1_trace: payload.stage1_trace || stage1Trace,
      });
      return result;
    } catch (err) {
      console.error('Confirm outline failed:', err);
      return rejectWithValue(
        err.response?.data?.detail || err.message || 'Confirm outline failed'
      );
    }
  }
);

export const generateContent = createAsyncThunk(
  'chat/generateContent',
  async ({ content, sessionId, conversationId, mode, imageSource, animationStyle, slideTemplateSlug, slideContentDepth, slideCount, slideRequest, outputFormat, quizTheme, difficulty, bloomLevel }, { rejectWithValue }) => {
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
        err.response?.data?.detail || err.message || 'Generation failed'
      );
    }
  }
);

// ── Slice ──

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations: [],       // list of historical conversations
    currentConversationId: null, // active conversation
    messages: [],        // { id, role, content, created_at, outputs? }
    agentProgress: [],   // Socket.IO progress events from nodes
    isGenerating: false, // true while /api/generate is in flight
    lastResult: null,    // Last GenerateResponse from backend
    error: null,
    pendingOutline: null,
    pendingSessionInfo: null,
    stage1Trace: [],     // Preserved CoT from Stage 1 (outline planning)
  },
  reducers: {
    setConversationId: (state, action) => {
      state.currentConversationId = action.payload;
    },
    addUserMessage: (state, action) => {
      state.messages.push({
        id: Date.now().toString(),
        role: 'user',
        content: action.payload,
        created_at: new Date().toISOString(),
      });
    },

    addAssistantMessage: (state, action) => {
      state.messages.push({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: action.payload.content || '',
        outputs: action.payload.outputs || null,
        intent: action.payload.intent || 'unknown',
        created_at: new Date().toISOString(),
      });
    },

    addAgentProgress: (state, action) => {
      state.agentProgress.push(normalizeTraceEvent(action.payload, state.agentProgress.length));
    },

    clearAgentProgress: (state) => {
      state.agentProgress = [];
    },

    clearChat: (state) => {
      state.messages = [];
      state.agentProgress = [];
      state.lastResult = null;
      state.error = null;
      state.isGenerating = false;
      state.currentConversationId = null;
      // Clear persisted conversation ID
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('lumiere_last_conv_id');
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
          cot_log: (message.cot_log || []).map((step, i) => normalizeTraceEvent(step, i)),
        }));
        state.agentProgress = [];
        state.isGenerating = false;
        state.error = null;

        // Presentations list để fallback lookup
        const presentations = payload._presentations || [];
        // Lấy presentation mới nhất làm fallback
        const latestPresentation = presentations.length > 0
          ? presentations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0]
          : null;

        if (payload.outputs && payload.outputs.length > 0) {
           const structuredResult = {
              success: true,
              intent: 'unknown',
              slides: null,
              slidev_markdown: null,
              share_url: null,
              slide_output_id: null,
              slide_expires_at: null,
              questions: null,
              summary: null,
              presentation_id: null,
           };

           const sortedOutputs = [...payload.outputs].sort(
             (a, b) => new Date(a.created_at) - new Date(b.created_at)
           );

           sortedOutputs.forEach(o => {
              if (o.type === 'slide') {
                // Đọc presentation_id từ content_data — hỗ trợ cả format mới và cũ
                if (o.content_data && typeof o.content_data === 'object') {
                  // Format mới: { presentation_id, html_slides, slide_count }
                  if (o.content_data.presentation_id) {
                    structuredResult.presentation_id = o.content_data.presentation_id;
                  }
                  // Format cũ: { text: markdown, presentation_id }
                  if (o.content_data.text) {
                    structuredResult.slidev_markdown = o.content_data.text;
                  }
                } else if (typeof o.content_data === 'string') {
                  structuredResult.slidev_markdown = o.content_data;
                }

                if (o.share_url) structuredResult.share_url = o.share_url;
                structuredResult.slide_output_id = o.id;
                if (o.expires_at) structuredResult.slide_expires_at = o.expires_at;
              }

              if (o.type === 'question') {
                // content_data = array of question objects directly (from generate_router)
                // Backend stores: content_data = q_dicts (list of QuestionOut.model_dump())
                // May be stored as JSON string in some DB configurations
                let qData = o.content_data;
                if (typeof qData === 'string') {
                  try { qData = JSON.parse(qData); } catch { qData = null; }
                }
                let questions = null;
                if (Array.isArray(qData)) {
                  questions = qData;
                } else if (qData && typeof qData === 'object') {
                  if (Array.isArray(qData.questions)) questions = qData.questions;
                  else if (Array.isArray(qData.data)) questions = qData.data;
                  else if (Array.isArray(qData.items)) questions = qData.items;
                }
                if (questions && questions.length > 0) {
                  structuredResult.questions = questions;
                }
              }

              if (o.type === 'summary') {
                // content_data = { text: "summary string" } or plain string
                let sData = o.content_data;
                if (typeof sData === 'string') {
                  structuredResult.summary = sData;
                } else if (sData && typeof sData === 'object') {
                  structuredResult.summary = sData.text || null;
                }
              }
           });

           // Determine primary intent from what was found
           if (structuredResult.presentation_id || structuredResult.slides || structuredResult.slidev_markdown) {
             structuredResult.intent = 'slide';
           } else if (structuredResult.questions?.length > 0) {
             structuredResult.intent = 'question';
           } else if (structuredResult.summary) {
             structuredResult.intent = 'summary';
           }

           // Fallback: nếu có slide output nhưng không có presentation_id,
           // dùng presentation mới nhất của user
           if (structuredResult.intent === 'slide' && !structuredResult.presentation_id && latestPresentation) {
             structuredResult.presentation_id = latestPresentation.id;
           }

           state.lastResult = structuredResult;
        } else {
           state.lastResult = null;
        }
      })

      // -- Delete Conversation --
      .addCase(deleteConversationThunk.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(c => c.id !== action.payload);
        if (state.currentConversationId === action.payload) {
          state.currentConversationId = null;
          state.messages = [];
          state.lastResult = null;
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
        
        if (action.payload.status === 'outline_ready') {
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
            const s1Trace = (action.payload.trace || [])
              .map((step, i) => normalizeTraceEvent(step, i));
            state.stage1Trace = s1Trace;
            // Also keep in agentProgress so the UI keeps showing them
            state.agentProgress = s1Trace;
            return;
        }

        state.lastResult = action.payload;
        if (action.payload.conversation_id) {
            state.currentConversationId = action.payload.conversation_id;
        }

        const result = action.payload;
        const intent = result.intent || 'unknown';
        const responseTrace = result.trace?.length ? result.trace : result.trace_events;
        const trace = (responseTrace?.length ? responseTrace : state.agentProgress)
          .map((step, i) => normalizeTraceEvent(step, i));

        let content = '';
        let outputs = {};

        if (intent === 'qa' && result.qa_answer) {
          content = result.qa_answer;
        } else if (intent === 'summary' && result.summary) {
          content = result.summary;
        } else if (intent === 'question' && result.questions?.length > 0) {
          content = `Đã tạo ${result.questions.length} câu hỏi trắc nghiệm.`;
          outputs.questions = result.questions;
          if (result.quiz_page_id) {
            outputs.quiz_page_id = result.quiz_page_id;
            content += ` [Mở trang Quiz →](/quiz/${result.quiz_page_id})`;
          }
        } else if (intent === 'quota_exceeded') {
          content = `⚠️ **Hết quota:** ${result.errors?.[0] || 'Bạn đã dùng hết giới hạn tháng này. Vui lòng [nâng cấp gói](/pricing) để tiếp tục.'}`;
        } else if (intent === 'slide' && (result.presentation_id || result.slides?.length > 0 || result.slidev_markdown)) {
          // Pipeline mới: presentation_id là đủ để hiển thị nút mở editor
          const slideCount = result.slides?.length || 0;
          content = result.presentation_id
            ? `Đã tạo bài trình chiếu${slideCount > 0 ? ` (${slideCount} slides)` : ''}. Mở ở tab **Slide** bên phải →`
            : result.slidev_markdown ? 'Đã tạo bài trình chiếu.' : `Đã tạo ${slideCount} slide bài giảng.`;
          if (result.slides?.length > 0) outputs.slides = result.slides;
          if (result.slidev_markdown) outputs.slidev_markdown = result.slidev_markdown;
          if (result.share_url) outputs.share_url = result.share_url;
          if (result.slide_output_id) outputs.slide_output_id = result.slide_output_id;
          if (result.slide_expires_at) outputs.slide_expires_at = result.slide_expires_at;
          if (result.presentation_id) outputs.presentation_id = result.presentation_id;
          if (result.image_source) outputs.image_source = result.image_source;
          if (result.image_assets?.length > 0) outputs.image_assets = result.image_assets;
          if (result.external_sources?.length > 0) outputs.external_sources = result.external_sources;
          if (result.template_slug) outputs.template_slug = result.template_slug;
          if (result.template_name) outputs.template_name = result.template_name;
          if (result.context_quality) outputs.context_quality = result.context_quality;
          if (result.questions?.length > 0) outputs.questions = result.questions;
          if (result.summary) outputs.summary = result.summary;        } else {
          content = result.qa_answer || result.summary || 'Đã hoàn thành xử lý.';
        }

        if (result.external_sources?.length > 0) {
          outputs.external_sources = result.external_sources;
        }

        state.messages.push({
          id: Date.now().toString(),
          role: 'assistant',
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
          role: 'assistant',
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
        state.agentProgress.push(normalizeTraceEvent({
          phase: 'confirm_outline',
          title: 'Đang tạo slide từ outline đã duyệt...',
          status: 'running',
          tool: 'slide_pipeline',
          node: 'slide',
        }, state.agentProgress.length));
      })
      .addCase(confirmOutline.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.pendingOutline = null;
        state.pendingSessionInfo = null;

        const result = action.payload;
        state.lastResult = result;
        if (result.conversation_id) {
          state.currentConversationId = result.conversation_id;
        }

        // Merge Stage 1 trace (saved earlier) with Stage 2 trace from backend
        const returnedTrace = (result.trace || result.logs || [])
          .map((step, i) => normalizeTraceEvent(step, state.stage1Trace.length + i));
        const fullTrace = traceStartsWith(returnedTrace, state.stage1Trace)
          ? returnedTrace
          : [...state.stage1Trace, ...returnedTrace];
        state.stage1Trace = []; // clear after merge

        const outputs = {};
        if (result.presentation_id) outputs.presentation_id = result.presentation_id;
        if (result.slides) outputs.slides = result.slides;
        if (result.slide_output_id) outputs.slide_output_id = result.slide_output_id;

        state.messages.push({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Đã tạo slide dựa trên dàn ý bạn duyệt.',
          outputs,
          intent: 'slide',
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
          role: 'assistant',
          content: `Lỗi tạo slide: ${action.payload || 'Unknown error'}`,
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
export const selectChatError = (state) => state.chat.error;

export default chatSlice.reducer;
