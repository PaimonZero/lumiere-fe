/*
[DEPRECATED]
This entire file is deprecated as Slidev Markdown is no longer used in favor of the HTML Slide Builder (v2).
The code below is commented out to prevent usage.

import React, { useState } from 'react';
import { Copy, Maximize, MonitorPlay, QrCode, Check } from 'lucide-react';

export default function SlidevSharePanel({ shareUrl }) {
  const [copied, setCopied] = useState(false);

  if (!shareUrl) return null;

  const presenterUrl = `${shareUrl}?presenter`;
  const overviewUrl = `${shareUrl}?overview`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const btnClass = "flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border transition-all hover:bg-lumiere-bg-primary bg-lumiere-bg-secondary text-lumiere-text-primary";

  return (
    <div className="flex flex-wrap gap-2 mt-3" style={{ borderColor: 'var(--color-border)' }}>
      <button onClick={handleCopy} className={btnClass} title="Sao chép link">
        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        <span>{copied ? 'Đã chép' : 'Copy'}</span>
      </button>

      <a href={shareUrl} target="_blank" rel="noopener noreferrer" className={btnClass} title="Mở toàn màn hình">
        <Maximize size={14} />
        <span>Toàn màn hình</span>
      </a>

      <a href={presenterUrl} target="_blank" rel="noopener noreferrer" className={btnClass} title="Mở chế độ diễn giả">
        <MonitorPlay size={14} />
        <span>Diễn giả</span>
      </a>
      
      <a href={overviewUrl} target="_blank" rel="noopener noreferrer" className={btnClass} title="Mở chế độ tổng quan">
        <QrCode size={14} />
        <span>Tổng quan</span>
      </a>
    </div>
  );
}
*/
