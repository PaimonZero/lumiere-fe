import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Grid,
  Input,
  Layout,
  Menu,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";
import {
  ArrowLeft,
  BookOpen,
  FileUp,
  Lock,
  Menu as MenuIcon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCcw,
  Shield,
  Trash2,
  Unlock,
  UserPlus,
  Users,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import MarkdownEditor from "../../components/common/MarkdownEditor.jsx";

const { Content, Sider } = Layout;
const { Text, Title } = Typography;
const { Dragger } = Upload;
const { useBreakpoint } = Grid;

function iconNode(Icon, size = 14) {
  return <Icon size={size} style={{ display: "block" }} aria-hidden="true" />;
}

const MENU_ITEMS = [
  { key: "users", icon: iconNode(Users, 16), label: "Người dùng" },
  { key: "knowledge", icon: iconNode(BookOpen, 16), label: "Kho tri thức chung" },
];

const ROLE_OPTIONS = [
  { value: "user", label: "Giáo viên" },
  { value: "admin", label: "Quản trị viên" },
];

const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "max", label: "Max" },
  { value: "unlimited", label: "Unlimited" },
];

const USER_DEFAULT_VALUES = {
  email: "",
  full_name: "",
  password: "",
  role: "user",
  plan: "free",
  is_blocked: false,
};

function getApiError(error, fallback = "Có lỗi xảy ra.") {
  return (
    error.response?.data?.detail ||
    error.response?.data?.error?.message ||
    error.response?.data?.message ||
    error.message ||
    fallback
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

function roleTag(role) {
  if (role === "admin") {
    return (
      <Tag color="purple" icon={iconNode(Shield, 12)}>
        Quản trị viên
      </Tag>
    );
  }
  return <Tag color="blue">Giáo viên</Tag>;
}

function getDocumentMarkdown(document) {
  return document?.markdown_content ?? document?.markdownContent ?? document?.markdown ?? "";
}

function getKnowledgeFormValues(document) {
  return {
    title: document?.title || "",
    filename: document?.filename || "",
    markdown: getDocumentMarkdown(document),
  };
}

function getUserFormValues(user) {
  if (!user) return USER_DEFAULT_VALUES;

  return {
    email: user.email || "",
    full_name: user.full_name || user.fullName || "",
    role: user.role || "user",
    plan: user.plan || "free",
    is_blocked: Boolean(user.is_blocked ?? user.isBlocked),
    password: "",
  };
}

export default function AdminPage() {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [messageApi, contextHolder] = message.useMessage();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activePage, setActivePage] = useState("users");

  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormInitialValues, setUserFormInitialValues] = useState(USER_DEFAULT_VALUES);
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [userForm] = Form.useForm();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploadForm] = Form.useForm();

  const [editKnowledgeOpen, setEditKnowledgeOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [knowledgeFormInitialValues, setKnowledgeFormInitialValues] = useState(getKnowledgeFormValues(null));
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [knowledgeSubmitting, setKnowledgeSubmitting] = useState(false);
  const [knowledgeForm] = Form.useForm();

  const [userSearch, setUserSearch] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      setUsers(await adminService.listUsers());
    } catch (error) {
      messageApi.error(getApiError(error, "Không thể tải danh sách người dùng."));
    } finally {
      setUsersLoading(false);
    }
  }, [messageApi]);

  const loadDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    try {
      setDocuments(await adminService.listSystemDocuments());
    } catch (error) {
      messageApi.error(getApiError(error, "Không thể tải kho tri thức chung."));
    } finally {
      setDocumentsLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    loadUsers();
    loadDocuments();
  }, [loadDocuments, loadUsers]);

  const openCreateUser = () => {
    const values = { ...USER_DEFAULT_VALUES };
    setEditingUser(null);
    setUserFormInitialValues(values);
    userForm.resetFields();
    userForm.setFieldsValue(values);
    setUserModalOpen(true);
  };

  const openEditUser = (record) => {
    const values = getUserFormValues(record);
    setEditingUser(record);
    setUserFormInitialValues(values);
    userForm.resetFields();
    userForm.setFieldsValue(values);
    setUserModalOpen(true);
  };

  const submitUser = async () => {
    const values = await userForm.validateFields();
    setUserSubmitting(true);
    try {
      const payload = { ...values };
      if (!payload.password) delete payload.password;

      if (editingUser) {
        await adminService.updateUser(editingUser.id, payload);
        messageApi.success("Đã cập nhật người dùng.");
      } else {
        await adminService.createUser(payload);
        messageApi.success("Đã tạo người dùng.");
      }

      setUserModalOpen(false);
      await loadUsers();
    } catch (error) {
      messageApi.error(getApiError(error, "Không thể lưu người dùng."));
    } finally {
      setUserSubmitting(false);
    }
  };

  const toggleBlockUser = async (record) => {
    try {
      if (record.is_blocked) {
        await adminService.unblockUser(record.id);
        messageApi.success("Đã mở khóa tài khoản.");
      } else {
        await adminService.blockUser(record.id);
        messageApi.success("Đã khóa tài khoản.");
      }
      await loadUsers();
    } catch (error) {
      messageApi.error(getApiError(error, "Không thể cập nhật trạng thái tài khoản."));
    }
  };

  const deleteUser = async (record) => {
    try {
      await adminService.deleteUser(record.id);
      messageApi.success("Đã xóa người dùng.");
      await loadUsers();
    } catch (error) {
      messageApi.error(getApiError(error, "Không thể xóa người dùng."));
    }
  };

  const openUploadKnowledge = () => {
    uploadForm.resetFields();
    setUploadModalOpen(true);
  };

  const parseUploadFile = async ({ file, onSuccess, onError }) => {
    setParsing(true);
    try {
      const result = await adminService.parseSystemDocument(file);
      uploadForm.setFieldsValue({
        title: result.title,
        filename: result.filename,
        file_key: result.file_key,
        markdown: result.markdown,
      });
      messageApi.success("Đã parse file. Vui lòng kiểm tra Markdown trước khi lưu.");
      onSuccess?.(result);
    } catch (error) {
      messageApi.error(getApiError(error, "Không thể parse file."));
      onError?.(error);
    } finally {
      setParsing(false);
    }
  };

  const submitUploadedKnowledge = async () => {
    const values = await uploadForm.validateFields();
    setUploadSubmitting(true);
    try {
      await adminService.createSystemDocument({
        title: values.title,
        filename: values.filename,
        file_key: values.file_key,
        markdown: values.markdown,
        metadata: { source: "admin_upload" },
      });
      messageApi.success("Đã thêm tài liệu vào kho tri thức chung.");
      setUploadModalOpen(false);
      await loadDocuments();
    } catch (error) {
      messageApi.error(getApiError(error, "Không thể lưu tài liệu."));
    } finally {
      setUploadSubmitting(false);
    }
  };

  const openEditKnowledge = async (record) => {
    const initialValues = getKnowledgeFormValues(record);
    knowledgeForm.resetFields();
    setEditingDocument(record);
    setKnowledgeFormInitialValues(initialValues);
    knowledgeForm.setFieldsValue(initialValues);
    setEditKnowledgeOpen(true);
    setKnowledgeLoading(true);
    try {
      const document = await adminService.getSystemDocument(record.id);
      const values = getKnowledgeFormValues(document);
      setEditingDocument(document);
      setKnowledgeFormInitialValues(values);
      knowledgeForm.setFieldsValue(values);
    } catch (error) {
      messageApi.error(getApiError(error, "Không thể tải tài liệu."));
      setEditKnowledgeOpen(false);
    } finally {
      setKnowledgeLoading(false);
    }
  };

  const submitKnowledgeEdit = async () => {
    const values = await knowledgeForm.validateFields();
    if (!editingDocument?.id) return;

    setKnowledgeSubmitting(true);
    try {
      await adminService.updateSystemDocument(editingDocument.id, {
        title: values.title,
        filename: values.filename,
        markdown_content: values.markdown,
      });
      messageApi.success("Đã cập nhật và reindex tài liệu.");
      setEditKnowledgeOpen(false);
      await loadDocuments();
    } catch (error) {
      messageApi.error(getApiError(error, "Không thể cập nhật tài liệu."));
    } finally {
      setKnowledgeSubmitting(false);
    }
  };

  const reindexDocument = async (record) => {
    try {
      await adminService.reindexSystemDocument(record.id);
      messageApi.success("Đã reindex tài liệu.");
      await loadDocuments();
    } catch (error) {
      messageApi.error(getApiError(error, "Không thể reindex tài liệu."));
    }
  };

  const deleteDocument = async (record) => {
    try {
      await adminService.deleteSystemDocument(record.id);
      messageApi.success("Đã xóa tài liệu khỏi kho chung.");
      await loadDocuments();
    } catch (error) {
      messageApi.error(getApiError(error, "Không thể xóa tài liệu."));
    }
  };

  const activeTitle = activePage === "users" ? "Quản lý người dùng" : "Kho tri thức chung";
  const activeDescription =
    activePage === "users"
      ? "Tạo, phân quyền, khóa/mở khóa và xóa tài khoản."
      : "Upload, kiểm tra Markdown và reindex tài liệu dùng chung cho RAG.";
  const blockedUsers = users.filter((user) => user.is_blocked).length;
  const activeUsers = users.length - blockedUsers;
  const totalChunks = documents.reduce((sum, document) => sum + (document.chunk_count || 0), 0);
  const normalizedUserSearch = userSearch.trim().toLowerCase();
  const normalizedDocumentSearch = documentSearch.trim().toLowerCase();
  const filteredUsers = normalizedUserSearch
    ? users.filter((user) =>
        [user.email, user.full_name, user.role, user.plan]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedUserSearch))
      )
    : users;
  const filteredDocuments = normalizedDocumentSearch
    ? documents.filter((document) =>
        [document.title, document.filename, document.metadata?.source]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedDocumentSearch))
      )
    : documents;
  const tableScrollY = isMobile ? "calc(100vh - 440px)" : "calc(100vh - 392px)";
  const tablePagination = {
    pageSize: 10,
    showSizeChanger: !isMobile,
    size: isMobile ? "small" : "default",
    style: {
      margin: 0,
      padding: isMobile ? "10px 12px" : "12px 16px",
      borderTop: "1px solid var(--color-border)",
    },
  };

  const handleMenuClick = ({ key }) => {
    setActivePage(key);
    if (isMobile) setMobileNavOpen(false);
  };

  const sidebarMenu = (
    <Menu
      mode="inline"
      selectedKeys={[activePage]}
      items={MENU_ITEMS}
      onClick={handleMenuClick}
      style={{ borderInlineEnd: 0, background: "transparent", paddingTop: 12 }}
    />
  );

  const userColumns = [
    {
      title: "Người dùng",
      dataIndex: "email",
      fixed: isMobile ? undefined : "left",
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar_url}>
            {(record.full_name || record.email || "?").slice(0, 1).toUpperCase()}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Text strong ellipsis style={{ maxWidth: isMobile ? 150 : 240 }}>
              {record.full_name || "Chưa đặt tên"}
            </Text>
            <br />
            <Text type="secondary" ellipsis style={{ maxWidth: isMobile ? 160 : 260, fontSize: 12 }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      width: 150,
      responsive: ["sm"],
      render: roleTag,
    },
    {
      title: "Gói / quota",
      dataIndex: "plan",
      width: 170,
      responsive: ["lg"],
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Tag color={record.plan === "free" ? "default" : "green"}>
            {(record.plan || "free").toUpperCase()}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Slide {record.slides_used || 0} · PDF {record.pdf_used || 0}
          </Text>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_blocked",
      width: 150,
      responsive: ["md"],
      render: (isBlocked) =>
        isBlocked ? <Tag color="red">Đã khóa</Tag> : <Tag color="success">Hoạt động</Tag>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      width: 180,
      responsive: ["xl"],
      render: formatDate,
    },
    {
      title: "Thao tác",
      width: isMobile ? 178 : 260,
      render: (_, record) => (
        <Space wrap size={[6, 6]}>
          <Button size="small" onClick={() => openEditUser(record)}>
            Sửa
          </Button>
          <Popconfirm
            title={record.is_blocked ? "Mở khóa tài khoản?" : "Khóa tài khoản?"}
            description={
              record.is_blocked
                ? "Người dùng sẽ có thể đăng nhập lại."
                : "Người dùng sẽ không thể truy cập hệ thống."
            }
            okText={record.is_blocked ? "Mở khóa" : "Khóa"}
            cancelText="Hủy"
            onConfirm={() => toggleBlockUser(record)}
          >
            <Button
              size="small"
              danger={!record.is_blocked}
              icon={record.is_blocked ? iconNode(Unlock) : iconNode(Lock)}
            >
              {record.is_blocked ? "Mở khóa" : "Khóa"}
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Xóa người dùng?"
            description="Thao tác này xóa dữ liệu liên quan và không thể hoàn tác."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteUser(record)}
          >
            <Button danger size="small" icon={iconNode(Trash2)} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const documentColumns = [
    {
      title: "Tài liệu",
      dataIndex: "title",
      fixed: isMobile ? undefined : "left",
      render: (_, record) => (
        <Space>
          <Avatar icon={iconNode(BookOpen, 16)} />
          <div style={{ minWidth: 0 }}>
            <Text strong ellipsis style={{ maxWidth: isMobile ? 170 : 320 }}>
              {record.title}
            </Text>
            <br />
            <Text type="secondary" ellipsis style={{ maxWidth: isMobile ? 170 : 320, fontSize: 12 }}>
              {record.filename}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Chunks",
      dataIndex: "chunk_count",
      width: 120,
      responsive: ["sm"],
      render: (count) => <Tag color="blue">{count || 0}</Tag>,
    },
    {
      title: "Cập nhật",
      dataIndex: "updated_at",
      width: 180,
      responsive: ["lg"],
      render: formatDate,
    },
    {
      title: "Nguồn",
      dataIndex: "metadata",
      width: 170,
      responsive: ["xl"],
      render: (metadata) => <Tag>{metadata?.source || "admin_upload"}</Tag>,
    },
    {
      title: "Thao tác",
      width: isMobile ? 210 : 260,
      render: (_, record) => (
        <Space wrap size={[6, 6]}>
          <Button size="small" onClick={() => openEditKnowledge(record)}>
            Sửa
          </Button>
          <Button size="small" icon={iconNode(RefreshCcw)} onClick={() => reindexDocument(record)}>
            Reindex
          </Button>
          <Popconfirm
            title="Xóa tài liệu?"
            description="Các chunks trong kho tri thức chung cũng sẽ bị xóa."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteDocument(record)}
          >
            <Button danger size="small" icon={iconNode(Trash2)} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "var(--color-bg-base)" }}>
      {contextHolder}

      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          width={260}
          collapsedWidth={84}
          style={{
            background: "var(--color-bg-card)",
            borderRight: "1px solid var(--color-border)",
            height: "100vh",
          }}
        >
          <div style={{ padding: 16, borderBottom: "1px solid var(--color-border)" }}>
            <Space style={{ width: "100%", justifyContent: collapsed ? "center" : "space-between" }}>
              {!collapsed && (
                <div>
                  <Text strong>Admin Dashboard</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Lumiere AI
                  </Text>
                </div>
              )}
              <Tooltip title={collapsed ? "Mở sidebar" : "Thu sidebar"}>
                <Button
                  type="text"
                  icon={collapsed ? iconNode(PanelLeftOpen, 18) : iconNode(PanelLeftClose, 18)}
                  onClick={() => setCollapsed((value) => !value)}
                />
              </Tooltip>
            </Space>
          </div>
          {sidebarMenu}
        </Sider>
      )}

      <Drawer
        title="Admin Dashboard"
        placement="left"
        width={280}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        {sidebarMenu}
      </Drawer>

      <Layout style={{ background: "transparent" }}>
        <Content style={{ minWidth: 0, height: "100vh", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              gap: isMobile ? 12 : 16,
              padding: isMobile ? 12 : 24,
            }}
          >
            <Card bordered styles={{ body: { padding: isMobile ? 16 : 20 } }}>
              <div
                style={{
                  display: "flex",
                  alignItems: isMobile ? "flex-start" : "center",
                  justifyContent: "space-between",
                  flexDirection: isMobile ? "column" : "row",
                  gap: 16,
                }}
              >
                <Space align="start" size={12}>
                  {isMobile && (
                    <Button icon={iconNode(MenuIcon, 16)} onClick={() => setMobileNavOpen(true)} />
                  )}
                  <Button icon={iconNode(ArrowLeft, 16)} onClick={() => navigate("/dashboard")}>
                    {isMobile ? "" : "Dashboard"}
                  </Button>
                  <div>
                    <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
                      {activeTitle}
                    </Title>
                    <Text type="secondary">{activeDescription}</Text>
                  </div>
                </Space>

                {activePage === "users" ? (
                  <Button type="primary" icon={iconNode(UserPlus, 16)} onClick={openCreateUser}>
                    Tạo người dùng
                  </Button>
                ) : (
                  <Button type="primary" icon={iconNode(FileUp, 16)} onClick={openUploadKnowledge}>
                    Tải tài liệu
                  </Button>
                )}
              </div>
            </Card>

            <Row gutter={[16, 16]}>
              {activePage === "users" ? (
                <>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Statistic title="Tổng người dùng" value={users.length} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Statistic title="Đang hoạt động" value={activeUsers} valueStyle={{ color: "#16a34a" }} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Statistic title="Đã khóa" value={blockedUsers} valueStyle={{ color: "#dc2626" }} />
                    </Card>
                  </Col>
                </>
              ) : (
                <>
                  <Col xs={24} sm={12}>
                    <Card size="small">
                      <Statistic title="Tài liệu chung" value={documents.length} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card size="small">
                      <Statistic title="Chunks đã index" value={totalChunks} />
                    </Card>
                  </Col>
                </>
              )}
            </Row>

            <Card
              bordered
              style={{ flex: 1, minHeight: 0 }}
              styles={{
                body: {
                  height: "100%",
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  padding: 0,
                },
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: isMobile ? "stretch" : "center",
                  justifyContent: "space-between",
                  flexDirection: isMobile ? "column" : "row",
                  gap: 12,
                  padding: isMobile ? 12 : "14px 16px",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <Space style={{ justifyContent: "space-between" }} wrap>
                  <Text strong>{activePage === "users" ? "Danh sách người dùng" : "Danh sách tài liệu"}</Text>
                </Space>
                <Input.Search
                  allowClear
                  placeholder={activePage === "users" ? "Tìm email, tên, vai trò..." : "Tìm tiêu đề, file, nguồn..."}
                  value={activePage === "users" ? userSearch : documentSearch}
                  onChange={(event) =>
                    activePage === "users"
                      ? setUserSearch(event.target.value)
                      : setDocumentSearch(event.target.value)
                  }
                  style={{ width: isMobile ? "100%" : 320 }}
                />
              </div>
              {activePage === "users" ? (
                <Table
                  rowKey="id"
                  columns={userColumns}
                  dataSource={filteredUsers}
                  loading={usersLoading}
                  pagination={tablePagination}
                  scroll={{ x: isMobile ? 720 : 980, y: tableScrollY }}
                  size="small"
                  style={{ flex: 1, minHeight: 0 }}
                  locale={{ emptyText: userSearch ? "Không tìm thấy người dùng phù hợp." : "Chưa có người dùng." }}
                />
              ) : (
                <Table
                  rowKey="id"
                  columns={documentColumns}
                  dataSource={filteredDocuments}
                  loading={documentsLoading}
                  pagination={tablePagination}
                  scroll={{ x: isMobile ? 700 : 900, y: tableScrollY }}
                  size="small"
                  style={{ flex: 1, minHeight: 0 }}
                  locale={{ emptyText: documentSearch ? "Không tìm thấy tài liệu phù hợp." : "Chưa có tài liệu." }}
                />
              )}
            </Card>
          </div>
        </Content>
      </Layout>

      <Modal
        title={editingUser ? "Chỉnh sửa người dùng" : "Tạo người dùng"}
        open={userModalOpen}
        onCancel={() => setUserModalOpen(false)}
        onOk={submitUser}
        confirmLoading={userSubmitting}
        okText="Lưu"
        cancelText="Hủy"
        width={isMobile ? "calc(100vw - 24px)" : 560}
        style={isMobile ? { top: 16 } : undefined}
        afterOpenChange={(open) => {
          if (open) {
            userForm.setFieldsValue(userFormInitialValues);
            return;
          }
          if (!open) {
            setEditingUser(null);
            userForm.resetFields();
          }
        }}
        destroyOnClose
      >
        <Form
          key={editingUser?.id || "create-user"}
          form={userForm}
          layout="vertical"
          preserve={false}
          initialValues={userFormInitialValues}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Vui lòng nhập email." }, { type: "email" }]}
          >
            <Input placeholder="teacher@example.com" />
          </Form.Item>
          <Form.Item name="full_name" label="Họ tên">
            <Input placeholder="Tên hiển thị" />
          </Form.Item>
          <Form.Item
            name="password"
            label={editingUser ? "Mật khẩu mới" : "Mật khẩu"}
            rules={
              editingUser
                ? []
                : [{ required: true, min: 6, message: "Mật khẩu tối thiểu 6 ký tự." }]
            }
          >
            <Input.Password placeholder={editingUser ? "Để trống nếu không đổi" : "Mật khẩu"} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="role" label="Vai trò">
                <Select options={ROLE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="plan" label="Gói">
                <Select options={PLAN_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="is_blocked" label="Khóa tài khoản" valuePropName="checked">
            <Switch checkedChildren="Đã khóa" unCheckedChildren="Hoạt động" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tải tài liệu vào kho tri thức chung"
        open={uploadModalOpen}
        onCancel={() => setUploadModalOpen(false)}
        onOk={submitUploadedKnowledge}
        okText="Lưu vào kho chung"
        cancelText="Hủy"
        width={isMobile ? "calc(100vw - 24px)" : 900}
        style={isMobile ? { top: 16 } : undefined}
        confirmLoading={uploadSubmitting}
        okButtonProps={{ disabled: parsing }}
        afterOpenChange={(open) => {
          if (!open) uploadForm.resetFields();
        }}
        destroyOnClose
      >
        <Form form={uploadForm} layout="vertical" preserve={false}>
          <Dragger
            maxCount={1}
            multiple={false}
            customRequest={parseUploadFile}
            showUploadList
            disabled={parsing}
          >
            <p className="ant-upload-drag-icon">
              <FileUp size={32} />
            </p>
            <p className="ant-upload-text">Kéo thả hoặc chọn file PDF/DOCX/PPTX</p>
            <p className="ant-upload-hint">
              File sẽ được parse thành Markdown để admin kiểm tra trước khi lưu.
            </p>
          </Dragger>

          <Form.Item name="file_key" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề." }]}
            style={{ marginTop: 16 }}
          >
            <Input placeholder="Tên tài liệu" />
          </Form.Item>
          <Form.Item
            name="filename"
            label="Tên file"
            rules={[{ required: true, message: "Vui lòng nhập tên file." }]}
          >
            <Input placeholder="ten-file.pdf" />
          </Form.Item>
          <Form.Item
            name="markdown"
            label="Markdown preview"
            rules={[{ required: true, message: "Vui lòng parse hoặc nhập Markdown." }]}
          >
            <MarkdownEditor
              height={isMobile ? 360 : 500}
              placeholder="Noi dung Markdown sau khi parse..."
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Chỉnh sửa tài liệu kho chung"
        open={editKnowledgeOpen}
        onCancel={() => setEditKnowledgeOpen(false)}
        onOk={submitKnowledgeEdit}
        okText="Lưu và reindex"
        cancelText="Hủy"
        width={isMobile ? "calc(100vw - 24px)" : 900}
        style={isMobile ? { top: 16 } : undefined}
        confirmLoading={knowledgeSubmitting}
        okButtonProps={{ disabled: knowledgeLoading || !editingDocument }}
        afterOpenChange={(open) => {
          if (open) {
            knowledgeForm.setFieldsValue(knowledgeFormInitialValues);
            return;
          }
          if (!open) {
            setEditingDocument(null);
            setKnowledgeLoading(false);
            knowledgeForm.resetFields();
          }
        }}
        destroyOnClose
      >
        <Form
          key={editingDocument?.id || "edit-knowledge"}
          form={knowledgeForm}
          layout="vertical"
          preserve={false}
          disabled={knowledgeLoading}
          initialValues={knowledgeFormInitialValues}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề." }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="filename"
            label="Tên file"
            rules={[{ required: true, message: "Vui lòng nhập tên file." }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="markdown"
            label="Markdown"
            rules={[{ required: true, message: "Vui lòng nhập Markdown." }]}
          >
            <MarkdownEditor
              height={isMobile ? 420 : 580}
              placeholder="Noi dung Markdown tai lieu..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
