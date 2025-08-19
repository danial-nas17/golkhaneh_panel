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
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ConfigProvider direction="rtl">
      <Layout className="min-h-screen">
        
        {/* Mobile Sidebar */}
        <div className="sm:hidden fixed top-0 left-0 z-50">
          <Button
            icon={<MenuOutlined />}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </div>
        {/* Mobile Sidebar with Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden">
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
            className={`flex justify-between items-center border-b ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              checkedChildren={<BulbOutlined />}
              unCheckedChildren={<BulbOutlined />}
              className="ml-4"
            />
            <Button
              type="primary"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="ml-4"
            >
              خروج
            </Button>
          </Header>
          <Content
            className={`p-4 overflow-auto ${
              isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100"
            }`}
          >
            <Outlet />
          </Content>
        </Layout>

        <Modal
          title="ویرایش اطلاعات کاربر"
          open={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
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
              <Input />
            </Form.Item>
            <Form.Item
              name="email"
              label="ایمیل"
              rules={[
                { required: true, message: "لطفاً ایمیل خود را وارد کنید!" },
                { type: "email", message: "لطفاً یک ایمیل معتبر وارد کنید!" },
              ]}
            >
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    </ConfigProvider>
  );
};

export default AppLayout;
