import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Carousel, Modal, Tag, Typography } from 'antd';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import MarkdownRenderer from '../common/MarkdownRenderer.jsx';
import {
  normalizeImage,
  sourceContent,
  sourceKey,
  sourceTitle,
  sourceUrl,
} from './traceMetadataUtils.js';

const { Paragraph } = Typography;

export function ImageGallery({ images = [], title, thumbSize = { width: 60, height: 40 } }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef(null);
  const normalizedImages = useMemo(() => images.map(normalizeImage).filter(Boolean), [images]);

  useEffect(() => {
    if (!modalOpen) return;
    const timer = window.setTimeout(() => {
      carouselRef.current?.goTo(activeIndex, false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeIndex, modalOpen]);

  if (!normalizedImages.length) return null;

  const openAt = (index) => {
    setActiveIndex(index);
    setModalOpen(true);
  };
  const moveTo = (nextIndex) => {
    const bounded = Math.max(0, Math.min(nextIndex, normalizedImages.length - 1));
    setActiveIndex(bounded);
    carouselRef.current?.goTo(bounded);
  };
  const visibleImages = normalizedImages.slice(0, 2);
  const hiddenCount = normalizedImages.length - 2;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        {visibleImages.map((img, idx) => (
          <button
            key={img.url}
            type="button"
            className="relative cursor-pointer overflow-hidden rounded border border-gray-200"
            style={{ width: thumbSize.width, height: thumbSize.height, padding: 0 }}
            onClick={() => openAt(idx)}
            aria-label={`Xem ảnh ${idx + 1}`}
          >
            <img src={img.url} alt={img.prompt || 'AI generated'} className="w-full h-full object-cover" />
          </button>
        ))}
        {hiddenCount > 0 && (
          <button
            type="button"
            className="flex items-center justify-center bg-gray-100 rounded border border-gray-200 cursor-pointer"
            style={{ width: thumbSize.width, height: thumbSize.height, fontSize: 12, fontWeight: 600, color: '#64748b' }}
            onClick={() => openAt(2)}
            aria-label={`Xem thêm ${hiddenCount} ảnh`}
          >
            +{hiddenCount}
          </button>
        )}
      </div>

      <Modal
        title={title || 'Hình ảnh minh họa'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={860}
        destroyOnClose
        centered
      >
        <div style={{ position: 'relative' }}>
          <Carousel
            ref={carouselRef}
            dots={normalizedImages.length > 1}
            infinite={false}
            afterChange={(index) => setActiveIndex(index)}
          >
            {normalizedImages.map((img, idx) => (
              <div key={img.url}>
                <div style={{ padding: '0 24px 12px', textAlign: 'center' }}>
                  <img
                    src={img.url}
                    alt={img.prompt || `Image ${idx + 1}`}
                    style={{ maxHeight: '60vh', maxWidth: '100%', margin: '0 auto', objectFit: 'contain', borderRadius: 8 }}
                  />
                  {img.prompt && <div className="mt-3 text-sm text-gray-500 italic px-8">{img.prompt}</div>}
                </div>
              </div>
            ))}
          </Carousel>

          {normalizedImages.length > 1 && (
            <div className="mt-3 flex items-center justify-center gap-3">
              <Button
                icon={<ChevronLeft size={16} />}
                onClick={() => moveTo(activeIndex - 1)}
                disabled={activeIndex === 0}
                aria-label="Ảnh trước"
              />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {activeIndex + 1} / {normalizedImages.length}
              </span>
              <Button
                icon={<ChevronRight size={16} />}
                onClick={() => moveTo(activeIndex + 1)}
                disabled={activeIndex === normalizedImages.length - 1}
                aria-label="Ảnh sau"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function SourceContentModal({ source, open, onClose }) {
  if (!source) return null;
  const title = sourceTitle(source);
  const content = sourceContent(source);
  const url = sourceUrl(source);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{title}</span>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-ai-accent)' }}>
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
      destroyOnClose
      centered
      styles={{ body: { maxHeight: '66vh', overflowY: 'auto', padding: '16px 24px' } }}
    >
      {content ? (
        <MarkdownRenderer style={{ fontSize: 14, lineHeight: 1.8 }}>
          {content}
        </MarkdownRenderer>
      ) : (
        <Paragraph type="secondary" italic>
          Không có nội dung chi tiết trong metadata của nguồn này.
        </Paragraph>
      )}
      {url && (
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--color-ai-accent)' }}>
            Xem bài gốc trên Wikipedia
          </a>
        </div>
      )}
    </Modal>
  );
}

export function SourceTags({ sources = [] }) {
  const [selectedSource, setSelectedSource] = useState(null);
  const normalizedSources = useMemo(() => sources.filter(Boolean), [sources]);

  if (!normalizedSources.length) return null;

  return (
    <>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {normalizedSources.map((source) => (
          <Tag
            key={sourceKey(source)}
            color="blue"
            bordered={false}
            style={{ margin: 0, fontSize: 10, cursor: 'pointer' }}
            onClick={() => setSelectedSource(source)}
          >
            {sourceTitle(source)}
          </Tag>
        ))}
      </div>
      <SourceContentModal
        source={selectedSource}
        open={Boolean(selectedSource)}
        onClose={() => setSelectedSource(null)}
      />
    </>
  );
}
