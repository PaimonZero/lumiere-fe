/**
 * Lumiere AI — App Entry Point
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { store } from "./store/store.js";
import App from "./App.jsx";
import "./index.css";
import ThemeConfigProvider from "./components/common/ThemeConfigProvider.jsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Theme initialization handled by ThemeConfigProvider and useTheme hook

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <ThemeConfigProvider>
            <App />
          </ThemeConfigProvider>
        </GoogleOAuthProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
