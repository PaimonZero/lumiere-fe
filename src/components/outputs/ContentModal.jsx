/**
 * ContentModal — Hiển thị Markdown summary với preview đẹp và download (.md + .pdf).
 */
import { useState } from 'react';
import { Modal, Typography, Button, Space, Dropdown, Tooltip, message as antMessage } from 'antd';
import { DownloadOutlined, FileMarkdownOutlined, FilePdfOutlined, CopyOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import apiClient from '../../services/apiClient';

const { Text } = Typography;

export default function ContentModal({ open, onClose, title, content }) {
  const [pdfLoading, setPdfLoading] = useState(false);

  // ── Download as .md file ──
  const handleDownloadMd = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${_safeFilename(title)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    antMessage.success('Đã tải file Markdown');
  };

  // ── Download as PDF via backend ──
  const handleDownloadPdf = async () => {
    if (!content) return;
    setPdfLoading(true);
    try {
      const res = await apiClient.post(
        '/api/export/summary/pdf',
        { markdown: content, title: title || 'Tóm tắt bài học' },
        { responseType: 'blob' }
      );
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${_safeFilename(title)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      antMessage.success('Đã tải file PDF');
    } catch (err) {
      const msg = err.response?.status === 503
        ? 'Server chưa cài weasyprint. Tải .md thay thế.'
        : 'Không thể xuất PDF. Vui lòng thử lại.';
      antMessage.error(msg);
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Copy to clipboard ──
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content || '');
      antMessage.success('Đã copy vào clipboard');
    } catch {
      antMessage.error('Không thể copy');
    }
  };

  const downloadItems = [
    {
      key: 'md',
      icon: <FileMarkdownOutlined />,
      label: 'Tải Markdown (.md)',
      onClick: handleDownloadMd,
    },
    {
      key: 'pdf',
      icon: <FilePdfOutlined />,
      label: 'Tải PDF (.pdf)',
      onClick: handleDownloadPdf,
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 32 }}>
          <Text strong style={{ fontSize: 15 }}>{title || 'Tóm tắt bài học'}</Text>
          <Space size={8}>
            <Tooltip title="Copy nội dung">
              <Button
                size="small"
                icon={<CopyOutlined />}
                type="text"
                onClick={handleCopy}
              />
            </Tooltip>
            <Dropdown menu={{ items: downloadItems }} trigger={['click']} placement="bottomRight">
              <Button
                size="small"
                icon={<DownloadOutlined />}
                loading={pdfLoading}
                type="default"
                style={{ borderRadius: 6 }}
              >
                Tải xuống
              </Button>
            </Dropdown>
          </Space>
        </div>
      }
      styles={{
        body: {
          maxHeight: '70vh',
          overflowY: 'auto',
          padding: '16px 24px',
        },
      }}
    >
      {content ? (
        <div className="markdown-content" style={{ lineHeight: 1.8 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      ) : (
        <Text type="secondary">Không có nội dung để hiển thị.</Text>
      )}
    </Modal>
  );
}

function _safeFilename(title) {
  if (!title) return 'tom-tat';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f\u1e00-\u1eff\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50) || 'tom-tat';
}
