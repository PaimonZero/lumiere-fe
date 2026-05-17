import { useState, useEffect } from "react";
import { X, Save, FileText, Loader2 } from "lucide-react";
import useTheme from "../../hooks/useTheme.js";
import MarkdownEditor from "../common/MarkdownEditor.jsx";

export default function DocumentReviewModal({
  parsedDoc, // { filename, file_key, markdown }
  onConfirm, // async function(filename, file_key, markdownContent)
  onCancel,
}) {
  const { isLight } = useTheme();
  const [markdown, setMarkdown] = useState(parsedDoc?.markdown || "");
  const [filename, setFilename] = useState(parsedDoc?.filename || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (parsedDoc) {
      setMarkdown(parsedDoc.markdown || "");
      setFilename(parsedDoc.filename || "");
    }
  }, [parsedDoc]);

  const handleSave = async () => {
    if (parsedDoc) {
      const nextFilename = filename.trim();
      if (!nextFilename) {
        window.alert("Vui long nhap ten file.");
        return;
      }
      setIsSaving(true);
      try {
        await onConfirm(nextFilename, parsedDoc.file_key, markdown);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div
      className="flex flex-col h-full w-full absolute inset-0 z-20 fade-in"
      style={{
        background: "var(--color-bg-elevated)",
        borderLeft: "1px solid var(--color-border)",
      }}
    >
      {/* Header */}
      <div className="upload-document-header">
        <div className="upload-document-title-group">
          <FileText size={20} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <div className="upload-document-title-body">
            <input
              value={filename}
              onChange={(event) => setFilename(event.target.value)}
              disabled={isSaving}
              title={filename}
              aria-label="Ten file"
              className="upload-document-filename-input font-semibold text-lg truncate outline-none rounded-md px-2 py-1"
              style={{
                color: "var(--color-text-primary)",
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-border)",
              }}
            />
            <p
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              Rà soát và chỉnh sửa nội dung trước khi hệ thống phân mảnh (chunking).
            </p>
          </div>
        </div>
        <div className="upload-document-actions">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="upload-document-primary-button flex items-center gap-2 px-4 py-2 rounded-md justify-center text-sm cursor-pointer transition-colors"
            style={{ background: "var(--color-ai-accent)", color: "white" }}
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Lưu & Tiến hành Chunk
          </button>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="p-2 rounded cursor-pointer transition-colors"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--color-bg-card)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-hidden relative">
        {isSaving && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: isLight ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}
          >
            <div
              className="flex flex-col items-center gap-2"
              style={{ color: "var(--color-ai-accent)" }}
            >
              <Loader2 size={32} className="animate-spin" />
              <p className="font-medium">
                Đang xử lý phân mảnh tài liệu...
              </p>
            </div>
          </div>
        )}

        <MarkdownEditor
          value={markdown}
          onChange={(val) => setMarkdown(val || "")}
          height="100%"
          preview="live"
          placeholder="Noi dung Markdown sau khi parse..."
        />
      </div>
    </div>
  );
}
