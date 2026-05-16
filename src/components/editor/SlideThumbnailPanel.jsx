/**
 * Slide Thumbnail Panel — danh sách slide bên trái editor
 * Dùng iframe để render thumbnail chính xác, không bị CSS conflict
 */
import { Plus, Trash2 } from 'lucide-react';

// Build minimal iframe srcdoc cho thumbnail
function buildThumbSrcdoc(htmlContent) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:100%;height:100%;overflow:hidden;font-family:system-ui,sans-serif;}
    h1,h2,h3{font-weight:700;line-height:1.2;}
    ul{list-style:none;}
    .slide-root{width:100%;height:100vh;display:flex;flex-direction:column;}
  </style></head><body>${htmlContent || '<div style="width:100%;height:100%;background:#1a1a2e;"></div>'}</body></html>`;
}

export default function SlideThumbnailPanel({
  slides = [],
  activeIdx,
  onSelect,
  onAddSlide,
  onDeleteSlide,
}) {
  return (
    <div
      style={{
        width: 160,
        background: '#111827',
        borderRight: '1px solid #1f2937',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid #1f2937',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Slides ({slides.length})
        </span>
        <button
          onClick={onAddSlide}
          title="Thêm slide mới"
          style={{
            background: '#7c3aed', border: 'none', borderRadius: 4,
            color: '#fff', cursor: 'pointer', padding: '3px 6px',
            display: 'flex', alignItems: 'center',
          }}
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Slide list */}
      <div style={{ flex: 1, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
        {slides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            onClick={() => onSelect(idx)}
            style={{
              position: 'relative',
              borderRadius: 6,
              border: `2px solid ${idx === activeIdx ? '#7c3aed' : '#1f2937'}`,
              cursor: 'pointer',
              overflow: 'hidden',
              aspectRatio: '16/9',
              transition: 'border-color 0.15s',
              background: '#0f172a',
              flexShrink: 0,
            }}
          >
            {/* Iframe thumbnail — render HTML đúng, không bị CSS override */}
            <iframe
              srcDoc={buildThumbSrcdoc(slide.html_content)}
              style={{
                width: '560%',   // scale down: 560% width → scale(1/5.6) ≈ 17.8%
                height: '560%',
                border: 'none',
                display: 'block',
                pointerEvents: 'none',
                transform: 'scale(0.178)',
                transformOrigin: 'top left',
              }}
              sandbox="allow-same-origin"
              title={`thumb-${idx}`}
              loading="lazy"
            />

            {/* Active overlay */}
            {idx === activeIdx && (
              <div style={{
                position: 'absolute', inset: 0,
                border: '2px solid #7c3aed',
                borderRadius: 4,
                pointerEvents: 'none',
              }} />
            )}

            {/* Slide number badge */}
            <div style={{
              position: 'absolute', bottom: 3, left: 4,
              background: 'rgba(0,0,0,0.7)',
              color: idx === activeIdx ? '#a78bfa' : '#9ca3af',
              fontSize: 9, borderRadius: 3, padding: '1px 4px',
              fontWeight: idx === activeIdx ? 700 : 400,
            }}>
              {idx + 1}
            </div>

            {/* Delete button */}
            {slides.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteSlide(idx); }}
                title="Xóa slide"
                style={{
                  position: 'absolute', top: 3, right: 3,
                  background: 'rgba(239,68,68,0.85)', border: 'none',
                  borderRadius: 3, color: '#fff', cursor: 'pointer',
                  padding: '2px 3px', display: 'flex', alignItems: 'center',
                  opacity: 0, transition: 'opacity 0.15s',
                }}
                className="slide-delete-btn"
              >
                <Trash2 size={9} />
              </button>
            )}
          </div>
        ))}
      </div>

      <style>{`
        div:hover > .slide-delete-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
