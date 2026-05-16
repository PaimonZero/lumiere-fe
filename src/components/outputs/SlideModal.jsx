/**
 * Lumiere AI — Slide Modal
 * - Hiển thị slide qua iframe (sli.dev share URL)
 * - Cho phép chỉnh sửa nội dung từng slide (title + content) trực tiếp
 * - Nút "Lưu & Biên dịch lại" sau khi edit để rebuild slide
 * - Nút Rebuild khi sli.dev lỗi hoặc iframe không load được
 */
import { useState, useCallback, useMemo } from 'react';
import { Alert, Button, Input, Modal, Space, Spin, Tooltip, Typography, message } from 'antd';
import { ExternalLink, RefreshCw, Edit3, Eye, ChevronLeft, ChevronRight, Save } from 'lucide-react';
// import SlidevSharePanel from './SlidevSharePanel.jsx';
// import ThemeSelector from './ThemeSelector.jsx';
// import { rebuildSlide } from '../../services/slideService.js';

const { TextArea } = Input;

// ── Parse Slidev markdown into slide sections ──────────────────
// Slidev uses "---" as slide separator.
function parseSlidevMarkdown(markdown) {
  if (!markdown) return [];

  const rawSections = markdown.split(/\n---\n/);

  return rawSections
    .map((section, idx) => {
      const trimmed = section.trim();
      if (!trimmed) return null;

      // Extract title: first # heading line
      const titleMatch = trimmed.match(/^#+ (.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : `Slide ${idx + 1}`;

      // Content = everything after the first heading
      let content = trimmed;
      if (titleMatch) {
        const headingLine = titleMatch[0];
        const afterHeading = trimmed.slice(trimmed.indexOf(headingLine) + headingLine.length).trim();
        content = afterHeading;
      }

      return { slide_number: idx + 1, title, content };
    })
    .filter(Boolean);
}

// ── Reconstruct Slidev markdown from edited slides ─────────────
// Preserves frontmatter from original sections where possible.
function reconstructSlidevMarkdown(originalMarkdown, editedSlides) {
  const rawSections = originalMarkdown ? originalMarkdown.split(/\n---\n/) : [];

  return editedSlides
    .map((s, idx) => {
      const original = rawSections[idx] || '';
      // Preserve any frontmatter lines (before first # heading)
      const frontmatterMatch = original.match(/^([\s\S]*?)(?=^#)/m);
      const frontmatter = frontmatterMatch ? frontmatterMatch[1].trimEnd() : '';

      const titleLine = `# ${s.title}`;
      const body = s.content ? `\n\n${s.content}` : '';
      const prefix = frontmatter ? `${frontmatter}\n` : '';
      return `${prefix}${titleLine}${body}`;
    })
    .join('\n\n---\n\n');
}

// ── Slide content editor ───────────────────────────────────────
function SlideContentEditor({ slides, onSlidesChange }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (!slides || slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <Typography.Text style={{ color: 'var(--color-text-muted)' }}>
          Không có dữ liệu slide để chỉnh sửa.
        </Typography.Text>
      </div>
    );
  }

  const slide = slides[currentIdx];
  const total = slides.length;

  const updateField = (field, value) => {
    const updated = slides.map((s, i) =>
      i === currentIdx ? { ...s, [field]: value } : s
    );
    onSlidesChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Typography.Text style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
          Slide {currentIdx + 1} / {total}
        </Typography.Text>
        <Space size={4}>
          <Button
            size="small"
            icon={<ChevronLeft size={13} />}
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(i => i - 1)}
            style={{ borderRadius: 6 }}
          />
          <Button
            size="small"
            icon={<ChevronRight size={13} />}
            disabled={currentIdx === total - 1}
            onClick={() => setCurrentIdx(i => i + 1)}
            style={{ borderRadius: 6 }}
          />
        </Space>
      </div>

      {/* Slide badge */}
      <div
        className="text-xs px-2 py-1 rounded w-fit font-medium"
        style={{ background: 'var(--color-surface-strong)', color: 'var(--color-primary)' }}
      >
        Slide {slide.slide_number ?? currentIdx + 1}
      </div>

      {/* Title */}
      <div>
        <Typography.Text
          style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}
        >
          Tiêu đề slide
        </Typography.Text>
        <Input
          value={slide.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Nhập tiêu đề slide..."
          style={{ borderRadius: 8 }}
        />
      </div>

      {/* Content */}
      <div>
        <Typography.Text
          style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}
        >
          Nội dung slide
        </Typography.Text>
        <TextArea
          value={slide.content || ''}
          onChange={(e) => updateField('content', e.target.value)}
          placeholder="Nhập nội dung slide (bullet points, text, v.v.)..."
          style={{ borderRadius: 8 }}
          autoSize={{ minRows: 8, maxRows: 18 }}
        />
      </div>

      {/* Thumbnail list */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 pt-2"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrentIdx(i)}
            className="shrink-0 text-left rounded-lg px-3 py-2 text-xs transition-all cursor-pointer"
            style={{
              minWidth: 100,
              maxWidth: 140,
              background: i === currentIdx ? 'var(--color-surface-strong)' : 'var(--color-bg-card)',
              border: `1px solid ${i === currentIdx ? 'var(--color-primary)' : 'var(--color-border)'}`,
              color: i === currentIdx ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: i === currentIdx ? 600 : 400,
            }}
          >
            <div className="font-medium truncate">{i + 1}. {s.title || '(Không có tiêu đề)'}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main SlideModal ────────────────────────────────────────────
export default function SlideModal({
  open,
  onClose,
  shareUrl,
  slidevMarkdown,
  slides = [],
  outputId,
}) {
  const [activeView, setActiveView] = useState('preview'); // 'preview' | 'edit'
  const [editedSlides, setEditedSlides] = useState(null);
  const [iframeError, setIframeError] = useState(false);
  const [isRebuilding] = useState(false);

  // Parse slidevMarkdown into editable slides (memoized)
  const parsedSlides = useMemo(() => {
    const structuredNonEmpty = slides.filter(s => s && (s.content?.trim() || s.title?.trim()));
    if (structuredNonEmpty.length > 0) return structuredNonEmpty;
    return parseSlidevMarkdown(slidevMarkdown);
  }, [slides, slidevMarkdown]);

  const canEdit = parsedSlides.length > 0;

  const handleOpenEdit = () => {
    setEditedSlides([...parsedSlides]);
    setActiveView('edit');
  };

  const handleCloseModal = () => {
    setActiveView('preview');
    setIframeError(false);
    setEditedSlides(null);
    onClose();
  };

  // Core rebuild function — accepts optional markdown override
  const handleRebuild = useCallback(async () => {
    // Disabled Slidev rebuild
    message.warning('Tính năng biên dịch lại bằng Slidev đã được thay thế bởi HTML Builder nội bộ.');
  }, []);

  // Save edits → reconstruct markdown → rebuild slide
  const handleSaveAndRebuild = useCallback(async () => {
    if (!editedSlides || editedSlides.length === 0) {
      message.warning('Không có nội dung để lưu.');
      return;
    }
    if (!outputId) {
      message.warning('Thiếu outputId — không thể biên dịch lại.');
      return;
    }
    const newMarkdown = reconstructSlidevMarkdown(slidevMarkdown, editedSlides);
    await handleRebuild(newMarkdown);
    // Return to preview after rebuild
    setActiveView('preview');
  }, [editedSlides, outputId, slidevMarkdown, handleRebuild]);

  return (
    <Modal
      open={open}
      onCancel={handleCloseModal}
      width="92vw"
      style={{ top: 10 }}
      footer={null}
      destroyOnClose
      title={
        <div className="flex items-center justify-between w-full pr-8">
          <Space>
            <Typography.Text strong>Slide bài giảng</Typography.Text>
            {shareUrl && (
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}
              >
                <ExternalLink size={14} />
              </a>
            )}
          </Space>

          <Space size={8}>
            {/* Edit / Preview toggle */}
            {canEdit && (
              <Button
                size="small"
                icon={activeView === 'edit' ? <Eye size={13} /> : <Edit3 size={13} />}
                onClick={() => activeView === 'edit' ? setActiveView('preview') : handleOpenEdit()}
                style={{ borderRadius: 6, fontSize: 12 }}
              >
                {activeView === 'edit' ? 'Xem trình chiếu' : 'Chỉnh sửa nội dung'}
              </Button>
            )}

            {/* Save & Rebuild — only in edit mode when outputId exists */}
            {activeView === 'edit' && outputId && (
              <Button
                size="small"
                type="primary"
                icon={<Save size={13} />}
                onClick={handleSaveAndRebuild}
                loading={isRebuilding}
                style={{ borderRadius: 6, fontSize: 12 }}
              >
                {isRebuilding ? 'Đang biên dịch...' : 'Lưu & Biên dịch lại'}
              </Button>
            )}

            {/* Rebuild button — preview mode, when iframe errored or no shareUrl */}
            {activeView === 'preview' && (iframeError || (!shareUrl && slidevMarkdown)) && outputId && (
              <Tooltip title="Biên dịch lại slide từ Markdown">
                <Button
                  size="small"
                  type="primary"
                  danger={iframeError}
                  icon={<RefreshCw size={13} className={isRebuilding ? 'animate-spin' : ''} />}
                  onClick={() => handleRebuild()}
                  loading={isRebuilding}
                  style={{ borderRadius: 6, fontSize: 12 }}
                >
                  {isRebuilding ? 'Đang biên dịch...' : 'Biên dịch lại Slide'}
                </Button>
              </Tooltip>
            )}

          </Space>
        </div>
      }
    >
      {activeView === 'edit' ? (
        /* ── Edit Mode ── */
        <div style={{ height: 'calc(90vh - 160px)', overflowY: 'auto', padding: '4px 0' }}>
          <Alert
            type="info"
            showIcon
            message="Chỉnh sửa nội dung slide"
            description={
              outputId
                ? 'Thay đổi tiêu đề và nội dung từng slide, sau đó nhấn "Lưu & Biên dịch lại" để cập nhật trình chiếu.'
                : 'Thay đổi tiêu đề và nội dung từng slide. Nhấn "Xem trình chiếu" để quay lại.'
            }
            style={{ marginBottom: 16, borderRadius: 8 }}
            closable
          />
          <SlideContentEditor
            slides={editedSlides || parsedSlides}
            onSlidesChange={setEditedSlides}
          />
        </div>
      ) : shareUrl ? (
        /* ── Preview: iframe ── */
        <div style={{ height: 'calc(90vh - 160px)', position: 'relative' }}>
          {iframeError && (
            <Alert
              type="error"
              showIcon
              message="Không thể tải slide từ sli.dev"
              description={
                <span>
                  Slide có thể đã hết hạn hoặc sli.dev đang gặp sự cố.{' '}
                  {outputId && slidevMarkdown && (
                    <button
                      onClick={() => handleRebuild()}
                      disabled={isRebuilding}
                      style={{
                        color: 'var(--color-primary)',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                      }}
                    >
                      {isRebuilding ? 'Đang biên dịch lại...' : 'Nhấn để biên dịch lại ngay'}
                    </button>
                  )}
                </span>
              }
              style={{ marginBottom: 12, borderRadius: 8 }}
            />
          )}
          {isRebuilding ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Spin size="large" />
              <Typography.Text style={{ color: 'var(--color-text-muted)' }}>
                Đang biên dịch lại slide, vui lòng chờ...
              </Typography.Text>
            </div>
          ) : (
            <iframe
              key={shareUrl}
              src={shareUrl}
              className="w-full rounded-lg border"
              style={{
                height: iframeError ? 'calc(100% - 80px)' : '100%',
                borderColor: 'var(--color-border)',
                colorScheme: 'light',
                background: '#ffffff',
              }}
              title="Slidev Presentation"
              allowFullScreen
              onError={() => setIframeError(true)}
            />
          )}
        </div>
      ) : slidevMarkdown ? (
        /* ── No share URL: raw markdown + rebuild ── */
        <div style={{ height: 'calc(90vh - 160px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Alert
            type="warning"
            showIcon
            message="Slide chưa được biên dịch"
            description={
              outputId
                ? 'Slide chưa có URL trình chiếu. Nhấn "Biên dịch lại Slide" ở trên để tạo.'
                : 'Slide chưa có URL trình chiếu. Nội dung Markdown hiển thị bên dưới.'
            }
            style={{ borderRadius: 8 }}
          />
          <pre
            className="whitespace-pre-wrap text-sm p-4 rounded-lg overflow-auto flex-1"
            style={{
              background: '#ffffff',
              color: '#1e1b4b',
              fontFamily: 'var(--font-mono)',
              border: '1px solid var(--color-border)',
            }}
          >
            {slidevMarkdown}
          </pre>
        </div>
      ) : (
        <div className="flex items-center justify-center h-40">
          <Typography.Text style={{ color: 'var(--color-text-muted)' }}>
            Không có nội dung slide.
          </Typography.Text>
        </div>
      )}

      {/* <SlidevSharePanel shareUrl={shareUrl} /> */}
    </Modal>
  );
}
