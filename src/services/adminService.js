import apiClient from "./apiClient";

export const adminService = {
  listUsers: async () => {
    const response = await apiClient.get("/api/admin/users");
    return Array.isArray(response.data) ? response.data : response.data?.users || [];
  },

  createUser: async (payload) => {
    const response = await apiClient.post("/api/admin/users", payload);
    return response.data;
  },

  updateUser: async (id, payload) => {
    const response = await apiClient.patch(`/api/admin/users/${id}`, payload);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await apiClient.delete(`/api/admin/users/${id}`);
    return response.data;
  },

  blockUser: async (id) => {
    const response = await apiClient.post(`/api/admin/users/${id}/block`);
    return response.data;
  },

  unblockUser: async (id) => {
    const response = await apiClient.post(`/api/admin/users/${id}/unblock`);
    return response.data;
  },

  listSystemDocuments: async () => {
    const response = await apiClient.get("/api/admin/system-documents");
    return Array.isArray(response.data) ? response.data : response.data?.documents || [];
  },

  parseSystemDocument: async (file, useLLMFormatter = true) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("use_llm_formatter", useLLMFormatter);

    const response = await apiClient.post("/api/admin/system-documents/parse", formData, {
      timeout: 180000,
      headers: {
        "Content-Type": undefined,
      },
    });
    return response.data;
  },

  createSystemDocument: async (payload) => {
    const response = await apiClient.post("/api/admin/system-documents", payload, {
      timeout: 180000,
    });
    return response.data;
  },

  getSystemDocument: async (id) => {
    const response = await apiClient.get(`/api/admin/system-documents/${id}`);
    return response.data;
  },

  updateSystemDocument: async (id, payload) => {
    const response = await apiClient.patch(`/api/admin/system-documents/${id}`, payload, {
      timeout: 180000,
    });
    return response.data;
  },

  deleteSystemDocument: async (id) => {
    const response = await apiClient.delete(`/api/admin/system-documents/${id}`);
    return response.data;
  },

  reindexSystemDocument: async (id) => {
    const response = await apiClient.post(`/api/admin/system-documents/${id}/reindex`, null, {
      timeout: 180000,
    });
    return response.data;
  },
};
