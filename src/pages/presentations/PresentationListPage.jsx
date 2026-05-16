/**
 * Trang danh sách Presentations — chọn hoặc tạo mới
 */
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Presentation, Trash2, Clock } from 'lucide-react';
import {
  fetchPresentations,
  createPresentation,
  deletePresentation,
  selectPresentationList,
  selectPresentationStatus,
  createEmptySlide,
} from '../../store/presentationSlice.js';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function PresentationListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const list = useSelector(selectPresentationList);
  const status = useSelector(selectPresentationStatus);

  useEffect(() => {
    dispatch(fetchPresentations());
  }, [dispatch]);

  const handleCreate = async () => {
    const result = await dispatch(createPresentation({
      title: 'Bài giảng mới',
      theme: 'black',
      slides: [createEmptySlide(0)],
      metadata: {},
    }));
    if (result.payload?.id) {
      navigate(`/presentations/${result.payload.id}`);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Xóa presentation này?')) return;
    dispatch(deletePresentation(id));
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a', color: '#f9fafb',
      padding: '40px 32px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Presentations</h1>
          <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>
            Tạo và quản lý bài trình chiếu với Reveal.js
          </p>
        </div>
        <button
          onClick={handleCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}
        >
          <Plus size={16} /> Tạo mới
        </button>
      </div>

      {/* Loading */}
      {status === 'loading' && (
        <div style={{ color: '#9ca3af', textAlign: 'center', padding: 40 }}>
          Đang tải...
        </div>
      )}

      {/* Empty state */}
      {status !== 'loading' && list.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          color: '#6b7280',
        }}>
          <Presentation size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#9ca3af' }}>
            Chưa có presentation nào
          </div>
          <div style={{ fontSize: 13, marginTop: 8 }}>
            Nhấn "Tạo mới" để bắt đầu
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {list.map((pres) => (
          <div
            key={pres.id}
            onClick={() => navigate(`/presentations/${pres.id}`)}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 12,
              padding: 20,
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#7c3aed';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#334155';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Thumbnail preview */}
            <div style={{
              background: '#0f172a',
              borderRadius: 8,
              aspectRatio: '16/9',
              marginBottom: 12,
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #1f2937',
            }}>
              {pres.slides?.[0]?.html_content ? (
                <div
                  style={{
                    transform: 'scale(0.25)', transformOrigin: 'center',
                    width: '400%', height: '400%',
                    padding: '20px 30px',
                    color: '#fff',
                    background: pres.slides[0].background || '#1a1a2e',
                    pointerEvents: 'none',
                  }}
                  dangerouslySetInnerHTML={{ __html: pres.slides[0].html_content }}
                />
              ) : (
                <Presentation size={32} color="#374151" />
              )}
            </div>

            {/* Info */}
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: '#f1f5f9' }}>
              {pres.title}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: 12 }}>
                {pres.slides?.length || 0} slides · {pres.theme}
              </span>
              <span style={{ color: '#64748b', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} />
                {formatDate(pres.updated_at)}
              </span>
            </div>

            {/* Delete button */}
            <button
              onClick={(e) => handleDelete(e, pres.id)}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 6, color: '#ef4444', cursor: 'pointer',
                padding: '4px 6px', display: 'flex', alignItems: 'center',
                opacity: 0, transition: 'opacity 0.15s',
              }}
              className="delete-btn"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        div:hover .delete-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
