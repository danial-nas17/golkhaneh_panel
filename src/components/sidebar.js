import React from "react";
import { Layout, Menu, Avatar, Button, Image } from "antd";
import "../App.css";
import {
  UserOutlined,
  ShoppingCartOutlined,
  DashboardOutlined,
  EditOutlined,
  HomeOutlined,
  PictureOutlined,
  CommentOutlined,
  FileTextOutlined,
  ProductOutlined,
  FormOutlined,
  ProfileOutlined,
  RadarChartOutlined,
  IssuesCloseOutlined,
  ContactsOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  MailOutlined,
  MessageOutlined,
  TruckOutlined,
  PercentageOutlined,
  CustomerServiceOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useTheme } from "../contexts/ThemeContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth";
import { usePermissions } from "../hook/usePermissions";
import logo from "../images/1.svg";

const { Sider } = Layout;
const { SubMenu } = Menu;

const Sidebar = ({ showModal, isMobile, onCloseMobile }) => {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const user = getCurrentUser();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const handleMenuClick = (path) => {
    if (isMobile) {
      onCloseMobile?.();
    }
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Custom styles for greenhouse theme
  const sidebarStyle = {
    background: isDarkMode
      ? "linear-gradient(180deg, #111827 0%, #1f2937 100%)"
      : "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
    borderRight: `2px solid ${isDarkMode ? "#374151" : "#e2e8f0"}`,
    boxShadow: isDarkMode
      ? "4px 0 12px rgba(0, 0, 0, 0.3)"
      : "4px 0 12px rgba(5, 150, 105, 0.1)",
  };

  const logoContainerStyle = {
    background: isDarkMode
      ? "linear-gradient(135deg, #374151, #4b5563)"
      : "linear-gradient(135deg, #ecfdf5, #d1fae5)",
    borderRadius: "16px",
    margin: "16px",
    padding: "20px",
    border: `2px solid ${isDarkMode ? "#4b5563" : "#bbf7d0"}`,
    boxShadow: isDarkMode
      ? "0 4px 12px rgba(0, 0, 0, 0.2)"
      : "0 4px 12px rgba(5, 150, 105, 0.1)",
  };

  const menuStyle = {
    background: "transparent",
    border: "none",
  };

  return (
    <Sider
      width={250}
      theme={isDarkMode ? "dark" : "light"}
      className={`h-screen ${isMobile ? "relative" : "fixed"} custom-scrollbar`}
      style={sidebarStyle}
    >
      {/* Logo Container with Greenhouse styling - Hidden on mobile */}
      {!isMobile && (
        <div
          className="flex items-center justify-center flex-col"
          style={logoContainerStyle}
        >
          <div className="relative">
            <img
              src={logo}
              className="w-[100px] h-[100px] rounded-full object-cover"
              alt="لوگو"
              style={{
                border: `3px solid ${isDarkMode ? "#059669" : "#10b981"}`,
                boxShadow: "0 4px 16px rgba(5, 150, 105, 0.2)",
              }}
            />
            {/* Green dot indicator */}
            <div
              className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                animation: "pulse 2s infinite",
              }}
            />
          </div>
          <div
            className={`mt-3 text-center ${
              isDarkMode ? "text-green-400" : "text-green-700"
            }`}
          >
            <div className="text-sm font-semibold">گلخانه هوشمند</div>
            <div className="text-xs opacity-75">مدیریت پیشرفته</div>
          </div>
        </div>
      )}

      <div
        style={{
          overflowY: "auto",
          maxHeight: isMobile ? "100vh" : "calc(100vh - 200px)",
          paddingRight: "4px",
        }}
        className="custom-scrollbar"
      >
        <Menu
          theme={isDarkMode ? "dark" : "light"}
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={["product", "orders"]}
          style={menuStyle}
          className="border-none greenhouse-menu"
        >
          {hasPermission("dashboard") && (
            <Menu.Item
              key="/"
              icon={<DashboardOutlined />}
              className="menu-item-greenhouse"
              style={{ margin: "2px 4px", borderRadius: "6px" }}
              onClick={() => {
                handleMenuClick("/");
                if (isMobile) onCloseMobile();
              }}
            >
              داشبورد
            </Menu.Item>
          )}

          {hasPermission("product") && (
            <SubMenu
              key="product"
              icon={<ShoppingCartOutlined />}
              title="محصولات"
              className="submenu-greenhouse"
              style={{
                margin: "4px 8px",
                borderRadius: "8px",
              }}
              onTitleClick={() => {
                if (isMobile) onCloseMobile();
              }}
            >
              {hasPermission("product") && (
                <Menu.Item
                  key="/products"
                  icon={<ShoppingCartOutlined />}
                  style={{ margin: "2px 4px", borderRadius: "6px" }}
                  onClick={() => {
                    handleMenuClick("/products");
                    if (isMobile) onCloseMobile();
                  }}
                >
                  محصولات
                </Menu.Item>
              )}
              {hasPermission("product") && (
                <Menu.Item
                  key="/productsVariation"
                  icon={<ShoppingCartOutlined />}
                  style={{ margin: "2px 4px", borderRadius: "6px" }}
                  onClick={() => {
                    handleMenuClick("/productsVariation");
                    if (isMobile) onCloseMobile();
                  }}
                >
                  تنوع محصولات
                </Menu.Item>
              )}
              {hasPermission("category") && (
                <Menu.Item
                  key="/category"
                  icon={<ProductOutlined />}
                  style={{ margin: "2px 4px", borderRadius: "6px" }}
                  onClick={() => {
                    handleMenuClick("/categories");
                    if (isMobile) onCloseMobile();
                  }}
                >
                  <Link to="/categories">دسته‌بندی</Link>
                </Menu.Item>
              )}
              {hasPermission("attribute") && (
                <Menu.Item
                  key="/attributes"
                  icon={<ProductOutlined />}
                  style={{ margin: "2px 4px", borderRadius: "6px" }}
                  onClick={() => {
                    handleMenuClick("/attributes");
                    if (isMobile) onCloseMobile();
                  }}
                >
                  ویژگی‌ها
                </Menu.Item>
              )}
            </SubMenu>
          )}

          {hasPermission("order") && (
            <SubMenu
              key="orders"
              icon={<ShoppingCartOutlined />}
              title="سفارشات"
              style={{
                margin: "4px 8px",
                borderRadius: "8px",
              }}
              onTitleClick={() => {
                if (isMobile) onCloseMobile();
              }}
            >
              {hasPermission("order") && (
                <Menu.Item
                  key="/orders"
                  icon={<ShoppingCartOutlined />}
                  style={{ margin: "2px 4px", borderRadius: "6px" }}
                  onClick={() => {
                    handleMenuClick("/orders");
                    if (isMobile) onCloseMobile();
                  }}
                >
                  سفارشات
                </Menu.Item>
              )}
              {hasPermission("order") && (
                <Menu.Item
                  key="/orders/manual"
                  icon={<ShoppingCartOutlined />}
                  style={{ margin: "2px 4px", borderRadius: "6px" }}
                  onClick={() => {
                    handleMenuClick("/orders/manual");
                    if (isMobile) onCloseMobile();
                  }}
                >
                  سفارش دستی
                </Menu.Item>
              )}
            </SubMenu>
          )}

          
                    {/* {hasPermission("subscription") && (
                      <Menu.Item
                        key="/subscription"
                        icon={<MailOutlined />}
                        style={{
                          margin: '4px 8px',
                          borderRadius: '8px',
                          height: '40px',
                          lineHeight: '40px',
                        }}
                        onClick={() => {
                          handleMenuClick("/subscription");
                          if (isMobile) onCloseMobile();
                        }}
                      >
                        اشتراک‌ها
                      </Menu.Item>
                    )} */}
          
                    {/* {hasPermission("ticket") && (
                      <Menu.Item
                        key="/tickets"
                        icon={<CustomerServiceOutlined />}
                        style={{
                          margin: '4px 8px',
                          borderRadius: '8px',
                          height: '40px',
                          lineHeight: '40px',
                        }}
                        onClick={() => {
                          handleMenuClick("/tickets");
                          if (isMobile) onCloseMobile();
                        }}
                      >
                        درخواست پشتیبانی
                      </Menu.Item>
                    )} */}
          
                    {hasPermission("users") && (
                      <Menu.Item
                        key="/users"
                        icon={<TeamOutlined />}
                        style={{ margin: "2px 4px", borderRadius: "6px" }}
                        onClick={() => {
                          handleMenuClick("/users");
                          if (isMobile) onCloseMobile();
                        }}
                      >
                        مدیریت کاربران
                      </Menu.Item>
                    )}
          
                    {hasPermission("roles") && (
                      <Menu.Item
                        key="/roles"
                        icon={<UserOutlined />}
                        style={{ margin: "2px 4px", borderRadius: "6px" }}
                        onClick={() => {
                          handleMenuClick("/roles");
                          if (isMobile) onCloseMobile();
                        }}
                      >
                        مدیریت نقش‌ها
                      </Menu.Item>
                    )}
          
                    {/* {hasPermission("setting") && (
                      <Menu.Item
                        key="/setting"
                        icon={<SettingOutlined />}
                        style={{
                          margin: '4px 8px',
                          borderRadius: '8px',
                          height: '40px',
                          lineHeight: '40px',
                        }}
                        onClick={() => {
                          handleMenuClick("/setting");
                          if (isMobile) onCloseMobile();
                        }}
                      >
                        تنظیمات
                      </Menu.Item>
                    )} */}
          <Menu.Item
            className="text-red-500 hover:text-red-600"
            danger
            key="logout"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{
              margin: "2px 4px",
              borderRadius: "8px",
              height: "40px",
              lineHeight: "40px",
              marginTop: "16px",
              background: isDarkMode
                ? "rgba(239, 68, 68, 0.1)"
                : "rgba(254, 226, 226, 0.5)",
              border: `1px solid ${
                isDarkMode
                  ? "rgba(239, 68, 68, 0.2)"
                  : "rgba(252, 165, 165, 0.3)"
              }`,
            }}
          >
            خروج
          </Menu.Item>
        </Menu>
      </div>

      <style jsx>{`
        .greenhouse-menu .ant-menu-item-selected {
          background: ${isDarkMode
            ? "rgba(5, 150, 105, 0.2)"
            : "rgba(5, 150, 105, 0.1)"} !important;
          border-left: 3px solid #059669 !important;
          color: #059669 !important;
          font-weight: 600 !important;
        }

        .greenhouse-menu .ant-menu-item:hover {
          background: ${isDarkMode
            ? "rgba(5, 150, 105, 0.1)"
            : "rgba(5, 150, 105, 0.05)"} !important;
          color: #059669 !important;
          transform: translateX(-2px);
          transition: all 0.3s ease;
        }

        .greenhouse-menu .ant-menu-submenu-selected > .ant-menu-submenu-title {
          color: #059669 !important;
          background: ${isDarkMode
            ? "rgba(5, 150, 105, 0.1)"
            : "rgba(5, 150, 105, 0.05)"} !important;
        }

        .greenhouse-menu .ant-menu-submenu:hover > .ant-menu-submenu-title {
          color: #059669 !important;
        }

        .greenhouse-menu .ant-menu-submenu-open > .ant-menu-submenu-title {
          color: #059669 !important;
          background: ${isDarkMode
            ? "rgba(5, 150, 105, 0.1)"
            : "rgba(5, 150, 105, 0.05)"} !important;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? "#374151" : "#f1f5f9"};
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #10b981, #059669);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #059669, #047857);
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </Sider>
  );
};

export default Sidebar;
