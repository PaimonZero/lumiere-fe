import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, FileText, Loader2, Trash2, Save } from "lucide-react";
import { Input, message as antMessage } from "antd";
import useTheme from "../../hooks/useTheme.js";
import MarkdownEditor from "../common/MarkdownEditor.jsx";

import {
  clearActiveContent,
  deleteWikiEntry,
  updateWikiEntry,
  selectWikiActiveContent,
} from "../../store/wikiSlice.js";

export default function WikiEditor() {
  const dispatch = useDispatch();
  const { isLight } = useTheme();
  const activeContent = useSelector(selectWikiActiveContent);
  const [markdown, setMarkdown] = useState("");
  const [filename, setFilename] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  // Track which entry ID is currently loaded to avoid overwriting edits on re-render
  const [loadedEntryId, setLoadedEntryId] = useState(null);

  useEffect(() => {
    // Only reset editor content when a DIFFERENT entry is opened, not on every activeContent update
    if (activeContent && activeContent.id !== loadedEntryId) {
      setMarkdown(activeContent.markdown_content || "");
      setFilename(activeContent.filename || "");
      setLoadedEntryId(activeContent.id);
    }
  }, [activeContent, loadedEntryId]);

  const handleClose = () => {
    setLoadedEntryId(null);
    dispatch(clearActiveContent());
  };

  const handleDelete = async () => {
    if (
      activeContent &&
      window.confirm(
        "Bạn có chắc chắn muốn xóa tài liệu này? Mọi dữ liệu tri thức liên quan sẽ bị xóa vĩnh viễn."
      )
    ) {
      await dispatch(deleteWikiEntry(activeContent.id));
      setLoadedEntryId(null);
      dispatch(clearActiveContent());
    }
  };

  const handleSave = async () => {
    if (activeContent) {
      if (!filename.trim()) {
        antMessage.warning("Vui long nhap ten file.");
        return;
      }
      setIsSaving(true);
      try {
        await dispatch(
          updateWikiEntry({
            id: activeContent.id,
            data: {
              filename: filename.trim(),
              markdown,
            },
          })
        ).unwrap();
        // Server returns { success: true, message: "..." } — no document data.
        // Local markdown state is already correct — do NOT reset it.
        // wikiSlice.updateWikiEntry.fulfilled is a no-op for activeContent when server
        // doesn't return a full document object, so the editor stays intact.
        antMessage.success('Cập nhật tài liệu thành công!');
      } catch (e) {
        antMessage.error('Lỗi cập nhật: ' + e);
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (!activeContent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full">
        <Loader2
          className="animate-spin mb-4"
          size={32}
          style={{ color: "var(--color-ai-accent)" }}
        />
        <p style={{ color: "var(--color-text-muted)" }}>
          Đang tải nội dung Wiki…
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full w-full absolute inset-0 z-20"
      style={{ background: "var(--color-bg-elevated)" }}
    >
      {/* Viewer Header */}
      <div className="upload-document-header">
        <div className="upload-document-title-group">
          <FileText size={20} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <div className="upload-document-title-body">
            <Input
              value={filename}
              onChange={(event) => setFilename(event.target.value)}
              disabled={isSaving}
              placeholder="Ten file"
              title={filename}
              aria-label="Ten file"
              className="upload-document-filename-input"
              style={{
                color: "var(--color-text-primary)",
                fontWeight: 600,
              }}
            />
          </div>
        </div>
        <div className="upload-document-actions">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="upload-document-primary-button flex items-center gap-2 px-4 py-2 rounded-md justify-center text-sm cursor-pointer transition-colors"
            style={{
              background: "var(--color-ai-accent)",
              color: "white",
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Cập nhật & Chunk
          </button>

          <div
            className="upload-document-separator w-px h-6 mx-1"
            style={{ background: "var(--color-border)" }}
          ></div>

          <button
            onClick={handleDelete}
            className="p-2 rounded cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
            title="Xóa Tài Liệu"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={handleClose}
            className="p-2 rounded cursor-pointer transition-colors"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--color-bg-card)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
            title="Đóng"
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
            style={{ backgroundColor: isLight ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)" }}
          >
            <div
              className="flex flex-col items-center gap-2"
              style={{ color: "var(--color-ai-accent)" }}
            >
              <Loader2 size={32} className="animate-spin" />
              <p className="font-medium">
                Đang xử lý phân mảnh tài liệu…
              </p>
            </div>
          </div>
        )}

        <MarkdownEditor
          value={markdown}
          onChange={(val) => setMarkdown(val || "")}
          height="100%"
          preview="live"
          placeholder="Noi dung Markdown tai lieu..."
        />
      </div>
    </div>
  );
}
