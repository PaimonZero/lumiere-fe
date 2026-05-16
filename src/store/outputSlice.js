import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/apiClient';

export const fetchOutputsByConversation = createAsyncThunk(
  'outputs/fetchByConversation',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/api/conversations/${conversationId}`);
      return response.data.outputs || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch outputs');
    }
  }
);

const initialState = {
  items: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const outputSlice = createSlice({
  name: 'outputs',
  initialState,
  reducers: {
    clearOutputs: (state) => {
      state.items = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOutputsByConversation.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOutputsByConversation.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchOutputsByConversation.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearOutputs } = outputSlice.actions;

export default outputSlice.reducer;
