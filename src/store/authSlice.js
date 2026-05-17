/**
 * Lumiere AI — Redux Store: Auth Slice
 */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../services/authService";
import {
  clearStoredToken,
  getStoredToken,
  saveToken,
} from "../services/tokenStorage";

const getApiErrorMessage = (err, fallback) =>
  err.response?.data?.detail ||
  err.response?.data?.error?.message ||
  err.response?.data?.message ||
  fallback;

// ── Async Thunks ──────────────────────────────────────────────
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password, rememberMe }, { rejectWithValue }) => {
    try {
      const { data } = await authService.login(email, password);
      saveToken(data.access_token, rememberMe);
      return data;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, "Login failed"));
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async ({ email, password, full_name }, { rejectWithValue }) => {
    try {
      const { data } = await authService.register({
        email,
        password,
        full_name,
      });
      saveToken(data.access_token);
      return data;
    } catch (err) {
      return rejectWithValue(
        getApiErrorMessage(err, "Registration failed"),
      );
    }
  },
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (payload, { rejectWithValue }) => {
    try {
      const credential = typeof payload === "string" ? payload : payload?.credential;
      const rememberMe = typeof payload === "object" ? payload?.rememberMe : false;
      const { data } = await authService.googleLogin(credential);
      saveToken(data.access_token, rememberMe);
      return data;
    } catch (err) {
      return rejectWithValue(
        getApiErrorMessage(err, "Google login failed"),
      );
    }
  },
);

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authService.me();
      return data;
    } catch (err) {
      return rejectWithValue(
        getApiErrorMessage(err, "Failed to fetch user"),
      );
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: getStoredToken(),
    isAuthenticated: !!getStoredToken(),
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      clearStoredToken();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => {
      state.status = "loading";
      state.error = null;
    };
    const handleFulfilled = (state, action) => {
      state.status = "succeeded";
      state.user = action.payload.user;
      state.token = action.payload.access_token;
      state.isAuthenticated = true;
    };
    const handleRejected = (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    };

    [login, register, googleLogin].forEach((thunk) => {
      builder
        .addCase(thunk.pending, handlePending)
        .addCase(thunk.fulfilled, handleFulfilled)
        .addCase(thunk.rejected, handleRejected);
    });

    builder
      .addCase(fetchMe.pending, () => {
        // Maybe set loading, but since it's on mount, perhaps not necessary
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        // Token invalid, logout
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        clearStoredToken();
      });
  },
});
export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
