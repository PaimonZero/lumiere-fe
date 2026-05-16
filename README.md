# Lumiere AI 3.2 — Frontend

The frontend of Lumiere AI is a modern React application utilizing Vite, Redux Toolkit, and Tailwind CSS. It is built natively for AI chatbot interactions, complete with Server-Sent Events (SSE) streaming, Chain of Thought (CoT) tracking, and Markdown rendering.

## Tech Stack
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 + PostCSS
- **State Management**: Redux Toolkit (authSlice, chatSlice, wikiSlice)
- **Routing**: React Router DOM
- **Network**: Axios & native `fetch` (for SSE Streams)
- **Auth**: `@react-oauth/google`
- **Markdown Text Editor**: MDXEditor & `react-markdown`

## Setup & Run Local

```bash
# 1. Install dependencies
npm install

# 2. Copy `.env.example` to `.env` and fill in Google Client ID (optional for local testing)
# Example:
# VITE_API_URL=http://localhost:8000
# VITE_GOOGLE_CLIENT_ID=your_id_here

# 3. Start development server
npm run dev
```

## AI Native Features
Lumiere AI's UI features the **CoT Visualizer** (Chain of Thought), providing users with real-time feedback for the AI's internal thoughts and parsing states during streaming responses. The overall UI maintains a dark OLED color scheme (Neutral tones + #6366F1 Blue Accent) for a slick, premium feel.

## Architecture
- `src/components/layout/`: Holds the primary 3-column architecture (LeftPanel, CenterPanel, RightPanel) layout framework.
- `src/services/chatService.js`: Parses chunked streaming bytes (SSE) directly from the LLM backend into Redux states.
- `src/store/chatSlice.js`: Fully decouples the UI from the SSE parsing loops.
