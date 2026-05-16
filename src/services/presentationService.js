/**
 * Lumiere AI — Presentation Service
 * API calls cho Reveal.js presentations (CRUD + export).
 */
import apiClient from './apiClient.js';

export const presentationService = {
  /** Lấy danh sách presentations của user */
  async list() {
    const res = await apiClient.get('/api/presentations');
    return res.data;
  },

  /** Lấy chi tiết một presentation */
  async get(id) {
    const res = await apiClient.get(`/api/presentations/${id}`);
    return res.data;
  },

  /** Tạo presentation mới */
  async create(data) {
    const res = await apiClient.post('/api/presentations', data);
    return res.data;
  },

  /** Cập nhật toàn bộ presentation */
  async update(id, data) {
    const res = await apiClient.patch(`/api/presentations/${id}`, data);
    return res.data;
  },

  /** Cập nhật một slide cụ thể (auto-save WYSIWYG) */
  async updateSlide(presentationId, slideId, data) {
    const res = await apiClient.patch(
      `/api/presentations/${presentationId}/slides/${slideId}`,
      data
    );
    return res.data;
  },

  /** Xóa presentation */
  async delete(id) {
    await apiClient.delete(`/api/presentations/${id}`);
  },

  /** Export PDF — trả về blob URL để download */
  async exportPDF(id) {
    const res = await apiClient.post(
      `/api/presentations/${id}/export/pdf`,
      {},
      { responseType: 'blob' }
    );
    return URL.createObjectURL(res.data);
  },

  /** Export PPTX — trả về blob URL để download */
  async exportPPTX(id) {
    const res = await apiClient.post(
      `/api/presentations/${id}/export/pptx`,
      {},
      { responseType: 'blob' }
    );
    return URL.createObjectURL(res.data);
  },
};

/** Gọi Nano Banana 2 để sinh ảnh */
export async function generateAIImage(prompt, slideContext = '') {
  const res = await apiClient.post('/api/ai-image/generate', {
    prompt,
    slide_context: slideContext,
  });
  return res.data; // { image_url, prompt_used }
}

export async function searchWebImages(query, count = 6) {
  const res = await apiClient.get('/api/ai-image/search', {
    params: { q: query, count },
  });
  return res.data; // { images, source }
}
