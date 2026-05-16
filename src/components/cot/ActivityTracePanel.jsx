import { useState } from 'react';
import { AlertCircle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
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

function statusLabel(status, isLive) {
  if (status === 'running') return isLive ? 'Đang chạy' : 'Hoàn thành';
  if (status === 'success') return 'Hoàn thành';
  if (status === 'warning') return 'Cảnh báo';
  if (status === 'error') return 'Lỗi';
  return status;
}

function statusPillStyle(status) {
  if (status === 'error') {
    return { background: 'rgba(239,68,68,0.12)', color: 'var(--color-error)' };
  }
  if (status === 'warning') {
    return { background: 'rgba(245,158,11,0.12)', color: '#b45309' };
  }
  if (status === 'success') {
    return { background: 'rgba(16,185,129,0.12)', color: 'var(--color-success)' };
  }
  return { background: 'rgba(99,102,241,0.12)', color: 'var(--color-ai-accent)' };
}

function StatusIcon({ status }) {
  if (status === 'running') return <Spin size="small" />;
  if (status === 'success') return <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />;
  if (status === 'error') return <AlertCircle size={14} style={{ color: 'var(--color-error)' }} />;
  return <AlertCircle size={14} style={{ color: '#f59e0b' }} />;
}

export default function ActivityTracePanel({ steps = [], defaultCollapsed = true, isLive = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  if (!steps.length) return null;

  const latest = steps[steps.length - 1];
  const visibleSteps = collapsed ? [latest] : steps;
  const latestStatus = normalizeTraceStatus(latest.status, { isLive });

  return (
    <div
      className="rounded-xl border text-xs overflow-hidden"
      style={{
        background: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-border)',
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <span className="flex items-center gap-2 font-semibold">
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          Quá trình AI
          <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>
            {steps.length} bước
          </span>
        </span>
        <span className="rounded-md px-2 py-0.5" style={statusPillStyle(latestStatus)}>
          {statusLabel(latestStatus, isLive)}
        </span>
      </button>

      <div className="px-3 pb-2 space-y-3">
        {visibleSteps.map((step, index) => {
          const status = normalizeTraceStatus(step.status, { isLive });
          const sources = collectMetadataSources(step.metadata);
          const images = collectMetadataImages(step.metadata);

          return (
            <div key={step.id || `${step.timestamp}_${index}`} className="flex items-start gap-2">
              <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 14 }}>
                <StatusIcon status={status} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {step.title || step.message}
                </div>
                {step.message && step.message !== step.title && (
                  <div className="mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{step.message}</div>
                )}

                <SourceTags sources={sources} />
                <ImageGallery images={images} title={step.title || 'Hình ảnh minh họa'} />

                {(step.tool || step.phase) && (
                  <div className="mt-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                    {[step.phase, step.tool].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
