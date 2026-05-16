/**
 * Lumiere AI — Slide Viewer
 * Hiển thị presentation HTML trong iframe fullscreen.
 * Backend render HTML hoàn chỉnh tại /api/presentations/:id/html
 */
import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, ExternalLink, Download, RefreshCw, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  selectCurrentPresentation,
  fetchPresentation,
} from '../../store/presentationSlice.js';
import apiClient from '../../services/apiClient.js';
import { presentationService } from '../../services/presentationService.js';

export default function SlideViewer({ presentationId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const presentation = useSelector(selectCurrentPresentation);

  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  // Build the HTML endpoint URL (authenticated via token in header won't work in iframe src)
  // So we fetch the HTML and create a blob URL
  const [blobUrl, setBlobUrl] = useState(null);

  const loadHtml = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/presentations/${id}/html`, {
        responseType: 'text',
        headers: { Accept: 'text/html' },
      });
      const blob = new Blob([res.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Không thể tải slide');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (presentationId) {
      dispatch(fetchPresentation(presentationId));
      loadHtml(presentationId);
    }
  }, [dispatch, loadHtml, presentationId]);

  useEffect(() => () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);

  const handleReload = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setIframeKey(k => k + 1);
    loadHtml(presentationId);
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${presentation?.title || 'presentation'}.html`;
    a.click();
  };

  const handleOpenNew = () => {
    if (blobUrl) window.open(blobUrl, '_blank');
  };

  const handleExportPDF = async () => {
    if (!presentationId) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const blobObjectUrl = await presentationService.exportPDF(presentationId);
      const a = document.createElement('a');
      a.href = blobObjectUrl;
      a.download = `${presentation?.title || 'presentation'}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(blobObjectUrl), 10000);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Xuất PDF thất bại';
      setPdfError(msg);
      setTimeout(() => setPdfError(null), 5000);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0E1530',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '8px 16px', background: '#111827',
        borderBottom: '1px solid #1f2937', flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          title="Về Dashboard"
          style={{
            background: 'none', border: '1px solid #374151', borderRadius: 6,
            color: '#9ca3af', cursor: 'pointer', padding: '4px 10px',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
          }}
        >
          🏠 Dashboard
        </button>

        <button
          onClick={() => navigate('/presentations')}
          title="Danh sách presentations"
          style={{
            background: 'none', border: 'none', color: '#9ca3af',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, padding: '4px 8px', borderRadius: 6,
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#1f2937'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <ArrowLeft size={15} /> Danh sách
        </button>

        <div style={{ width: 1, height: 16, background: '#374151' }} />

        <span style={{ color: '#f9fafb', fontSize: 14, fontWeight: 500, flex: 1 }}>
          {presentation?.title || 'Đang tải...'}
        </span>

        <span style={{ color: '#6b7280', fontSize: 12 }}>
          {presentation?.slides?.length || 0} slides
        </span>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleReload}
            title="Tải lại"
            style={{
              background: 'none', border: '1px solid #374151', borderRadius: 6,
              color: '#9ca3af', cursor: 'pointer', padding: '4px 8px',
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
            }}
          >
            <RefreshCw size={13} /> Tải lại
          </button>
          <button
            onClick={handleOpenNew}
            title="Mở tab mới"
            style={{
              background: 'none', border: '1px solid #374151', borderRadius: 6,
              color: '#9ca3af', cursor: 'pointer', padding: '4px 8px',
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
            }}
          >
            <ExternalLink size={13} /> Mở rộng
          </button>
          <button
            onClick={handleDownload}
            title="Tải xuống HTML"
            style={{
              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              border: 'none', borderRadius: 6,
              color: '#fff', cursor: 'pointer', padding: '4px 10px',
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Download size={13} /> Tải HTML
          </button>
          <button
            onClick={handleExportPDF}
            disabled={pdfLoading}
            title="Xuất PDF"
            style={{
              background: pdfLoading
                ? '#374151'
                : 'linear-gradient(135deg,#dc2626,#b91c1c)',
              border: 'none', borderRadius: 6,
              color: '#fff', cursor: pdfLoading ? 'not-allowed' : 'pointer',
              padding: '4px 10px',
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
              fontWeight: 600, opacity: pdfLoading ? 0.7 : 1,
            }}
          >
            {pdfLoading
              ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Đang xuất...</>
              : <><FileText size={13} /> Xuất PDF</>
            }
          </button>
        </div>
      </div>

      {/* PDF error toast */}
      {pdfError && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#7f1d1d', border: '1px solid #dc2626',
          borderRadius: 8, padding: '10px 16px',
          color: '#fca5a5', fontSize: 13, maxWidth: 320,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          ⚠️ {pdfError}
        </div>
      )}

      {/* Iframe area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0E1530', color: '#9ca3af', flexDirection: 'column', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, border: '3px solid #374151',
              borderTopColor: '#818cf8', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: 14 }}>Đang render slide...</span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {error && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0E1530', color: '#f87171', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontSize: 32 }}>⚠️</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Không thể tải slide</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{error}</div>
            <button
              onClick={handleReload}
              style={{
                background: '#7c3aed', border: 'none', borderRadius: 8,
                color: '#fff', cursor: 'pointer', padding: '8px 16px', fontSize: 13,
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        {blobUrl && !loading && !error && (
          <iframe
            key={iframeKey}
            src={blobUrl}
            style={{
              width: '100%', height: '100%',
              border: 'none', display: 'block',
            }}
            title={presentation?.title || 'Presentation'}
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  );
}
