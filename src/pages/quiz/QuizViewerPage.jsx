/**
 * QuizViewerPage — Renders an interactive HTML quiz page inside a secure iframe.
 * Requires authentication. Fetches quiz HTML from /api/quiz/:id/html.
 */
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Spin, Alert, Typography, Space, Tag } from "antd";
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons";
import apiClient from "../../services/apiClient";

const { Title, Text } = Typography;

export default function QuizViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);

  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch metadata
      const metaRes = await apiClient.get(`/api/quiz/${id}`);
      setMeta(metaRes.data);

      // Fetch HTML content
      const htmlRes = await apiClient.get(`/api/quiz/${id}/html`, {
        responseType: "text",
      });
      setHtmlContent(htmlRes.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login?redirect=/quiz/" + id);
      } else if (err.response?.status === 404) {
        setError("Quiz không tìm thấy hoặc bạn không có quyền truy cập.");
      } else {
        setError("Có lỗi xảy ra khi tải quiz. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;
    fetchQuiz();
  }, [fetchQuiz, id]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      iframeRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <Spin size="large" tip="Đang tải quiz..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorWrap}>
        <Alert
          type="error"
          message="Không thể tải quiz"
          description={error}
          action={
            <Space>
              <Button onClick={fetchQuiz} icon={<ReloadOutlined />}>
                Thử lại
              </Button>
              <Button onClick={() => navigate("/dashboard")}>
                Về Dashboard
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={styles.backBtn}
        >
          Quay lại
        </Button>
        <div style={styles.titleArea}>
          <Title level={4} style={styles.pageTitle}>
            {meta?.title || "Quiz"}
          </Title>
          {meta && (
            <Space size={6}>
              <Tag color="blue">{meta.question_count} câu hỏi</Tag>
              <Tag color="purple">{meta.theme}</Tag>
            </Space>
          )}
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchQuiz}
            type="text"
            style={styles.toolBtn}
          >
            Làm lại
          </Button>
          <Button
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={handleFullscreen}
            type="text"
            style={styles.toolBtn}
          >
            {isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          </Button>
        </Space>
      </div>

      {/* Quiz iframe */}
      <div style={styles.iframeWrap}>
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          style={styles.iframe}
          sandbox="allow-scripts allow-same-origin"
          title={meta?.title || "Quiz"}
        />
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          🔒 Quiz được bảo mật — chỉ bạn mới có thể xem
        </Text>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#0f172a",
    color: "#f1f5f9",
    fontFamily: "'Inter', sans-serif",
  },
  loadingWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#0f172a",
    flexDirection: "column",
    gap: 16,
  },
  errorWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#0f172a",
    padding: 40,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(15,23,42,0.95)",
    backdropFilter: "blur(12px)",
    gap: 16,
    zIndex: 10,
    minHeight: 60,
  },
  backBtn: {
    color: "#94a3b8",
    flexShrink: 0,
  },
  toolBtn: {
    color: "#94a3b8",
  },
  titleArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 0,
  },
  pageTitle: {
    margin: 0,
    color: "#f1f5f9",
    fontSize: 16,
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  iframeWrap: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
    background: "transparent",
  },
  footer: {
    padding: "8px 24px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    textAlign: "center",
    background: "rgba(15,23,42,0.8)",
  },
};
