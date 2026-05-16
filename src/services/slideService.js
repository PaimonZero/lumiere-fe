/*
[DEPRECATED]
This entire file is deprecated as Slidev Markdown is no longer used in favor of the HTML Slide Builder (v2).
The code below is commented out to prevent usage.

import apiClient from './apiClient';

export const getSlidevThemes = async () => {
  try {
    const response = await apiClient.get('/api/slides/themes');
    return response.data.themes || [];
  } catch (error) {
    console.error('Failed to fetch slidev themes:', error);
    return [];
  }
};

export const cleanupExpiredSlides = async (retentionDays = 14) => {
  try {
    const response = await apiClient.post('/api/slides/maintenance/cleanup-expired', {
      retention_days: retentionDays,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to cleanup expired slides:', error);
    throw error;
  }
};

export const getSlideInfo = async (outputId) => {
  try {
    const response = await apiClient.get(`/api/slides/${outputId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch slide info for ${outputId}:`, error);
    throw error;
  }
};

export const rebuildSlide = async (outputId, markdown, theme) => {
  try {
    const response = await apiClient.post(`/api/slides/${outputId}/rebuild`, {
      markdown,
      theme
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to rebuild slide ${outputId}:`, error);
    throw error;
  }
};
*/
