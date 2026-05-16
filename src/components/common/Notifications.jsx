import { notification } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

let notifCount = 0;

// ── Animated Progress Bar (3 seconds) ──
function UploadProgressBar({ duration = 3000 }) {
  const [width, setWidth] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setWidth(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [duration]);

  return (
    <div
      style={{
        marginTop: 8,
        height: 4,
        borderRadius: 9999,
        background: 'rgba(16,185,129,0.15)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${width}%`,
          background: 'linear-gradient(90deg, #10b981, #059669)',
          borderRadius: 9999,
          transition: 'width 0.05s linear',
        }}
      />
    </div>
  );
}

export const notify = {
  uploadStart: (filename) => {
    const key = `upload-${++notifCount}`;
    notification.info({
      message: 'Đang tải lên...',
      description: `Đang xử lý ${filename}`,
      placement: 'topRight',
      duration: 0,
      key,
    });
    return key;
  },

  uploadProgress: (key, _progress) => {
    notification.info({
      message: 'Đang xử lý tài liệu...',
      placement: 'topRight',
      duration: 0,
      key,
    });
  },

  uploadSuccess: (key, filename, chunks) => {
    notification.success({
      message: 'Tải lên thành công! 🎉',
      description: (
        <div>
          <span style={{ fontSize: 13 }}>
            <strong>{filename}</strong> đã được chia thành {chunks} phần và lưu vào Wiki.
          </span>
          <UploadProgressBar duration={3000} />
        </div>
      ),
      placement: 'topRight',
      duration: 3.5,
      key,
    });
  },

  uploadError: (msg, key) => {
    notification.error({
      message: 'Lỗi tải lên',
      description: msg,
      placement: 'topRight',
      duration: 5,
      key,
    });
  },

  warning: (title, msg) => {
    notification.warning({
      message: title,
      description: msg,
      placement: 'topRight',
      duration: 4,
    });
  },

  info: (title, msg) => {
    notification.info({
      message: title,
      description: msg,
      placement: 'topRight',
      duration: 3,
    });
  },
};
