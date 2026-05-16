/**
 * Lumiere AI — Generate Service
 * Calls POST /api/generate and returns structured AI output.
 */
import apiClient from "./apiClient";

export const generateService = {
  /**
   * Generate AI content via LangGraph pipeline.
   * @param {object} params
   * @param {string} params.content - User prompt

   * @param {string} params.session_id - Socket.IO session ID for progress
   * @param {string} [params.conversation_id] - Conversation UUID
   * @param {string} [params.design_style] - Slide design style
   * @param {string} [params.image_source] - Slide image source: ai | web
   * @returns {Promise<object>} GenerateResponse
   */
  generate: async ({ content, session_id, conversation_id, mode, design_style, image_source, animation_style, slide_template_slug, slide_content_depth, slide_count, slide_request, output_format, quiz_theme, difficulty, bloom_level }) => {
    const body = {
      content,
      session_id: session_id || "default",
      conversation_id,
      mode,
    };
    if (design_style) body.design_style = design_style;
    if (image_source) body.image_source = image_source;
    if (animation_style) body.animation_style = animation_style;
    if (slide_template_slug) body.slide_template_slug = slide_template_slug;
    if (slide_content_depth) body.slide_content_depth = slide_content_depth;
    if (slide_count) body.slide_count = slide_count;
    if (slide_request) body.slide_request = slide_request;
    if (output_format) body.output_format = output_format;
    if (quiz_theme) body.quiz_theme = quiz_theme;
    if (difficulty) body.difficulty = difficulty;
    if (bloom_level) body.bloom_level = bloom_level;

    const response = await apiClient.post(
      "/api/generate",
      body,
      {
        timeout: 600000, // GPT Image 2 + slide HTML generation can take several minutes
      },
    );
    return response.data;
  },
};
