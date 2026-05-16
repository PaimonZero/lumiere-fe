/**
 * Lumiere AI — Left Panel
 * Tabs: Private Wiki | Conversation History
 * Bottom: Admin link (admin only), Logout, Theme Toggle
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Button, Empty, List, Popconfirm, Space, Spin, Tabs, Typography } from 'antd';
import { BookOpen, FileUp, MessageSquare, Plus, Settings, Shield, Trash2 } from 'lucide-react';
import WikiTree from '../wiki/WikiTree.jsx';
import SettingsModal from '../common/SettingsModal.jsx';
import {
  clearChat,
  fetchConversations,
  loadConversation,
  deleteConversationThunk,
} from '../../store/chatSlice.js';
import { selectUser } from '../../store/authSlice.js';
import { clearActiveContent } from '../../store/wikiSlice.js';

const TABS = [
  { id: 'conversations', label: 'Hội thoại', icon: MessageSquare },
  { id: 'wiki', label: 'Wiki', icon: BookOpen },
];

function ConversationList({ conversations, currentConvId, onSelect, onDelete }) {
  if (!conversations || conversations.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hội thoại nào" />;
  }

  return (
    <List
      size="small"
      dataSource={conversations}
      renderItem={(conv) => {
        const isActive = currentConvId === conv.id;
        return (
          <List.Item
            onClick={() => onSelect(conv.id)}
            className="cursor-pointer rounded-md"
            style={{
              marginBottom: 6,
              paddingInline: 10,
              border: '1px solid var(--color-border)',
              background: isActive ? 'var(--color-bg-card)' : 'transparent',
            }}
            actions={[
              <Popconfirm
                key="delete"
                title="Xóa hội thoại"
                description="Bạn có chắc muốn xóa hội thoại này?"
                okText="Xóa"
                cancelText="Hủy"
                onConfirm={(e) => {
                  e?.stopPropagation?.();
                  onDelete(conv.id);
                }}
              >
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<Trash2 size={14} />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>,
            ]}
          >
            <Space size={8} style={{ minWidth: 0 }}>
              <MessageSquare
                size={14}
                style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)', flexShrink: 0 }}
              />
              <Typography.Text
                ellipsis
                style={{ maxWidth: 170, color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
              >
                {conv.title}
              </Typography.Text>
            </Space>
          </List.Item>
        );
      }}
    />
  );
}

export default function LeftPanel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const conversations = useSelector((state) => state.chat.conversations);
  const currentConvId = useSelector((state) => state.chat.currentConversationId);
  
  const user = useSelector(selectUser);
  const [activeTab, setActiveTab] = useState('conversations');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null); // { name } while uploading

  const isAdmin = user?.role === 'admin';

  // Handle tab change — clear wiki editor when switching to conversations
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'conversations') {
      // Close wiki editor overlay when user switches to conversations tab
      dispatch(clearActiveContent());
    }
  };

  // Fetch conversations on mount
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Clear feedback message after a short duration
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // Listen for wiki tab switch events from CenterPanel (upload flow)
  useEffect(() => {
    const onSwitch = (e) => {
      setActiveTab('wiki');
      if (e.detail?.filename) setUploadingFile({ name: e.detail.filename });
    };
    const onDone = () => setUploadingFile(null);
    window.addEventListener('switch-wiki-tab', onSwitch);
    window.addEventListener('upload-wiki-done', onDone);
    return () => {
      window.removeEventListener('switch-wiki-tab', onSwitch);
      window.removeEventListener('upload-wiki-done', onDone);
    };
  }, []);

  const handleNewChat = () => {
    dispatch(clearChat());
    // Also close wiki editor if open
    dispatch(clearActiveContent());
  };

  const handleSelectConv = (id) => {
    dispatch(loadConversation(id));
    // Close wiki editor when switching to a conversation
    dispatch(clearActiveContent());
  };

  const handleDeleteConv = async (id) => {
    console.log('Attempting to delete conversation id:', id);
    try {
      await dispatch(deleteConversationThunk(id)).unwrap();
      console.log('Delete dispatched successfully');
      setFeedbackMsg('Đã xóa hội thoại');
    } catch (error) {
      console.error('Delete conversation failed:', error);
      alert('Có lỗi xảy ra khi xóa hội thoại: ' + error);
      setFeedbackMsg('Xóa hội thoại thất bại');
    }
  };

  return (
    <div className="flex flex-col h-full fade-in">
      {/* Tab switcher */}
      <Tabs
        size="small"
        activeKey={activeTab}
        onChange={handleTabChange}
        className="pt-2"
        style={{ paddingInline: '12px' }}
        items={TABS.map(({ id, label, icon: Icon }) => ({
          key: id,
          label: (
            <Space size={6}>
              <Icon size={14} />
              <span>{label}</span>
            </Space>
          ),
        }))}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-3" style={{ paddingInline: '10px' }}>
        {activeTab === 'conversations' && (
          <>
            {/* New conversation button — only on Chat tab */}
            <div className="py-3 shrink-0">
              <Button
                block
                size="middle"
                onClick={handleNewChat}
                icon={<Plus size={14} />}
                style={{
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-bg-base)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontWeight: 500,
                }}
              >
                Cuộc hội thoại mới
              </Button>
            </div>

            <ConversationList
              conversations={conversations}
              currentConvId={currentConvId}
              onSelect={handleSelectConv}
              onDelete={handleDeleteConv}
            />
          </>
        )}

        {activeTab === 'wiki' && (
          <div data-tour="wiki">
            {/* Loading item while a file is being uploaded */}
            {uploadingFile && (
              <div
                className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg"
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Spin size="small" />
                <FileUp size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <Typography.Text
                  ellipsis
                  style={{ fontSize: 12, color: 'var(--color-text-secondary)', flex: 1 }}
                >
                  {uploadingFile.name}
                </Typography.Text>
              </div>
            )}
            <WikiTree />
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="shrink-0 border-t flex flex-col gap-1 p-3" style={{ borderColor: 'var(--color-border)' }}>
        {/* Admin link — only visible to admin users */}
        {isAdmin && (
          <Button
            type="text"
            icon={<Shield size={14} />}
            onClick={() => navigate('/admin')}
            style={{ justifyContent: 'flex-start', color: 'var(--color-text-secondary)' }}
          >
            Admin Dashboard
          </Button>
        )}

        {/* Settings button */}
        <Button
          type="text"
          icon={<Settings size={14} />}
          onClick={() => setSettingsOpen(true)}
          style={{ justifyContent: 'flex-start', color: 'var(--color-text-secondary)' }}
        >
          Cài đặt
        </Button>

        {/* Feedback Message */}
        {feedbackMsg && (
          <Alert message={feedbackMsg} type="info" showIcon />
        )}
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} user={user} />
    </div>
  );
}
