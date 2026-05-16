import apiClient from './apiClient';

export const outlineService = {
  /**
   * Confirm an edited outline and proceed with slide generation.
   * This is a long-running call (image generation + HTML composition)
   * that can take 3-5 minutes — override the default 30s timeout.
   */
  async confirmOutline(payload) {
    const response = await apiClient.post('/api/generate/confirm-outline', payload, {
      timeout: 300_000, // 5 minutes
    });
    return response.data;
  }
};

export default outlineService;
