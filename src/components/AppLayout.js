// Updated AppLayout.js
import React, { useState } from "react";
import { Layout, Button, Modal, Form, Input, message, Switch, Spin } from "antd";
import { LogoutOutlined, BulbOutlined, MenuOutlined } from "@ant-design/icons";
import { useNavigate, Outlet } from "react-router-dom";
import { ConfigProvider } from "antd";
import { logout } from "../services/auth";
import { useUser } from "../contexts/UserContext";
import { useTheme } from "../contexts/ThemeContext";
import Sidebar from "./sidebar";

const { Header, Content } = Layout;

// Brand colors
const BRAND_DARK = "#223931"; // Dark green
const BRAND_PURPLE = "#582262"; // Purple

const AppLayout = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [form] = Form.useForm();
  const { user, updateUser, loading } = useUser();
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

  // Updated theme configuration with brand colors
  const themeConfig = {
    token: {
      colorPrimary: BRAND_PURPLE,
      colorSuccess: BRAND_DARK,
      colorWarning: '#f59e0b',
      colorError: '#ef4444',
      colorInfo: '#3b82f6',
      borderRadius: 8,
      colorBgContainer: isDarkMode ? '#1f2937' : '#ffffff',
      colorBgElevated: isDarkMode ? '#374151' : '#f8fafc',
    },
    components: {
      Layout: {
        headerBg: isDarkMode ? BRAND_DARK : '#ffffff',
        siderBg: isDarkMode ? BRAND_DARK : '#f8fafc',
        bodyBg: isDarkMode ? '#111827' : '#f0fdf4',
      },
      Menu: {
        itemBg: 'transparent',
        itemSelectedBg: isDarkMode ? `${BRAND_PURPLE}20` : `${BRAND_PURPLE}10`,
        itemHoverBg: isDarkMode ? `${BRAND_PURPLE}10` : `${BRAND_PURPLE}05`,
        itemSelectedColor: BRAND_PURPLE,
        itemHoverColor: BRAND_PURPLE,
        subMenuItemBg: 'transparent',
        itemActiveBg: isDarkMode ? `${BRAND_PURPLE}15` : `${BRAND_PURPLE}08`,
      },
      Button: {
        primaryShadow: `0 2px 4px ${BRAND_PURPLE}20`,
      },
      Modal: {
        headerBg: isDarkMode ? BRAND_DARK : '#ffffff',
        contentBg: isDarkMode ? BRAND_DARK : '#ffffff',
      }
    },
  };

  return (
    <ConfigProvider direction="rtl" theme={themeConfig}>
      <Layout className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        
        {/* Mobile Sidebar */}
        <div className="sm:hidden fixed top-4 left-4 z-50">
          <Button
            icon={<MenuOutlined />}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="shadow-lg border-green-200 hover:border-green-300 bg-white/90 backdrop-blur-sm"
            style={{ borderColor: '##D1C2DD' }}
          />
        </div>#D1C2DD
        
        {/* Mobile Sidebar with Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 sm:hidden">
            <div className="w-64 h-full" onClick={(e) => e.stopPropagation()}>
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
          <Sidebar user={user} showModal={showModal} />
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
                ? `${BRAND_DARK}90` 
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.8))',
            }}
          >
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              checkedChildren={<BulbOutlined />}
              unCheckedChildren={<BulbOutlined />}
              className="ml-4"
              style={{
                backgroundColor: isDarkMode ? BRAND_PURPLE : undefined,
              }}
            />
            <Button
              type="primary"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="ml-4 shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${BRAND_PURPLE}, #6a2c7a)`,
                borderColor: BRAND_PURPLE,
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
                ? `linear-gradient(135deg, ${BRAND_DARK}, #1a2a23)` 
                : 'linear-gradient(135deg, rgba(240, 253, 244, 0.3), rgba(236, 253, 245, 0.5))',
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
              background: `linear-gradient(135deg, ${BRAND_PURPLE}, #6a2c7a)`,
              borderColor: BRAND_PURPLE,
              boxShadow: `0 2px 8px ${BRAND_PURPLE}30`,
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