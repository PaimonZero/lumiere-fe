/**
 * Lumiere AI — Chat Service
 * SSE streaming, conversation CRUD
 */
import apiClient from './apiClient';
import { API_BASE_URL } from './apiClient';

export const chatService = {
  /** List all conversations */
  listConversations: () => apiClient.get('/api/conversations'),

  /** Get messages for a conversation */
  getMessages: (conversationId) =>
    apiClient.get(`/api/conversations/${conversationId}/messages`),

  /** Delete a conversation */
  deleteConversation: (conversationId) =>
    apiClient.delete(`/api/conversations/${conversationId}`),

  /**
   * Stream a chat response via SSE.
   * Returns an EventSource-like object.
   * Call `close()` to stop listening.
   *
   * @param {object} body - { conversation_id?, message }
   * @param {object} callbacks - { onCoTStep, onChunk, onDone, onError }
   */
  streamChat: async (body, { onCoTStep, onChunk, onDone, onError }) => {
    const token = localStorage.getItem('lumiere_token');

    // Use fetch for SSE with POST body + auth header
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Network error' }));
      onError?.(error.detail || 'Chat request failed');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const close = () => reader.cancel();

    const processStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Keep incomplete line

          let currentEvent = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              switch (currentEvent) {
                case 'cot_step': onCoTStep?.(data); break;
                case 'chunk':    onChunk?.(data.text); break;
                case 'done':     onDone?.(data); break;
                case 'error':    onError?.(data.message); break;
              }
              currentEvent = '';
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          onError?.(err.message);
        }
      }
    };

    processStream();
    return { close };
  },
};
