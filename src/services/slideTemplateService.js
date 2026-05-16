import apiClient from "./apiClient.js";

export const slideTemplateService = {
  async list() {
    const res = await apiClient.get("/api/slide-templates");
    return res.data;
  },

  async get(slug) {
    const res = await apiClient.get(`/api/slide-templates/${slug}`);
    return res.data;
  },
};
