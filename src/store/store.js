/**
 * Lumiere AI — Redux Root Store
 */
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import chatReducer from './chatSlice.js';
import wikiReducer from './wikiSlice.js';
import outputReducer from './outputSlice.js';
import presentationReducer from './presentationSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    wiki: wikiReducer,
    outputs: outputReducer,
    presentation: presentationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['chat/generateContent/fulfilled'],
      },
    }),
});

export default store;
