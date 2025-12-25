import React, { useState } from "react";
import { Layout, Button, Modal, Form, Input, message, Switch, Spin } from "antd";
import { LogoutOutlined, BulbOutlined, MenuOutlined } from "@ant-design/icons";
import { useNavigate, Outlet } from "react-router-dom";
import { ConfigProvider } from "antd";
import { logout } from "../services/auth";
import { useUser } from "../contexts/UserContext";
import { useTheme } from "../contexts/ThemeContext";
import Sidebar from "./sidebar";
import { usePermissions } from "../hook/usePermissions";

const { Header, Content } = Layout;

const AppLayout = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [form] = Form.useForm();
  const { user, updateUser, loading } = useUser();
  const { hasPermission } = usePermissions();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      try {
        await updateUser(values);
        message.success("اطلاعات کاربر با موفقیت ویرایش شد");
        setIsModalVisible(false);
      } catch (error) {
        message.error("خطا در ویرایش اطلاعات کاربر");
      }
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <Spin size="large" className="text-green-600" />
      </div>
    );
  }

  // Greenhouse color theme
  const themeConfig = {
    token: {
      colorPrimary: '#059669', // Emerald-600
      colorSuccess: '#10b981', // Emerald-500
      colorWarning: '#f59e0b', // Amber-500
      colorError: '#ef4444', // Red-500
      colorInfo: '#3b82f6', // Blue-500
      borderRadius: 8,
      colorBgContainer: isDarkMode ? '#1f2937' : '#ffffff',
      colorBgElevated: isDarkMode ? '#374151' : '#f8fafc',
    },
    components: {
      Layout: {
        headerBg: isDarkMode ? '#1f2937' : '#fff',
        siderBg: isDarkMode ? '#111827' : '#fff',
        bodyBg: isDarkMode ? '#111827' : '#fff',
      },
      Menu: {
        itemBg: 'transparent',
        itemSelectedBg: isDarkMode ? 'rgba(5, 150, 105, 0.2)' : 'rgba(5, 150, 105, 0.1)',
        itemHoverBg: isDarkMode ? 'rgba(5, 150, 105, 0.1)' : 'rgba(5, 150, 105, 0.05)',
        itemSelectedColor: '#059669',
        itemHoverColor: '#059669',
        subMenuItemBg: 'transparent',
        itemActiveBg: isDarkMode ? 'rgba(5, 150, 105, 0.15)' : 'rgba(5, 150, 105, 0.08)',
      },
      Button: {
        primaryShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
      },
      Modal: {
        headerBg: isDarkMode ? '#1f2937' : '#ffffff',
        contentBg: isDarkMode ? '#1f2937' : '#ffffff',
      }
    },
  };

  // If user doesn't have dashboard, redirect to first allowed menu (fallback: invoices)
  // This only affects the default index redirect in App.js
  return (
    <ConfigProvider direction="rtl" theme={themeConfig}>
      <Layout className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        
        {/* Mobile Sidebar */}
        <div className="sm:hidden fixed top-4 left-4 z-50">
          <Button
            icon={<MenuOutlined />}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="shadow-lg border-green-200 hover:border-green-300 bg-white/90 backdrop-blur-sm"
            style={{ borderColor: '#bbf7d0' }}
          />
        </div>
        
        {/* Mobile Sidebar with Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 sm:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div 
              className="w-64 h-full transform transition-transform duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                user={user}
                showModal={showModal}
                isMobile={true}
                onCloseMobile={() => setIsSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <div className="hidden sm:block">
          <Sidebar user={user} showModal={showModal} isMobile={false} />
        </div>

        <Layout className="sm:mr-64">
          <Header
            className={`flex justify-between items-center border-b shadow-sm backdrop-blur-md ${
              isDarkMode
                ? "bg-gray-800/90 border-gray-600"
                : "bg-white/80 border-green-200"
            }`}
            style={{
              background: isDarkMode 
                ? 'rgba(31, 41, 55, 0.9)' 
                : '#fff',
            }}
          >
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              checkedChildren={<BulbOutlined />}
              unCheckedChildren={<BulbOutlined />}
              className="ml-4"
              style={{
                backgroundColor: isDarkMode ? '#059669' : undefined,
              }}
            />
            <Button
              type="primary"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="ml-4 shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #059669, #10b981)',
                borderColor: '#059669',
              }}
            >
              خروج
            </Button>
          </Header>
          
          <Content
            className={`p-6 overflow-auto ${
              isDarkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-green-50/50 to-emerald-50/30"
            }`}
            style={{
              minHeight: 'calc(100vh - 64px)',
              background: isDarkMode 
                ? 'linear-gradient(135deg, #111827, #1f2937)' 
                : '#fff',
            }}
          >
            <div className="max-w-full">
              <Outlet />
            </div>
          </Content>
        </Layout>

        <Modal
          title="ویرایش اطلاعات کاربر"
          open={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          className="greenhouse-modal"
          style={{
            top: 20,
          }}
          okButtonProps={{
            style: {
              background: 'linear-gradient(135deg, #059669, #10b981)',
              borderColor: '#059669',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
            }
          }}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              name: user?.name || "",
              email: user?.email || "",
            }}
          >
            <Form.Item
              name="name"
              label="نام"
              rules={[{ required: true, message: "لطفاً نام خود را وارد کنید!" }]}
            >
              <Input 
                className="hover:border-green-400 focus:border-green-500"
                style={{
                  borderColor: '#d1fae5',
                }}
              />
            </Form.Item>
            <Form.Item
              name="email"
              label="ایمیل"
              rules={[
                { required: true, message: "لطفاً ایمیل خود را وارد کنید!" },
                { type: "email", message: "لطفاً یک ایمیل معتبر وارد کنید!" },
              ]}
            >
              <Input 
                className="hover:border-green-400 focus:border-green-500"
                style={{
                  borderColor: '#d1fae5',
                }}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    </ConfigProvider>
  );
};

export default AppLayout;