/**
 * Lumiere AI — Slide Editor
 * - Dùng iframe sandbox để render HTML slide (không bị CSS override)
 * - TipTap làm inline editor khi click vào slide
 * - NanoBananaWidget cho AI image generation
 * - Auto-save debounced 800ms
 */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

import {
  selectCurrentPresentation,
  selectActiveSlideIdx,
  selectActiveSlide,
  selectIsDirty,
  setActiveSlideIdx,
  updateActiveSlideContent,
  updateSpeakerNotes,
  addSlide,
  deleteSlide,
  insertImageToActiveSlide,
  setTheme,
  markSaved,
} from '../../store/presentationSlice.js';
import { updatePresentation } from '../../store/presentationSlice.js';

import SlideThumbnailPanel from './SlideThumbnailPanel.jsx';
import EditorToolbar from './EditorToolbar.jsx';
import NanoBananaWidget from './NanoBananaWidget.jsx';
import { presentationService } from '../../services/presentationService.js';

// ── Debounce helper ──────────────────────────────────────────
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── Build iframe srcdoc từ html_content ─────────────────────
// CSS được sync với app/utils/slide_html_builder.py SLIDE_CSS
// Tự động inject Mermaid.js khi slide có diagram
function buildIframeSrcdoc(htmlContent) {
  const needsMermaid = htmlContent && htmlContent.includes('class="mermaid"');
  const mermaidScript = needsMermaid ? `
<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#0E1530',
    primaryColor: '#818cf8',
    primaryTextColor: '#F0F4FF',
    primaryBorderColor: '#a78bfa',
    lineColor: '#818cf8',
    secondaryColor: '#1A2444',
    tertiaryColor: '#162040',
    edgeLabelBackground: '#1A2444',
    nodeTextColor: '#F0F4FF',
    clusterBkg: '#1A2444',
    titleColor: '#a78bfa',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  flowchart: { curve: 'basis', htmlLabels: true },
});
</script>` : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#0E1530;--bg2:#1A2444;--bg3:#162040;
  --accent:#818cf8;--accent2:#a78bfa;--gold:#C9A961;
  --text:#F0F4FF;--muted:#9AA8C7;
  --green:#4ADE80;--red:#F87171;--blue:#60A5FA;
  --orange:#FB923C;--purple:#A78BFA;
  --border:rgba(129,140,248,0.2);
}
*{box-sizing:border-box;margin:0;padding:0;}
html,body{width:100%;height:100%;overflow:hidden;
  font-family:-apple-system,"SF Pro Display","Segoe UI","Inter","Noto Sans",sans-serif;
  background:var(--bg);color:var(--text);}
.slide{width:100%;height:100vh;display:flex;flex-direction:column;
  padding:2.2rem 3.2rem;overflow:hidden;position:relative;}
.slide.cover{
  align-items:center;justify-content:center;text-align:center;
  background:radial-gradient(ellipse at 25% 35%,rgba(129,140,248,0.22) 0%,transparent 55%),
             radial-gradient(ellipse at 75% 65%,rgba(167,139,250,0.15) 0%,transparent 55%),
             var(--bg);}
.cover .badge{display:inline-block;padding:4px 14px;
  background:rgba(129,140,248,0.18);border:1px solid rgba(129,140,248,0.5);
  border-radius:20px;font-size:0.78rem;color:var(--accent2);
  letter-spacing:0.08em;text-transform:uppercase;margin-bottom:1.2rem;}
.cover .accent-bar{width:56px;height:4px;
  background:linear-gradient(90deg,var(--accent),var(--accent2));
  border-radius:2px;margin:0 auto 1.4rem;}
.cover h1{font-size:2.7rem;font-weight:800;line-height:1.15;
  letter-spacing:-0.03em;margin-bottom:0.9rem;
  background:linear-gradient(135deg,#f1f5f9 0%,var(--accent2) 55%,var(--accent) 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.cover .subtitle{font-size:1.1rem;color:var(--muted);font-weight:300;
  max-width:600px;line-height:1.6;}
.cover .bottom-bar{width:36px;height:2px;
  background:rgba(129,140,248,0.3);border-radius:2px;margin:1.4rem auto 0;}
.slide-hd{display:flex;align-items:center;gap:0.75rem;
  margin-bottom:1.1rem;padding-bottom:0.85rem;
  border-bottom:1px solid var(--border);flex-shrink:0;}
.slide-hd .bar{width:4px;height:1.9rem;
  background:linear-gradient(180deg,var(--accent),var(--accent2));
  border-radius:2px;flex-shrink:0;}
.slide-hd h2{font-size:1.55rem;font-weight:700;color:#f1f5f9;margin:0;line-height:1.2;}
.blist{list-style:none;padding:0;margin:0;}
.blist li{display:flex;align-items:flex-start;gap:0.7rem;
  margin:0.55rem 0;font-size:0.93rem;color:#e2e8f0;line-height:1.6;}
.blist li .dot{color:var(--accent);font-weight:700;flex-shrink:0;
  margin-top:0.18rem;font-size:0.82rem;}
.blist li strong{color:#f1f5f9;}.blist li em{color:var(--muted);font-style:italic;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:0.7rem;}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:0.7rem;}
.card{background:var(--bg2);border-radius:8px;padding:12px 15px;border-left:3px solid var(--accent);}
.card.g{border-left-color:var(--green);}.card.r{border-left-color:var(--red);}
.card.b{border-left-color:var(--blue);}.card.o{border-left-color:var(--orange);}
.card.p{border-left-color:var(--purple);}.card.gold{border-left-color:var(--gold);}
.card .lbl{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:5px;font-weight:600;}
.card p,.card li{font-size:0.86rem;line-height:1.55;color:#e2e8f0;}
.card ul{list-style:none;padding:0;margin:3px 0;}
.card li{margin-bottom:3px;display:flex;gap:0.4rem;}
.card li::before{content:"•";color:var(--accent);flex-shrink:0;}
table{width:100%;border-collapse:collapse;margin:6px 0;font-size:0.86rem;}
th{background:rgba(129,140,248,0.14);color:var(--accent2);text-align:left;padding:7px 11px;border-bottom:2px solid var(--accent);}
td{padding:6px 11px;border-bottom:1px solid rgba(255,255,255,0.06);vertical-align:top;color:#e2e8f0;}
tr:hover td{background:rgba(255,255,255,0.025);}
td.win{color:var(--green);}td.lose{color:var(--red);}td.mid{color:var(--orange);}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:10px 0;}
.stat{text-align:center;padding:12px;background:var(--bg2);border-radius:8px;border-bottom:3px solid var(--accent);}
.stat .num{font-size:1.9rem;font-weight:800;color:var(--accent2);display:block;}
.stat .lbl{font-size:0.75rem;color:var(--muted);margin-top:3px;}
.callout{margin-top:12px;padding:10px 14px;
  background:linear-gradient(90deg,rgba(129,140,248,0.11) 0%,rgba(129,140,248,0.02) 100%);
  border-left:3px solid var(--accent);border-radius:4px;
  font-size:0.88rem;color:#c7d2fe;font-style:italic;flex-shrink:0;}
.callout strong{font-style:normal;color:var(--accent2);}
pre{background:#0A1228;border-left:3px solid var(--blue);padding:9px 13px;
  border-radius:6px;font-family:"SF Mono","Fira Code",Menlo,monospace;
  font-size:0.78rem;line-height:1.5;color:#E5E9F0;margin:7px 0;overflow-x:auto;}
code{font-family:"SF Mono","Fira Code",Menlo,monospace;
  background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:3px;
  color:var(--gold);font-size:0.86em;}
/* Mermaid */
.mermaid-wrap{flex:1;display:flex;align-items:center;justify-content:center;
  background:rgba(255,255,255,0.03);border-radius:10px;
  border:1px solid var(--border);padding:1rem;margin-top:0.5rem;
  min-height:0;overflow:hidden;}
.mermaid-wrap .mermaid{max-width:100%;max-height:100%;}
.mermaid svg{max-width:100%;max-height:calc(100vh - 200px);}
@keyframes fi{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.a{animation:fi 0.4s ease both;}
.a:nth-child(2){animation-delay:.07s;}.a:nth-child(3){animation-delay:.14s;}
.a:nth-child(4){animation-delay:.21s;}.a:nth-child(5){animation-delay:.28s;}
.a:nth-child(6){animation-delay:.35s;}.a:nth-child(7){animation-delay:.42s;}
.a:nth-child(8){animation-delay:.49s;}
.snum{position:absolute;bottom:12px;right:18px;font-size:0.72rem;color:var(--muted);}
/* Legacy compat */
.slide-root{width:100%;height:100vh;display:flex;flex-direction:column;}
h1,h2,h3,h4,h5,h6{font-weight:700;line-height:1.2;}
ul,ol{list-style:none;}a{color:inherit;text-decoration:none;}
img{max-width:100%;display:block;}
</style>
${mermaidScript}
</head>
<body>
${htmlContent || '<div class="slide cover"><div class="accent-bar"></div><p class="subtitle" style="color:var(--muted)">Slide trống</p></div>'}
</body>
</html>`;
}


// ── Themes ───────────────────────────────────────────────────
const THEMES = [
  { value: 'dark', label: '🌑 Dark' },
  { value: 'purple', label: '💜 Purple' },
  { value: 'ocean', label: '🌊 Ocean' },
  { value: 'forest', label: '🌿 Forest' },
  { value: 'light', label: '☀️ Light' },
];

export default function RevealEditor() {
  const dispatch = useDispatch();
  const presentation = useSelector(selectCurrentPresentation);
  const activeSlideIdx = useSelector(selectActiveSlideIdx);
  const activeSlide = useSelector(selectActiveSlide);
  const isDirty = useSelector(selectIsDirty);

  const iframeRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAIWidget, setShowAIWidget] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState({ x: 200, y: 200 });
  const [isSaving, setIsSaving] = useState(false);

  const debouncedSaveSlide = useMemo(
    () => debounce(async (htmlContent) => {
      if (!presentation?.id || !activeSlide?.id) return;
      try {
        await presentationService.updateSlide(presentation.id, activeSlide.id, { html_content: htmlContent });
      } catch (err) {
        console.warn('[Editor] auto-save failed:', err);
      }
    }, 800),
    [presentation?.id, activeSlide?.id]
  );

  // ── TipTap Editor ──────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
    ],
    content: activeSlide?.html_content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      dispatch(updateActiveSlideContent(html));
      debouncedSaveSlide(html);
    },
    editorProps: {
      attributes: { style: 'outline: none; min-height: 200px; color: #f1f5f9;' },
    },
  });

  // Sync TipTap khi chuyển slide
  useEffect(() => {
    if (editor && activeSlide) {
      editor.commands.setContent(activeSlide.html_content || '', false);
    }
  }, [activeSlide, activeSlideIdx, editor]);

  // ── Debounced auto-save ────────────────────────────────────
  // ── Handlers ──────────────────────────────────────────────
  const handleSlideClick = useCallback((e) => {
    if (showAIWidget) return;
    setWidgetPosition({ x: e.clientX, y: e.clientY });
    setIsEditing(true);
    setTimeout(() => editor?.commands.focus(), 50);
  }, [editor, showAIWidget]);

  const handleDoneEditing = useCallback(() => {
    setIsEditing(false);
    editor?.commands.blur();
  }, [editor]);

  const handleSave = useCallback(async () => {
    if (!presentation?.id || !isDirty) return;
    setIsSaving(true);
    try {
      await dispatch(updatePresentation({
        id: presentation.id,
        data: { title: presentation.title, theme: presentation.theme, slides: presentation.slides },
      })).unwrap();
      dispatch(markSaved());
    } catch (err) {
      console.error('[Editor] save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, presentation, isDirty]);

  // Ctrl+S / Escape
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'Escape' && isEditing) handleDoneEditing();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave, handleDoneEditing, isEditing]);

  const handleInsertAIImage = useCallback((imageUrl, promptUsed) => {
    dispatch(insertImageToActiveSlide({ imageUrl, promptUsed }));
    const fullUrl = imageUrl.startsWith('/') ? `${window.location.origin}${imageUrl}` : imageUrl;
    editor?.chain().focus().setImage({ src: fullUrl, alt: promptUsed || 'AI Image' }).run();
    setShowAIWidget(false);
  }, [dispatch, editor]);

  const handleExportPDF = useCallback(async () => {
    if (!presentation?.id) return;
    try {
      const url = await presentationService.exportPDF(presentation.id);
      const a = document.createElement('a');
      a.href = url; a.download = `${presentation.title || 'presentation'}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert('Xuất PDF thất bại: ' + err.message); }
  }, [presentation]);

  const handleExportPPTX = useCallback(async () => {
    if (!presentation?.id) return;
    try {
      const url = await presentationService.exportPPTX(presentation.id);
      const a = document.createElement('a');
      a.href = url; a.download = `${presentation.title || 'presentation'}.pptx`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert('Xuất PPTX thất bại: ' + err.message); }
  }, [presentation]);

  // ── Memoize iframe srcdoc ──────────────────────────────────
  const iframeSrcdoc = useMemo(
    () => buildIframeSrcdoc(activeSlide?.html_content || ''),
    [activeSlide?.html_content]
  );

  // ── Empty state ────────────────────────────────────────────
  if (!presentation) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0f172a', color: '#6b7280', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 48 }}>🎯</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#9ca3af' }}>Chưa có presentation nào được mở</div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>Tạo mới hoặc chọn từ danh sách</div>
      </div>
    );
  }

  const slides = presentation.slides || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0f172a' }}>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '8px 16px', background: '#111827',
        borderBottom: '1px solid #1f2937', flexShrink: 0,
      }}>
        <span style={{ color: '#f9fafb', fontWeight: 600, fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {presentation.title}
        </span>

        <label style={{ color: '#9ca3af', fontSize: 12, flexShrink: 0 }}>Theme:</label>
        <select
          value={presentation.theme || 'dark'}
          onChange={(e) => dispatch(setTheme(e.target.value))}
          style={{
            background: '#1f2937', border: '1px solid #374151',
            color: '#d1d5db', borderRadius: 6, padding: '3px 8px', fontSize: 12,
          }}
        >
          {THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        {isEditing && (
          <button
            onClick={handleDoneEditing}
            style={{
              background: '#059669', border: 'none', borderRadius: 6,
              color: '#fff', cursor: 'pointer', padding: '4px 12px', fontSize: 12, fontWeight: 600,
            }}
          >
            ✓ Xong
          </button>
        )}
      </div>

      {/* ── Main area ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Thumbnail panel */}
        <SlideThumbnailPanel
          slides={slides}
          activeIdx={activeSlideIdx}
          onSelect={(idx) => { dispatch(setActiveSlideIdx(idx)); setIsEditing(false); }}
          onAddSlide={() => dispatch(addSlide({ afterIdx: activeSlideIdx }))}
          onDeleteSlide={(idx) => dispatch(deleteSlide(idx))}
        />

        {/* ── Slide canvas + editor ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Slide area */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0f172a' }}>

            {/* ── IFRAME renderer — không bị CSS override ── */}
            {!isEditing && (
              <iframe
                ref={iframeRef}
                srcDoc={iframeSrcdoc}
                style={{
                  width: '100%', height: '100%',
                  border: 'none', display: 'block',
                  cursor: 'pointer',
                }}
                title={`Slide ${activeSlideIdx + 1}`}
                sandbox="allow-same-origin allow-scripts"
                onClick={handleSlideClick}
              />
            )}

            {/* Invisible click overlay trên iframe (iframe không bubble click) */}
            {!isEditing && (
              <div
                style={{ position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 5 }}
                onClick={handleSlideClick}
              />
            )}

            {/* ── TipTap WYSIWYG overlay khi đang edit ── */}
            {isEditing && (
              <div style={{
                position: 'absolute', inset: 0,
                background: '#0f172a',
                zIndex: 20,
                display: 'flex', flexDirection: 'column',
              }}>
                {/* Edit mode header */}
                <div style={{
                  padding: '8px 16px',
                  background: '#1e1b4b',
                  borderBottom: '1px solid #312e81',
                  display: 'flex', alignItems: 'center', gap: 8,
                  flexShrink: 0,
                }}>
                  <span style={{
                    background: '#7c3aed', color: '#fff',
                    borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}>
                    WYSIWYG
                  </span>
                  <span style={{ color: '#a5b4fc', fontSize: 12 }}>
                    Chỉnh sửa nội dung slide — Escape hoặc ✓ Xong để xem preview
                  </span>
                </div>

                {/* TipTap editor area */}
                <div style={{
                  flex: 1, overflow: 'auto',
                  padding: '2rem 3rem',
                  background: '#0f172a',
                }}>
                  <EditorContent editor={editor} />
                </div>
              </div>
            )}

            {/* Click hint */}
            {!isEditing && (
              <div style={{
                position: 'absolute', bottom: 10, right: 10,
                background: 'rgba(0,0,0,0.6)',
                color: '#9ca3af', fontSize: 11, borderRadius: 6,
                padding: '3px 8px', pointerEvents: 'none', zIndex: 10,
              }}>
                Click để chỉnh sửa
              </div>
            )}

            {/* Slide counter */}
            <div style={{
              position: 'absolute', bottom: 10, left: 10,
              background: 'rgba(0,0,0,0.6)',
              color: '#9ca3af', fontSize: 11, borderRadius: 6,
              padding: '3px 8px', pointerEvents: 'none', zIndex: 10,
            }}>
              {activeSlideIdx + 1} / {slides.length}
            </div>

            {/* Prev / Next navigation */}
            {!isEditing && slides.length > 1 && (
              <>
                <button
                  onClick={() => dispatch(setActiveSlideIdx(Math.max(0, activeSlideIdx - 1)))}
                  disabled={activeSlideIdx === 0}
                  style={{
                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 6,
                    color: '#fff', cursor: 'pointer', padding: '8px 10px', fontSize: 16,
                    zIndex: 10, opacity: activeSlideIdx === 0 ? 0.3 : 0.8,
                  }}
                >‹</button>
                <button
                  onClick={() => dispatch(setActiveSlideIdx(Math.min(slides.length - 1, activeSlideIdx + 1)))}
                  disabled={activeSlideIdx === slides.length - 1}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 6,
                    color: '#fff', cursor: 'pointer', padding: '8px 10px', fontSize: 16,
                    zIndex: 10, opacity: activeSlideIdx === slides.length - 1 ? 0.3 : 0.8,
                  }}
                >›</button>
              </>
            )}
          </div>

          {/* Toolbar */}
          <EditorToolbar
            editor={editor}
            onOpenAIWidget={() => setShowAIWidget(true)}
            onExportPDF={handleExportPDF}
            onExportPPTX={handleExportPPTX}
            onSave={handleSave}
            isSaving={isSaving}
            isDirty={isDirty}
          />
        </div>

        {/* ── Speaker Notes ── */}
        <div style={{
          width: 200, background: '#111827',
          borderLeft: '1px solid #1f2937',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
          <div style={{
            padding: '8px 12px', borderBottom: '1px solid #1f2937',
            color: '#9ca3af', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Speaker Notes
          </div>
          <textarea
            value={activeSlide?.speaker_notes || ''}
            onChange={(e) => dispatch(updateSpeakerNotes(e.target.value))}
            placeholder="Ghi chú cho diễn giả..."
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: '#d1d5db', fontSize: 12, padding: '10px 12px',
              resize: 'none', outline: 'none', lineHeight: 1.6, fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Nano Banana 2 Widget */}
      {showAIWidget && (
        <NanoBananaWidget
          position={widgetPosition}
          slideContext={activeSlide?.html_content?.replace(/<[^>]+>/g, ' ').slice(0, 100) || ''}
          onInsertImage={handleInsertAIImage}
          onClose={() => setShowAIWidget(false)}
        />
      )}

      {/* TipTap editor styles */}
      <style>{`
        .ProseMirror { outline: none; min-height: 300px; }
        .ProseMirror h1 { font-size: 2rem; font-weight: 700; color: #f1f5f9; margin-bottom: 0.8rem; }
        .ProseMirror h2 { font-size: 1.5rem; font-weight: 600; color: #e2e8f0; margin-bottom: 0.6rem; }
        .ProseMirror h3 { font-size: 1.2rem; font-weight: 600; color: #cbd5e1; margin-bottom: 0.4rem; }
        .ProseMirror p { color: #cbd5e1; line-height: 1.7; margin-bottom: 0.5rem; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; color: #cbd5e1; }
        .ProseMirror li { margin-bottom: 0.3rem; line-height: 1.6; }
        .ProseMirror img { max-width: 100%; border-radius: 8px; margin: 0.5rem 0; }
        .ProseMirror strong { color: #a78bfa; }
        .ProseMirror em { color: #94a3b8; }
      `}</style>
    </div>
  );
}
