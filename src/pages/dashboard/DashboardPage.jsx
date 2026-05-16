/**
 * Lumiere AI — Dashboard Page (3-Column Layout)
 * Left: Wiki + Conversation History
 * Center: Chat + CoT Visualizer
 * Right: AI Outputs (Slide/Recap/Quiz)
 */
import { useOutletContext } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { Layout, Typography } from 'antd';
import LeftPanel from '../../components/layout/LeftPanel.jsx';
import CenterPanel from '../../components/layout/CenterPanel.jsx';
import RightPanel from '../../components/layout/RightPanel.jsx';
import { useSelector, useDispatch } from 'react-redux';
import { selectWikiSelectedId } from '../../store/wikiSlice.js';
import { loadConversation, fetchConversations } from '../../store/chatSlice.js';
import QuickTour from '../../components/common/QuickTour.jsx';

const { Sider, Content } = Layout;
const WikiEditor = lazy(() => import('../../components/wiki/WikiEditor.jsx'));

// localStorage key for persisting last conversation
const LAST_CONV_KEY = 'lumiere_last_conv_id';

export default function DashboardPage() {
  const { leftOpen, rightOpen } = useOutletContext();
  const selectedWikiId = useSelector(selectWikiSelectedId);
  const currentConvId = useSelector((state) => state.chat.currentConversationId);
  const dispatch = useDispatch();

  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(320);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Auto-restore last conversation on mount (fixes quiz/slide disappearing after reload)
  useEffect(() => {
    // Always fetch conversation list first
    dispatch(fetchConversations());

    const lastConvId = localStorage.getItem(LAST_CONV_KEY);
    if (lastConvId) {
      dispatch(loadConversation(lastConvId))
        .unwrap()
        .catch(() => {
          // Conversation no longer exists or fetch failed — clear the stored ID
          localStorage.removeItem(LAST_CONV_KEY);
        });
    }
  }, [dispatch]);

  // Persist current conversation ID to localStorage whenever it changes
  useEffect(() => {
    if (currentConvId) {
      localStorage.setItem(LAST_CONV_KEY, currentConvId);
    }
  }, [currentConvId]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingLeft) {
        setLeftWidth(Math.max(200, Math.min(e.clientX, 600)));
      } else if (isDraggingRight) {
        setRightWidth(Math.max(250, Math.min(window.innerWidth - e.clientX, 800)));
      }
    };

    const handleMouseUp = () => {
      if (isDraggingLeft) setIsDraggingLeft(false);
      if (isDraggingRight) setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.userSelect = 'auto';
      document.body.style.cursor = 'default';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight]);

  return (
    <Layout className="flex-1 h-full min-h-0 overflow-hidden w-full relative" style={{ background: 'transparent' }}>
      {/* ── Left Panel ─────────────────────────────────── */}
      <Sider
        data-tour="left-panel"
        trigger={null}
        collapsible
        collapsed={!leftOpen}
        collapsedWidth={0}
        width={leftWidth}
        className={`overflow-hidden glass-panel border-r-0 ${!isDraggingLeft ? 'transition-all duration-300' : ''}`}
        style={{ background: 'transparent' }}
      >
        {leftOpen && <LeftPanel />}
      </Sider>

      {/* Left Resizer */}
      {leftOpen && (
        <div
          className="w-1 shrink-0 cursor-col-resize z-10 transition-colors"
          style={{ background: isDraggingLeft ? 'var(--color-ai-accent)' : 'var(--color-border)' }}
          onMouseDown={() => setIsDraggingLeft(true)}
          onMouseEnter={e => { if (!isDraggingLeft) e.currentTarget.style.background = 'var(--color-ai-accent-light)' }}
          onMouseLeave={e => { if (!isDraggingLeft) e.currentTarget.style.background = 'var(--color-border)' }}
        />
      )}

      {/* ── Center Panel ───────────────────────────────── */}
      <Content className="flex-1 h-full min-w-0 min-h-0 overflow-hidden relative flex flex-col p-0">
        <CenterPanel />
        {/* Render WikiEditor inside CenterPanel area if selected */}
        {selectedWikiId && (
          <Suspense
            fallback={
              <div
                className="absolute inset-0 z-20 flex items-center justify-center"
                style={{ background: 'var(--color-bg-elevated)' }}
              >
                <Typography.Text style={{ color: 'var(--color-text-muted)' }}>Đang mở Wiki Editor…</Typography.Text>
              </div>
            }
          >
            <WikiEditor />
          </Suspense>
        )}
      </Content>

      {/* Right Resizer */}
      {rightOpen && (
        <div
          className="w-1 shrink-0 cursor-col-resize z-10 transition-colors"
          style={{ background: isDraggingRight ? 'var(--color-ai-accent)' : 'var(--color-border)' }}
          onMouseDown={() => setIsDraggingRight(true)}
          onMouseEnter={e => { if (!isDraggingRight) e.currentTarget.style.background = 'var(--color-ai-accent-light)' }}
          onMouseLeave={e => { if (!isDraggingRight) e.currentTarget.style.background = 'var(--color-border)' }}
        />
      )}

      {/* ── Right Panel ────────────────────────────────── */}
      <Sider
        data-tour="right-panel"
        trigger={null}
        reverseArrow
        collapsible
        collapsed={!rightOpen}
        collapsedWidth={0}
        width={rightWidth}
        className={`overflow-hidden glass-panel border-l-0 ${!isDraggingRight ? 'transition-all duration-300' : ''}`}
        style={{ background: 'transparent' }}
      >
        {rightOpen && <RightPanel />}
      </Sider>
      {/* Quick Tour Overlay */}
      <QuickTour />
    </Layout>
  );
}
