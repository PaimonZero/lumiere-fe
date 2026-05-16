import apiClient from "./apiClient.js";

export const uploadService = {
  /**
   * Step 1: Upload file for parsing.
   * Returns `{ success, filename, file_key, markdown }`
   */
  uploadFileForParse: async (file, useLLM = true) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("use_llm_formatter", useLLM);

    const response = await apiClient.post("/api/upload/parse", formData, {
      timeout: 180000, // May take time for PDFs
      headers: {
        "Content-Type": undefined,
      },
    });
    return response.data;
  },

  /**
   * Step 2: Confirm the parsed (and possibly edited) markdown.
   * Returns `{ success, chunks_created }`
   */
  confirmUpload: async (filename, file_key, markdown) => {
    const response = await apiClient.post("/api/upload/confirm", {
      filename,
      file_key,
      markdown,
    });
    return response.data;
  },

  editUpload: async (filename, file_key, markdown) => {
    const response = await apiClient.patch("/api/upload/edit", {
      filename,
      file_key,
      markdown,
    });
    return response.data;
  },

  cancelUpload: async (file_key) => {
    // encodeURIComponent is safe in case file_key contains slashes or special chars
    const response = await apiClient.delete(`/api/upload/cancel/${encodeURIComponent(file_key)}`);
    return response.data;
  },
};
