/**
 * ContentModal — Hiển thị Markdown summary với preview đẹp và download (.md + .pdf).
 */
import { useState } from 'react';
import { Modal, Typography, Button, Space, Dropdown, Tooltip, message as antMessage } from 'antd';
import { DownloadOutlined, FileMarkdownOutlined, FilePdfOutlined, CopyOutlined } from '@ant-design/icons';
import apiClient from '../../services/apiClient';
import MarkdownRenderer from '../common/MarkdownRenderer.jsx';
import { repairMojibake, safeDownloadFilename } from '../../utils/textEncoding.js';

const { Text } = Typography;

export default function ContentModal({ open, onClose, title, content }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const displayTitle = repairMojibake(title || 'Tóm tắt bài học');

  // ── Download as .md file ──
  const handleDownloadMd = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${_safeFilename(displayTitle)}.md`;
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
        { markdown: content, title: displayTitle },
        { responseType: 'blob' }
      );
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${_safeFilename(displayTitle)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      antMessage.success('Đã tải file PDF');
    } catch (err) {
      const msg = err.response?.data?.error?.message ||
        'Khong the xuat PDF. Vui long kiem tra Chromium/Playwright tren server.';
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
          <Text strong style={{ fontSize: 15 }}>{displayTitle}</Text>
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
        <MarkdownRenderer style={{ lineHeight: 1.8 }}>{content}</MarkdownRenderer>
      ) : (
        <Text type="secondary">Không có nội dung để hiển thị.</Text>
      )}
    </Modal>
  );
}

function _safeFilename(title) {
  return safeDownloadFilename(title, 'tom-tat').toLowerCase();
}
