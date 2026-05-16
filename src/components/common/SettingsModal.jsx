import { Modal, Tabs, Avatar, Typography, Switch, Space, Divider } from 'antd';

export default function SettingsModal({ open, onClose, user }) {
  const tabItems = [
    {
      key: 'account',
      label: 'Tài khoản',
      children: (
        <Space direction="vertical" size={12} style={{ width: '100%', paddingTop: 8 }}>
          <Avatar
            size={64}
            src={user?.avatar_url}
            style={{ backgroundColor: 'var(--color-ai-accent)' }}
          >
            {(user?.full_name || user?.email || 'U')[0]?.toUpperCase()}
          </Avatar>
          <div>
            <Typography.Text strong style={{ fontSize: 16 }}>
              {user?.full_name || 'Người dùng'}
            </Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {user?.email}
            </Typography.Text>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Vai trò:{' '}
            <strong>
              {user?.role === 'admin' ? 'Quản trị viên' : 'Giáo viên'}
            </strong>
          </Typography.Text>
        </Space>
      ),
    },
    {
      key: 'features',
      label: 'Tính năng',
      children: (
        <Space direction="vertical" size={12} style={{ width: '100%', paddingTop: 8 }}>
          <div className="flex items-center justify-between">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Typography.Text>Chuẩn hoá dữ liệu tải lên</Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                AI làm sạch rác OCR và sửa Heading, Table trong Markdown
              </Typography.Text>
            </div>
            <Switch defaultChecked disabled />
          </div>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title="Cài đặt"
      open={open}
      onCancel={onClose}
      footer={null}
      width={420}
      centered
    >
      <Tabs items={tabItems} />
    </Modal>
  );
}
