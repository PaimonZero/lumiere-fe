import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { wikiService } from '../services/wikiService.js';

export const fetchWikiEntries = createAsyncThunk(
  'wiki/fetchEntries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await wikiService.list();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const fetchWikiEntryContent = createAsyncThunk(
  'wiki/fetchEntryContent',
  async (id, { rejectWithValue }) => {
    try {
      const response = await wikiService.get(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const updateWikiEntry = createAsyncThunk(
  'wiki/updateEntry',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await wikiService.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const deleteWikiEntry = createAsyncThunk(
  'wiki/deleteEntry',
  async (id, { rejectWithValue }) => {
    try {
      await wikiService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const reindexWikiEntry = createAsyncThunk(
  'wiki/reindexEntry',
  async (id, { rejectWithValue }) => {
    try {
      const response = await wikiService.reindex(id);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

const initialState = {
  entries: [],
  selectedEntryId: null,
  activeContent: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const wikiSlice = createSlice({
  name: 'wiki',
  initialState,
  reducers: {
    setSelectedEntryId(state, action) {
      state.selectedEntryId = action.payload;
    },
    clearActiveContent(state) {
      state.activeContent = null;
      state.selectedEntryId = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetch list
      .addCase(fetchWikiEntries.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchWikiEntries.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.entries = action.payload;
      })
      .addCase(fetchWikiEntries.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // fetch content
      .addCase(fetchWikiEntryContent.fulfilled, (state, action) => {
        state.activeContent = action.payload;
      })
      
      // update
      .addCase(updateWikiEntry.fulfilled, (state, action) => {
        const serverResponse = action.payload;
        // Backend PATCH returns { success: true, message: "..." } — no document data.
        // We must NOT replace activeContent with this response.
        // Instead, keep activeContent as-is (the local markdown was already updated in the editor).
        // Only update the entries list title if the server returned a proper document object.
        if (serverResponse?.id && state.activeContent) {
          // Server returned a full document object — merge it
          if (state.activeContent.id === serverResponse.id) {
            state.activeContent = {
              ...state.activeContent,
              ...serverResponse,
              markdown_content: serverResponse.markdown_content !== undefined
                ? serverResponse.markdown_content
                : state.activeContent.markdown_content,
            };
          }
          const idx = state.entries.findIndex(e => e.id === serverResponse.id);
          if (idx !== -1) {
            state.entries[idx] = { ...state.entries[idx], ...serverResponse };
          }
        }
        // If server returned { success, message } only — do nothing to activeContent.
        // The WikiEditor keeps its local markdown state intact.
      })
      
      // delete
      .addCase(deleteWikiEntry.fulfilled, (state, action) => {
        state.entries = state.entries.filter(e => e.id !== action.payload);
        if (state.selectedEntryId === action.payload) {
          state.selectedEntryId = null;
          state.activeContent = null;
        }
      })

      // reindex
      .addCase(reindexWikiEntry.fulfilled, () => {
        // no-op on state — user can refresh the list to see updated chunk count
      });
  },
});

export const { setSelectedEntryId, clearActiveContent } = wikiSlice.actions;

export const selectWikiEntries = (state) => state.wiki.entries;
export const selectWikiSelectedId = (state) => state.wiki.selectedEntryId;
export const selectWikiActiveContent = (state) => state.wiki.activeContent;
export const selectWikiStatus = (state) => state.wiki.status;

export default wikiSlice.reducer;
