// Updated Sidebar.js
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
import logo from "../images/1.svg";

const { Sider } = Layout;
const { SubMenu } = Menu;

// Brand colors
const BRAND_DARK = "#223931"; // Dark green
const BRAND_PURPLE = "#582262"; // Purple

const Sidebar = ({ showModal, isMobile, onCloseMobile }) => {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const user = getCurrentUser();
  const navigate = useNavigate();

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

  // Updated styles with brand colors
  const sidebarStyle = {
    background: isDarkMode 
      ? `linear-gradient(180deg, ${BRAND_DARK} 0%, #1a2a23 100%)` 
      : `linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)`,
    borderRight: `2px solid ${isDarkMode ? BRAND_DARK : '#e2e8f0'}`,
    boxShadow: isDarkMode 
      ? '4px 0 12px rgba(0, 0, 0, 0.3)' 
      : `4px 0 12px ${BRAND_DARK}20`,
  };

  const logoContainerStyle = {
    background: isDarkMode
      ? `linear-gradient(135deg, ${BRAND_DARK}, #2a4538)`
      : `linear-gradient(135deg, #d1c2dd, ##D1C2DD)`,
    borderRadius: '16px',
    margin: '16px',
    padding: '20px',
    border: `2px solid ${isDarkMode ? '#2a4538' : '#d1e7dd'}`,
    boxShadow: isDarkMode
      ? '0 4px 12px rgba(0, 0, 0, 0.2)'
      : `0 4px 12px ${BRAND_DARK}20`,
  };

  const menuStyle = {
    background: 'transparent',
    border: 'none',
  };

  return (
    <Sider
      width={250}
      theme={isDarkMode ? "dark" : "light"}
      className={`h-screen ${isMobile ? "relative" : "fixed"} custom-scrollbar`}
      style={sidebarStyle}
    >
      {/* Logo Container with updated styling */}
      <div className="flex items-center justify-center flex-col" style={logoContainerStyle}>
        <div className="relative">
          <img 
            src={logo} 
            className="w-[100px] h-[100px] rounded-full object-cover" 
            alt="لوگو"
            style={{
              border: `3px solid ${isDarkMode ? BRAND_PURPLE : BRAND_PURPLE}`,
              boxShadow: `0 4px 16px ${BRAND_PURPLE}40`,
            }}
          />
          {/* Purple dot indicator */}
          <div 
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white"
            style={{
              background: `linear-gradient(135deg, ${BRAND_PURPLE}, #6a2c7a)`,
              animation: 'pulse 2s infinite',
            }}
          />
        </div>
        <div className={`mt-3 text-center ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
          <div className="text-sm font-semibold">گلخانه هوشمند</div>
          <div className="text-xs opacity-75">مدیریت پیشرفته</div>
        </div>
      </div>

      <div 
        style={{ 
          overflowY: "auto", 
          maxHeight: "calc(100vh - 200px)",
          paddingRight: '4px'
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
          <Menu.Item 
            key="/" 
            icon={<DashboardOutlined />}
            className="menu-item-greenhouse"
            style={{
              margin: '4px 8px',
              borderRadius: '8px',
              height: '40px',
              lineHeight: '40px',
            }}
          >
            <Link to="/">داشبورد</Link>
          </Menu.Item>

          <SubMenu
            key="product"
            icon={<ShoppingCartOutlined />}
            title="محصولات"
            className="submenu-greenhouse"
            style={{
              margin: '4px 8px',
              borderRadius: '8px',
            }}
          >
            <Menu.Item 
              key="/products" 
              icon={<ShoppingCartOutlined />}
              style={{ margin: '2px 4px', borderRadius: '6px' }}
            >
              <Link to="/products">محصولات</Link>
            </Menu.Item>
            <Menu.Item 
              key="/productsVariation" 
              icon={<ShoppingCartOutlined />}
              style={{ margin: '2px 4px', borderRadius: '6px' }}
            >
              <Link to="/productsVariation">تنوع محصولات</Link>
            </Menu.Item>
            <Menu.Item 
              key="/attributes" 
              icon={<ProductOutlined />}
              style={{ margin: '2px 4px', borderRadius: '6px' }}
            >
              <Link to="/attributes">ویژگی‌ها</Link>
            </Menu.Item>
          </SubMenu>

          <SubMenu 
            key="orders" 
            icon={<ShoppingCartOutlined />} 
            title="سفارشات"
            style={{
              margin: '4px 8px',
              borderRadius: '8px',
            }}
          >
            <Menu.Item 
              key="/orders" 
              icon={<ShoppingCartOutlined />}
              style={{ margin: '2px 4px', borderRadius: '6px' }}
            >
              <Link to="/orders">سفارشات</Link>
            </Menu.Item>
            <Menu.Item 
              key="/orders" 
              icon={<ShoppingCartOutlined />}
              style={{ margin: '2px 4px', borderRadius: '6px' }}
            >
              <Link to="/orders/manual">سفارش دستی</Link>
            </Menu.Item>
          </SubMenu>

          <Menu.Item 
            key="/subscription" 
            icon={<MailOutlined />}
            style={{
              margin: '4px 8px',
              borderRadius: '8px',
              height: '40px',
              lineHeight: '40px',
            }}
          >
            <Link to="/subscription">اشتراک‌ها</Link>
          </Menu.Item>

          <Menu.Item 
            key="/tickets" 
            icon={<CustomerServiceOutlined />}
            style={{
              margin: '4px 8px',
              borderRadius: '8px',
              height: '40px',
              lineHeight: '40px',
            }}
          >
            <Link to="/tickets">درخواست پشتیبانی</Link>
          </Menu.Item>

          <Menu.Item 
            key="/users" 
            icon={<TeamOutlined />}
            style={{
              margin: '4px 8px',
              borderRadius: '8px',
              height: '40px',
              lineHeight: '40px',
            }}
          >
            <Link to="/users">مدیریت کاربران</Link>
          </Menu.Item>

          <Menu.Item 
            key="/roles" 
            icon={<UserOutlined />}
            style={{
              margin: '4px 8px',
              borderRadius: '8px',
              height: '40px',
              lineHeight: '40px',
            }}
          >
            <Link to="/roles">مدیریت نقش‌ها</Link>
          </Menu.Item>

          <Menu.Item 
            key="/setting" 
            icon={<SettingOutlined />}
            style={{
              margin: '4px 8px',
              borderRadius: '8px',
              height: '40px',
              lineHeight: '40px',
            }}
          >
            <Link to="/setting">تنظیمات</Link>
          </Menu.Item>

          <Menu.Item
            className="text-red-500 hover:text-red-600"
            danger
            key="logout"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{
              margin: '8px',
              borderRadius: '8px',
              height: '40px',
              lineHeight: '40px',
              marginTop: '16px',
              background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(254, 226, 226, 0.5)',
              border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(252, 165, 165, 0.3)'}`,
            }}
          >
            خروج
          </Menu.Item>
        </Menu>
      </div>

      <style jsx>{`
        .greenhouse-menu .ant-menu-item-selected {
          background: ${isDarkMode ? `${BRAND_PURPLE}20` : `${BRAND_PURPLE}10`} !important;
          border-left: 3px solid ${BRAND_PURPLE} !important;
          color: ${BRAND_PURPLE} !important;
          font-weight: 600 !important;
        }
        
        .greenhouse-menu .ant-menu-item:hover {
          background: ${isDarkMode ? `${BRAND_PURPLE}10` : `${BRAND_PURPLE}05`} !important;
          color: ${BRAND_PURPLE} !important;
          transform: translateX(-2px);
          transition: all 0.3s ease;
        }
        
        .greenhouse-menu .ant-menu-submenu-selected > .ant-menu-submenu-title {
          color: ${BRAND_PURPLE} !important;
          background: ${isDarkMode ? `${BRAND_PURPLE}10` : `${BRAND_PURPLE}05`} !important;
        }
        
        .greenhouse-menu .ant-menu-submenu:hover > .ant-menu-submenu-title {
          color: ${BRAND_PURPLE} !important;
        }
        
        .greenhouse-menu .ant-menu-submenu-open > .ant-menu-submenu-title {
          color: ${BRAND_PURPLE} !important;
          background: ${isDarkMode ? `${BRAND_PURPLE}10` : `${BRAND_PURPLE}05`} !important;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? BRAND_DARK : '#f1f5f9'};
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, ${BRAND_PURPLE}, #6a2c7a);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #6a2c7a, ${BRAND_PURPLE});
        }
        
        @keyframes pulse {
          0%, 100% {
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