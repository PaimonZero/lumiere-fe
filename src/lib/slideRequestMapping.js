/**
 * Mapping codes used by the action modal to human-readable Vietnamese
 * labels. Used both for the chat-history display message and for any
 * preview UI. The backend receives the raw codes inside `slide_request`
 * and is responsible for compiling its own LLM prompts.
 */

export const AUDIENCE_LABEL = {
  "hocsinh-th": "học sinh tiểu học",
  "tieuhoc": "học sinh tiểu học",
  "hocsinh-thcs": "học sinh THCS",
  "thcs": "học sinh THCS",
  "hocsinh-thpt": "học sinh THPT",
  "thpt": "học sinh THPT",
  "sinhvien": "sinh viên",
  "giaovien": "giáo viên",
};

export const INTERACTION_MODE_LABEL = {
  "after-each-section": "Quiz sau mỗi phần",
  "after-2-3-sections": "Quiz sau mỗi 2-3 phần",
  "end-only": "Chỉ quiz cuối bài",
};

export const INTERACTION_TYPE_LABEL = {
  "mcq-checkpoint": "trắc nghiệm nhanh",
  "fill-blank": "điền khuyết",
  "true-false": "đúng/sai",
  "drag-drop": "kéo thả ghép đôi",
  "scenario": "tình huống thực tế",
};

export const FORMAT_LABEL = {
  "bullet": "Bullet points",
  "outline": "Dàn ý",
  "teaching-note": "Ghi chú giảng dạy",
};

export const LENGTH_LABEL = {
  "short": "ngắn",
  "medium": "vừa",
  "long": "chi tiết",
};

export const DIFFICULTY_LABEL = {
  "easy": "dễ",
  "medium": "trung bình",
  "hard": "khó",
  "mixed": "trộn mức độ",
};

export const BLOOM_LABEL = {
  "remember-understand": "Nhớ / Hiểu",
  "apply-analyze": "Vận dụng / Phân tích",
  "evaluate-create": "Đánh giá / Sáng tạo",
  "mixed": "Trộn Bloom",
};

export function buildSlideDisplayMessage(values, templateName) {
  const lines = [];
  lines.push(`Tạo slide bài giảng: "${values.topic?.trim() || "(chưa có chủ đề)"}"`);
  const meta = [];
  if (values.audience) meta.push(`Đối tượng: ${AUDIENCE_LABEL[values.audience] || values.audience}`);
  if (templateName) meta.push(`Template: ${templateName}`);
  if (values.slideCountMode === "custom" && values.slideCount) meta.push(`${values.slideCount} slide`);
  if (values.imageSource) meta.push(`Ảnh: ${values.imageSource === "web" ? "tìm web" : "AI"}`);
  if (meta.length) lines.push(meta.join(" · "));
  if (values.interactionMode) {
    const interactionParts = [INTERACTION_MODE_LABEL[values.interactionMode] || values.interactionMode];
    const types = (values.interactionTypes || []).map((t) => INTERACTION_TYPE_LABEL[t] || t).filter(Boolean);
    if (types.length) interactionParts.push(`(${types.join(", ")})`);
    lines.push(`Tương tác: ${interactionParts.join(" ")}`);
  }
  if (values.extraRequirement?.trim()) {
    lines.push(`Yêu cầu thêm: ${values.extraRequirement.trim()}`);
  }
  return lines.join("\n");
}

export function buildSummaryDisplayMessage(values) {
  const lines = [`Tạo tóm tắt: "${values.topic?.trim() || "(chưa có chủ đề)"}"`];
  const meta = [];
  if (values.format) meta.push(`Định dạng: ${FORMAT_LABEL[values.format] || values.format}`);
  if (values.length) meta.push(`Độ dài: ${LENGTH_LABEL[values.length] || values.length}`);
  if (meta.length) lines.push(meta.join(" · "));
  if (values.extraRequirement?.trim()) lines.push(`Yêu cầu thêm: ${values.extraRequirement.trim()}`);
  return lines.join("\n");
}

export function buildQuestionDisplayMessage(values) {
  const lines = [`Tạo bộ câu hỏi: "${values.topic?.trim() || "(chưa có chủ đề)"}"`];
  const meta = [];
  if (values.questionCount) meta.push(`${values.questionCount} câu`);
  if (values.difficulty) meta.push(`Độ khó: ${DIFFICULTY_LABEL[values.difficulty] || values.difficulty}`);
  if (values.bloomLevel) meta.push(`Bloom: ${BLOOM_LABEL[values.bloomLevel] || values.bloomLevel}`);
  if (meta.length) lines.push(meta.join(" · "));
  if (values.extraRequirement?.trim()) lines.push(`Yêu cầu thêm: ${values.extraRequirement.trim()}`);
  return lines.join("\n");
}
