import apiClient from "./apiClient.js";

export const wikiService = {
  list: () => apiClient.get('/api/wiki/documents'),
  get: (id) => apiClient.get(`/api/wiki/documents/${id}`),
  update: (id, markdown) => apiClient.patch(`/api/wiki/documents/${id}`, { markdown }),
  delete: (id) => apiClient.delete(`/api/wiki/documents/${id}`),
  reindex: (id) => apiClient.post(`/api/wiki/documents/${id}/reindex`),
};
