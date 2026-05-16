import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Loader, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { generateAIImage, searchWebImages } from '../../services/presentationService.js';

export default function NanoBananaWidget({ position, slideContext, onInsertImage, onClose }) {
  const [mode, setMode] = useState('ai');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [webResults, setWebResults] = useState([]);
  const [promptUsed, setPromptUsed] = useState('');
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const left = Math.min(position.x, window.innerWidth - 400);
  const top = Math.min(position.y, window.innerHeight - 520);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    setWebResults([]);

    try {
      if (mode === 'ai') {
        const result = await generateAIImage(prompt.trim(), slideContext || '');
        setPreview(result.image_url);
        setPromptUsed(result.prompt_used);
      } else {
        const result = await searchWebImages(prompt.trim(), 6);
        setWebResults(result.images || []);
        setPromptUsed(prompt.trim());
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Khong the lay anh.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (preview) onInsertImage(preview, promptUsed);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setPreview(null);
    setWebResults([]);
    setError(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        width: 380,
        background: '#1e1e2e',
        border: '1px solid #7c3aed',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
        padding: 16,
        zIndex: 9999,
        color: '#fff',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} color="#a78bfa" />
          GPT Image 2 - Image
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[
          ['ai', 'AI'],
          ['web', 'Web'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => switchMode(value)}
            style={{
              flex: 1,
              padding: '6px 0',
              borderRadius: 7,
              border: mode === value ? '1px solid #a78bfa' : '1px solid #4b5563',
              background: mode === value ? '#312e81' : '#2d2d3f',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {slideContext && (
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8, background: '#2d2d3f', borderRadius: 6, padding: '4px 8px' }}>
          Context: {slideContext.slice(0, 80)}{slideContext.length > 80 ? '...' : ''}
        </div>
      )}

      <textarea
        ref={inputRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate();
          if (e.key === 'Escape') onClose();
        }}
        placeholder={mode === 'ai'
          ? 'Mo ta anh muon tao...\nVD: Ban do chau Au nam 1914 voi cac lien minh quan su'
          : 'Nhap tu khoa tim anh web...\nVD: photosynthesis diagram'}
        style={{
          width: '100%', height: 80, borderRadius: 8, padding: '8px 10px',
          background: '#2d2d3f', border: '1px solid #4b5563',
          color: '#fff', fontSize: 13, resize: 'none', outline: 'none',
          fontFamily: 'inherit',
        }}
      />

      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, marginBottom: 10 }}>
        Ctrl+Enter de {mode === 'ai' ? 'tao anh' : 'tim anh'}
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        style={{
          width: '100%', padding: '9px 0',
          background: loading || !prompt.trim() ? '#374151' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          color: loading || !prompt.trim() ? '#6b7280' : '#fff',
          borderRadius: 8, border: 'none', cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
          fontWeight: 600, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        {loading ? (
          <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> {mode === 'ai' ? 'Dang tao anh...' : 'Dang tim anh...'}</>
        ) : mode === 'ai' ? (
          <><Sparkles size={14} /> Tao anh voi GPT Image 2</>
        ) : (
          <><Search size={14} /> Tim anh tren web</>
        )}
      </button>

      {error && (
        <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: '#3f1515', border: '1px solid #ef4444', color: '#fca5a5', fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
          {error}
        </div>
      )}

      {preview && (
        <div style={{ marginTop: 12 }}>
          <img src={preview} alt="AI Generated" style={{ width: '100%', borderRadius: 8, border: '1px solid #4b5563', maxHeight: 200, objectFit: 'contain', background: '#111' }} />
          <button onClick={handleInsert} style={{ width: '100%', marginTop: 8, padding: '9px 0', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <CheckCircle size={14} /> Chen vao slide
          </button>
        </div>
      )}

      {webResults.length > 0 && (
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 230, overflowY: 'auto' }}>
          {webResults.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              onClick={() => onInsertImage(img.url, img.alt || promptUsed)}
              style={{ padding: 0, border: '1px solid #4b5563', borderRadius: 8, overflow: 'hidden', background: '#111827', cursor: 'pointer' }}
              title={img.alt || 'Web image'}
            >
              <img src={img.thumb_url || img.url} alt={img.alt || 'Web result'} style={{ width: '100%', height: 92, objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
