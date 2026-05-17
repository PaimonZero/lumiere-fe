import apiClient from "./apiClient.js";

export const wikiService = {
  list: () => apiClient.get('/api/wiki/documents'),
  get: (id) => apiClient.get(`/api/wiki/documents/${id}`),
  update: (id, payload) => apiClient.patch(
    `/api/wiki/documents/${id}`,
    typeof payload === 'string' ? { markdown: payload } : payload,
  ),
  delete: (id) => apiClient.delete(`/api/wiki/documents/${id}`),
  reindex: (id) => apiClient.post(`/api/wiki/documents/${id}/reindex`),
};
