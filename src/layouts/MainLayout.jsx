/**
 * Lumiere AI — Main App Layout (3-Column Dashboard)
 * Left: Wiki/Conversations | Center: Chat+CoT | Right: Outputs
 */
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { Avatar, Button, Layout, Space, Tooltip, Typography } from 'antd';
import { logout, selectUser } from '../store/authSlice.js';
import { LogOut, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, HelpCircle, Sun, Moon, Zap } from 'lucide-react';
import useTheme from '../hooks/useTheme.js';
import apiClient from '../services/apiClient.js';

const { Header, Content } = Layout;

export default function MainLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { isLight, toggleTheme } = useTheme();
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [quota, setQuota] = useState(null);

  useEffect(() => {
    apiClient.get('/api/payments/quota')
      .then(r => setQuota(r.data))
      .catch(() => {});
  }, []);

  return (
    <Layout
      style={{ background: 'transparent' }}
      className="h-screen overflow-hidden bg-mesh-soft"
    >
      {/* ── Header ───────────────────────────────────────── */}
      <Header
        data-tour="header"
        className="flex items-center justify-between px-4 shrink-0 border-b"
        style={{
          height: 'var(--layout-header-height)',
          lineHeight: 'var(--layout-header-height)',
          background: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border)',
          paddingInline: '12px',
        }}
      >
        {/* Left: Logo + panel toggle */}
        <Space size={10}>
          <Tooltip title={leftOpen ? 'Collapse left panel' : 'Expand left panel'}>
            <Button
              type="text"
              onClick={() => setLeftOpen(!leftOpen)}
              icon={leftOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
              style={{ color: 'var(--color-text-primary)' }}
            />
          </Tooltip>

          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-primary)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
              </svg>
            </div>
            <Typography.Text
              style={{ 
                fontFamily: 'var(--font-display)', 
                color: 'var(--color-text-primary)',
                fontSize: '18px',
                fontWeight: 300,
                letterSpacing: '-0.32px'
              }}
            >
              Lumiere AI
            </Typography.Text>
          </div>
        </Space>

        {/* Right: User + actions */}
        <Space size={8}>
          {user && (
            <div className="flex items-center gap-2">
              {user.avatar_url ? (
                <Avatar src={user.avatar_url} alt={user.full_name || user.email} size={28} />
              ) : (
                <Avatar style={{ backgroundColor: 'var(--color-ai-accent)' }} size={28}>
                  {(user.full_name || user.email)[0].toUpperCase()}
                </Avatar>
              )}
              <Typography.Text className="hidden md:block" style={{ color: 'var(--color-text-secondary)' }}>
                {user.full_name || user.email}
              </Typography.Text>
            </div>
          )}

          <Tooltip title="Bắt đầu Quick Tour">
            <Button
              type="text"
              onClick={() => window.dispatchEvent(new CustomEvent('start-lumiere-tour'))}
              icon={<HelpCircle size={18} />}
              style={{ color: 'var(--color-text-primary)' }}
            />
          </Tooltip>

          {/* Quota / Upgrade button */}
          {quota && (
            <Tooltip title={
              quota.plan === 'unlimited'
                ? 'Gói Unlimited — Không giới hạn'
                : `Slide: ${quota.slides_used}/${quota.slides_limit === -1 ? '∞' : quota.slides_limit} · PDF: ${quota.pdf_used}/${quota.pdf_limit === -1 ? '∞' : quota.pdf_limit}`
            }>
              <button
                onClick={() => navigate('/pricing')}
                style={{
                  background: quota.plan === 'free'
                    ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                    : 'rgba(129,140,248,0.15)',
                  border: '1px solid rgba(129,140,248,0.4)',
                  borderRadius: 6,
                  cursor: 'pointer', padding: '3px 10px',
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                  color: quota.plan === 'free' ? '#fff' : '#a78bfa',
                }}
              >
                <Zap size={12} />
                {quota.plan === 'free' ? 'Nâng cấp' : quota.plan.toUpperCase()}
              </button>
            </Tooltip>
          )}

          <Tooltip title={isLight ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}>
            <Button
              type="text"
              onClick={toggleTheme}
              icon={isLight ? <Moon size={18} /> : <Sun size={18} />}
              style={{ color: 'var(--color-text-primary)' }}
            />
          </Tooltip>

          <Tooltip title="Logout">
            <Button type="text" danger onClick={() => dispatch(logout())} icon={<LogOut size={17} />} />
          </Tooltip>

          <Tooltip title={rightOpen ? 'Collapse right panel' : 'Expand right panel'}>
            <Button
              type="text"
              onClick={() => setRightOpen(!rightOpen)}
              icon={rightOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
              style={{ color: 'var(--color-text-primary)' }}
            />
          </Tooltip>
        </Space>
      </Header>

      {/* ── Body: 3-column layout ──────────────────────── */}
      <Content 
        className="flex flex-col flex-1 overflow-hidden min-h-0 relative"
        style={{ padding: 0 }}
      >
        <Outlet context={{ leftOpen, rightOpen }} />
      </Content>
    </Layout>
  );
}
