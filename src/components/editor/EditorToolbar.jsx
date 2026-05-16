/**
 * Editor Toolbar — thanh công cụ TipTap + actions
 */
import { Sparkles, FileDown, Presentation, Save, Bold, Italic, List, ListOrdered, Heading1, Heading2, Undo, Redo } from 'lucide-react';

function ToolBtn({ onClick, title, active, children, disabled }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        background: active ? '#7c3aed' : 'transparent',
        border: 'none',
        borderRadius: 5,
        color: disabled ? '#4b5563' : active ? '#fff' : '#d1d5db',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '5px 7px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { if (!active && !disabled) e.currentTarget.style.background = '#374151'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 20, background: '#374151', margin: '0 4px' }} />;
}

export default function EditorToolbar({
  editor,
  onOpenAIWidget,
  onExportPDF,
  onExportPPTX,
  onSave,
  isSaving,
  isDirty,
}) {
  if (!editor) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      padding: '6px 12px',
      background: '#111827',
      borderTop: '1px solid #1f2937',
      flexWrap: 'wrap',
    }}>
      {/* Text formatting */}
      <ToolBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="In đậm (Ctrl+B)"
      >
        <Bold size={14} />
      </ToolBtn>

      <ToolBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="In nghiêng (Ctrl+I)"
      >
        <Italic size={14} />
      </ToolBtn>

      <Divider />

      {/* Headings */}
      <ToolBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Tiêu đề H1"
      >
        <Heading1 size={14} />
      </ToolBtn>

      <ToolBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Tiêu đề H2"
      >
        <Heading2 size={14} />
      </ToolBtn>

      <Divider />

      {/* Lists */}
      <ToolBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Danh sách bullet"
      >
        <List size={14} />
      </ToolBtn>

      <ToolBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Danh sách số"
      >
        <ListOrdered size={14} />
      </ToolBtn>

      <Divider />

      {/* Undo/Redo */}
      <ToolBtn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Hoàn tác (Ctrl+Z)"
      >
        <Undo size={14} />
      </ToolBtn>

      <ToolBtn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Làm lại (Ctrl+Y)"
      >
        <Redo size={14} />
      </ToolBtn>

      <Divider />

      {/* AI Image */}
      <ToolBtn onClick={onOpenAIWidget} title="Tạo ảnh AI (Nano Banana 2)">
        <Sparkles size={14} color="#a78bfa" />
        <span style={{ fontSize: 11 }}>AI Image</span>
      </ToolBtn>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Save */}
      <ToolBtn onClick={onSave} disabled={!isDirty || isSaving} title="Lưu (Ctrl+S)">
        <Save size={14} color={isDirty ? '#34d399' : '#6b7280'} />
        <span style={{ fontSize: 11, color: isDirty ? '#34d399' : '#6b7280' }}>
          {isSaving ? 'Đang lưu...' : isDirty ? 'Lưu*' : 'Đã lưu'}
        </span>
      </ToolBtn>

      <Divider />

      {/* Export */}
      <ToolBtn onClick={onExportPDF} title="Xuất PDF">
        <FileDown size={14} />
        <span style={{ fontSize: 11 }}>PDF</span>
      </ToolBtn>

      <ToolBtn onClick={onExportPPTX} title="Xuất PPTX">
        <Presentation size={14} />
        <span style={{ fontSize: 11 }}>PPTX</span>
      </ToolBtn>
    </div>
  );
}
