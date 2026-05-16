import { useState, useEffect } from "react";
import { X, Save, FileText, Loader2 } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import useTheme from "../../hooks/useTheme.js";

export default function DocumentReviewModal({
  parsedDoc, // { filename, file_key, markdown }
  onConfirm, // async function(filename, file_key, markdownContent)
  onCancel,
}) {
  const { theme, isLight } = useTheme();
  const [markdown, setMarkdown] = useState(parsedDoc?.markdown || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (parsedDoc) {
      setMarkdown(parsedDoc.markdown || "");
    }
  }, [parsedDoc]);

  const handleSave = async () => {
    if (parsedDoc) {
      setIsSaving(true);
      try {
        await onConfirm(parsedDoc.filename, parsedDoc.file_key, markdown);
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
      <div
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ borderColor: "var(--color-border)", borderBottom: '1px solid', minHeight: 64 }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <FileText size={20} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <div className="min-w-0">
            <h3
              className="font-semibold text-lg truncate"
              title={parsedDoc?.filename}
              style={{ color: "var(--color-text-primary)", maxWidth: 'calc(100vw - 280px)' }}
            >
              {parsedDoc?.filename}
            </h3>
            <p
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              Rà soát và chỉnh sửa nội dung trước khi hệ thống phân mảnh (chunking).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-md justify-center text-sm cursor-pointer transition-colors"
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
      <div className="flex-1 overflow-hidden relative" data-color-mode={theme}>
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

        <MDEditor
          value={markdown}
          onChange={(val) => setMarkdown(val || "")}
          height="100%"
          visibleDragbar={false}
          preview="live"
        />
      </div>
    </div>
  );
}
