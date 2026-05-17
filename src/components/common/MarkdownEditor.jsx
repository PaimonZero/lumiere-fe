import MDEditor from "@uiw/react-md-editor";
import useTheme from "../../hooks/useTheme.js";

export default function MarkdownEditor({
  value,
  onChange,
  height = 420,
  preview = "live",
  placeholder = "Nhap noi dung Markdown...",
  ...props
}) {
  const { theme } = useTheme();

  return (
    <div
      className="markdown-editor-shell"
      data-color-mode={theme}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      <MDEditor
        value={value || ""}
        onChange={(nextValue) => onChange?.(nextValue || "")}
        height="100%"
        preview={preview}
        visibleDragbar={false}
        textareaProps={{ placeholder }}
        {...props}
      />
    </div>
  );
}
