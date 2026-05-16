import { defineConfig, loadEnv } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Tải các biến môi trường từ file .env
  const env = loadEnv(mode, process.cwd(), "");
  const devServerUrl = String(env.VITE_DEV_SERVER_URL || "").trim();
  let devHost = env.VITE_HOST || "localhost";
  let devPort = Number.parseInt(env.VITE_PORT || "5173", 10);
  if (devServerUrl) {
    try {
      const parsed = new URL(devServerUrl);
      devHost = parsed.hostname || devHost;
      if (parsed.port) {
        const parsedPort = Number.parseInt(parsed.port, 10);
        if (Number.isFinite(parsedPort)) devPort = parsedPort;
      }
    } catch {
      // Ignore invalid URL; fall back to host/port defaults.
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setupTests.js",
      css: true,
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;

            if (
              id.includes("node_modules/antd") ||
              id.includes("node_modules/@ant-design")
            ) {
              return "vendor-antd";
            }

            if (
              id.includes("node_modules/react") ||
              id.includes("node_modules/react-dom")
            ) {
              return "vendor-react";
            }

            if (
              id.includes("node_modules/@reduxjs") ||
              id.includes("node_modules/react-redux") ||
              id.includes("node_modules/react-router")
            ) {
              return "vendor-state-router";
            }

            if (
              id.includes("node_modules/@mdxeditor") ||
              id.includes("node_modules/@uiw/react-md-editor")
            ) {
              return "vendor-mdx-editor";
            }

            if (
              id.includes("node_modules/react-markdown") ||
              id.includes("node_modules/remark-gfm")
            ) {
              return "vendor-markdown-renderer";
            }

            if (id.includes("node_modules/socket.io-client")) {
              return "vendor-socket";
            }

            return "vendor-misc";
          },
        },
      },
    },
    server: {
      host: devHost,
      port: devPort,
      headers: {
        "Cross-Origin-Opener-Policy": "unsafe-none",
        "Cross-Origin-Embedder-Policy": "unsafe-none",
      },
      proxy: {
        "/view": {
          target: `http://localhost:${env.SLIDEV_PORT || 3031}`,
          changeOrigin: true,
          rewrite: (path) => path,
        },
        "/api": {
          target: `http://localhost:${env.SLIDEV_PORT || 3031}`,
          changeOrigin: true,
          rewrite: (path) => path,
        },
      },
    },
  };
});
