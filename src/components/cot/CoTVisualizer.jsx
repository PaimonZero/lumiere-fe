/**
 * Lumiere AI - CoT Visualizer
 * Displays agent progress steps with source and image metadata.
 */
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Spin } from 'antd';
import {
  ImageGallery,
  SourceTags,
} from './TraceMetadata.jsx';
import {
  collectMetadataImages,
  collectMetadataSources,
  normalizeTraceStatus,
} from './traceMetadataUtils.js';

const STATUS_CONFIG = {
  running: { color: 'var(--color-ai-accent)' },
  success: { color: 'var(--color-success)' },
  warning: { color: '#f59e0b' },
  error: { color: 'var(--color-error)' },
};

function StatusIcon({ status, size = 16 }) {
  if (status === 'running') return <Spin size="small" />;
  if (status === 'success') return <CheckCircle size={size} style={{ color: 'var(--color-success)' }} />;
  if (status === 'error') return <AlertCircle size={size} style={{ color: 'var(--color-error)' }} />;
  return <AlertCircle size={size} style={{ color: '#f59e0b' }} />;
}

function CoTStep({ step, status, provider, isLast, metadata }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.running;
  const sources = collectMetadataSources(metadata);
  const images = collectMetadataImages(metadata);

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ color: config.color }}
        >
          <StatusIcon status={status} />
        </div>
        {!isLast && (
          <div
            className="w-px flex-1 mt-1"
            style={{
              height: '100%',
              minHeight: '16px',
              background: 'var(--color-border)',
            }}
          />
        )}
      </div>

      <div className="flex-1 pb-3">
        <p
          className="text-xs leading-relaxed font-medium"
          style={{ color: status === 'success' ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}
        >
          {step}
        </p>

        <SourceTags sources={sources} />
        <ImageGallery images={images} title={step || 'Hình ảnh minh họa'} thumbSize={{ width: 80, height: 60 }} />

        {provider && (
          <span
            className="text-xs mt-1 inline-block"
            style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
          >
            via {provider}
          </span>
        )}
      </div>
    </div>
  );
}

export default function CoTVisualizer({ steps = [], isLive = false }) {
  if (!steps.length) return null;

  const latestStatus = normalizeTraceStatus(steps[steps.length - 1]?.status, { isLive });

  return (
    <div
      className="mx-4 rounded-xl border px-4 py-3 slide-in-left"
      style={{
        background: 'var(--color-bg-elevated)',
        borderColor: 'rgba(99,102,241,0.25)',
        borderLeft: '3px solid var(--color-ai-accent)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <StatusIcon status={latestStatus} />
        <span
          className="text-xs font-semibold tracking-wide uppercase"
          style={{ color: 'var(--color-ai-accent)', fontFamily: 'var(--font-mono)' }}
        >
          Chain of Thought
        </span>
      </div>

      <div>
        {steps.map((step, i) => (
          <CoTStep
            key={step.id || `${step.step || step.message || step.title}-${i}`}
            step={step.step || step.message || step.title}
            status={normalizeTraceStatus(step.status, { isLive })}
            provider={step.provider}
            metadata={step.metadata}
            isLast={i === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
