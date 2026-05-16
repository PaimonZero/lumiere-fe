import apiClient from "./apiClient.js";

export const conversationService = {
  getConversations: async () => {
    const response = await apiClient.get("/api/conversations");
    return response.data;
  },

  getConversation: async (id) => {
    const response = await apiClient.get(`/api/conversations/${id}`);
    return response.data;
  },

  deleteConversation: async (id) => {
    const response = await apiClient.delete(`/api/conversations/${id}`);
    return response.data;
  },
};
