/**
 * Lumiere AI — Redux Slice: Presentations (Reveal.js)
 * Quản lý state cho editor WYSIWYG mới.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/apiClient.js';

// ── Async Thunks ──

export const fetchPresentations = createAsyncThunk(
  'presentation/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/api/presentations');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Không thể tải danh sách presentations');
    }
  }
);

export const fetchPresentation = createAsyncThunk(
  'presentation/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/api/presentations/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Không thể tải presentation');
    }
  }
);

export const createPresentation = createAsyncThunk(
  'presentation/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/api/presentations', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Không thể tạo presentation');
    }
  }
);

export const updatePresentation = createAsyncThunk(
  'presentation/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/api/presentations/${id}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Không thể cập nhật presentation');
    }
  }
);

export const updateSlideThunk = createAsyncThunk(
  'presentation/updateSlide',
  async ({ presentationId, slideId, data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(
        `/api/presentations/${presentationId}/slides/${slideId}`,
        data
      );
      return { slideId, slide: res.data.slide };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Không thể cập nhật slide');
    }
  }
);

export const deletePresentation = createAsyncThunk(
  'presentation/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/presentations/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Không thể xóa presentation');
    }
  }
);

// ── Helper: tạo slide mới rỗng ──
export function createEmptySlide(order = 0) {
  return {
    id: `slide_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    order,
    layout: order === 0 ? 'cover' : 'default',
    background: '#1a1a2e',
    transition: 'slide',
    html_content: order === 0
      ? '<h1 style="color:#fff;text-align:center;">Tiêu đề bài giảng</h1><p style="color:#ccc;text-align:center;">Mô tả ngắn</p>'
      : '<h2 style="color:#fff;">Tiêu đề slide</h2><ul style="color:#ddd;"><li>Nội dung 1</li><li>Nội dung 2</li></ul>',
    speaker_notes: '',
    elements: [],
  };
}

// ── Slice ──

const presentationSlice = createSlice({
  name: 'presentation',
  initialState: {
    list: [],           // danh sách presentations
    current: null,      // presentation đang mở trong editor
    activeSlideIdx: 0,  // index slide đang được chọn
    status: 'idle',     // 'idle' | 'loading' | 'saving' | 'succeeded' | 'failed'
    error: null,
    isDirty: false,     // có thay đổi chưa lưu
  },
  reducers: {
    setActiveSlideIdx(state, action) {
      state.activeSlideIdx = action.payload;
    },

    // Cập nhật html_content của slide đang active (WYSIWYG real-time)
    updateActiveSlideContent(state, action) {
      if (!state.current) return;
      const slides = [...state.current.slides];
      if (slides[state.activeSlideIdx]) {
        slides[state.activeSlideIdx] = {
          ...slides[state.activeSlideIdx],
          html_content: action.payload,
        };
        state.current = { ...state.current, slides };
        state.isDirty = true;
      }
    },

    // Cập nhật speaker notes
    updateSpeakerNotes(state, action) {
      if (!state.current) return;
      const slides = [...state.current.slides];
      if (slides[state.activeSlideIdx]) {
        slides[state.activeSlideIdx] = {
          ...slides[state.activeSlideIdx],
          speaker_notes: action.payload,
        };
        state.current = { ...state.current, slides };
        state.isDirty = true;
      }
    },

    // Thêm slide mới sau activeSlideIdx
    addSlide(state, action) {
      if (!state.current) return;
      const afterIdx = action.payload?.afterIdx ?? state.activeSlideIdx;
      const slides = [...state.current.slides];
      const newSlide = createEmptySlide(afterIdx + 1);
      slides.splice(afterIdx + 1, 0, newSlide);
      // Cập nhật order
      slides.forEach((s, i) => { s.order = i; });
      state.current = { ...state.current, slides };
      state.activeSlideIdx = afterIdx + 1;
      state.isDirty = true;
    },

    // Xóa slide theo index
    deleteSlide(state, action) {
      if (!state.current) return;
      const idx = action.payload;
      const slides = state.current.slides.filter((_, i) => i !== idx);
      slides.forEach((s, i) => { s.order = i; });
      state.current = { ...state.current, slides };
      state.activeSlideIdx = Math.min(state.activeSlideIdx, Math.max(0, slides.length - 1));
      state.isDirty = true;
    },

    // Chèn ảnh AI vào slide đang active
    insertImageToActiveSlide(state, action) {
      if (!state.current) return;
      const { imageUrl, promptUsed } = action.payload;
      const slides = [...state.current.slides];
      const slide = slides[state.activeSlideIdx];
      if (!slide) return;

      const newElement = {
        id: `el_${Date.now()}`,
        type: 'image',
        x: 25, y: 30, w: 50, h: 40,
        src: imageUrl,
        alt: promptUsed || 'AI Generated Image',
        prompt_used: promptUsed,
      };
      slides[state.activeSlideIdx] = {
        ...slide,
        elements: [...(slide.elements || []), newElement],
        // Cũng chèn vào html_content để Reveal.js render
        html_content: slide.html_content + `\n<img src="${imageUrl}" alt="${promptUsed || 'AI Image'}" style="max-width:60%;max-height:350px;display:block;margin:1rem auto;" />`,
      };
      state.current = { ...state.current, slides };
      state.isDirty = true;
    },

    // Cập nhật theme
    setTheme(state, action) {
      if (!state.current) return;
      state.current = { ...state.current, theme: action.payload };
      state.isDirty = true;
    },

    clearCurrent(state) {
      state.current = null;
      state.activeSlideIdx = 0;
      state.isDirty = false;
    },

    markSaved(state) {
      state.isDirty = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchPresentations.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchPresentations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchPresentations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // fetchOne
      .addCase(fetchPresentation.fulfilled, (state, action) => {
        state.current = action.payload;
        state.activeSlideIdx = 0;
        state.isDirty = false;
        state.status = 'succeeded';
      })

      // create
      .addCase(createPresentation.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.current = action.payload;
        state.activeSlideIdx = 0;
        state.isDirty = false;
      })

      // update
      .addCase(updatePresentation.pending, (state) => { state.status = 'saving'; })
      .addCase(updatePresentation.fulfilled, (state, action) => {
        state.current = action.payload;
        state.isDirty = false;
        state.status = 'succeeded';
        const idx = state.list.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })

      // delete
      .addCase(deletePresentation.fulfilled, (state, action) => {
        state.list = state.list.filter(p => p.id !== action.payload);
        if (state.current?.id === action.payload) {
          state.current = null;
          state.activeSlideIdx = 0;
        }
      });
  },
});

export const {
  setActiveSlideIdx,
  updateActiveSlideContent,
  updateSpeakerNotes,
  addSlide,
  deleteSlide,
  insertImageToActiveSlide,
  setTheme,
  clearCurrent,
  markSaved,
} = presentationSlice.actions;

// ── Selectors ──
export const selectCurrentPresentation = (s) => s.presentation.current;
export const selectActiveSlideIdx = (s) => s.presentation.activeSlideIdx;
export const selectActiveSlide = (s) => {
  const p = s.presentation.current;
  if (!p) return null;
  return p.slides[s.presentation.activeSlideIdx] || null;
};
export const selectPresentationList = (s) => s.presentation.list;
export const selectIsDirty = (s) => s.presentation.isDirty;
export const selectPresentationStatus = (s) => s.presentation.status;

export default presentationSlice.reducer;
