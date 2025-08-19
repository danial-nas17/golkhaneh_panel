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
import logo from "../images/headerlogo.png";

const { Sider } = Layout;
const { SubMenu } = Menu;

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

  return (
    <Sider
      width={250}
      theme={isDarkMode ? "dark" : "light"}
      className={`h-screen ${isMobile ? "relative" : "fixed"} custom-scrollbar`}
      style={{
        borderRight: `1px solid ${isDarkMode ? "#303030" : "#f0f0f0"}`,
        overflowY: "auto",
      }}
    >
      <div className="flex items-center justify-center flex-col p-6">
        <img src={logo} className="w-[120px] rounded-[70px]" alt="لوگو" />
      </div>

      <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}>
        <Menu
          theme={isDarkMode ? "dark" : "light"}
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={["صفحه-اصلی", "محصول", "سفارشات"]}
        >
          <Menu.Item key="/" icon={<DashboardOutlined />}>
            <Link to="/">داشبورد</Link>
          </Menu.Item>

          <SubMenu
            key="product"
            icon={<ShoppingCartOutlined />}
            title="محصولات"
          >
            <Menu.Item key="/products" icon={<ShoppingCartOutlined />}>
              <Link to="/products">محصولات</Link>
            </Menu.Item>
            <Menu.Item key="/productsVariation" icon={<ShoppingCartOutlined />}>
              <Link to="/productsVariation">تنوع محصولات</Link>
            </Menu.Item>
            <Menu.Item key="/category" icon={<ProductOutlined />}>
              <Link to="/categories">دسته‌بندی</Link>
            </Menu.Item>
            <Menu.Item key="/brands" icon={<ProductOutlined />}>
              <Link to="/brands">برند</Link>
            </Menu.Item>
            <Menu.Item key="/attributes" icon={<ProductOutlined />}>
              <Link to="/attributes">ویژگی‌ها</Link>
            </Menu.Item>
            <Menu.Item key="/filters" icon={<ProductOutlined />}>
              <Link to="/filters">فیلترها</Link>
            </Menu.Item>
            <Menu.Item key="/global-properties" icon={<ProductOutlined />}>
              <Link to="/global-properties">مشخصات فنی</Link>
            </Menu.Item>
          </SubMenu>

          <SubMenu key="orders" icon={<ShoppingCartOutlined />} title="سفارشات">
            <Menu.Item key="/orders" icon={<ShoppingCartOutlined />}>
              <Link to="/orders">سفارشات</Link>
            </Menu.Item>
          </SubMenu>

          <Menu.Item key="/subscription" icon={<MailOutlined />}>
            <Link to="/subscription">اشتراک‌ها</Link>
          </Menu.Item>

          <Menu.Item key="/career" icon={<TruckOutlined />}>
            <Link to="/career">حامل‌ها</Link>
          </Menu.Item>


          {/* <SubMenu key="notifications" icon={<BellOutlined />} title="اعلان‌ها">
            <Menu.Item key="/notifications" icon={<BellOutlined />}>
              <Link to="/notifications">اعلان‌ها</Link>
            </Menu.Item>
            <Menu.Item key="/my_notifications" icon={<BellOutlined />}>
              <Link to="/my_notifications">اعلان‌های من</Link>
            </Menu.Item>
            <Menu.Item key="/unread_notifications" icon={<BellOutlined />}>
              <Link to="/unread_notifications">اعلان‌های خوانده نشده</Link>
            </Menu.Item>
          </SubMenu> */}

          <Menu.SubMenu key="blogs" icon={<FormOutlined />} title="وبلاگ">
            <Menu.Item key="/blogs">
              <Link to="/blogs">لیست وبلاگ‌ها</Link>
            </Menu.Item>
            <Menu.Item key="/blog-categories">
              <Link to="/blog-categories">دسته‌بندی وبلاگ</Link>
            </Menu.Item>
          </Menu.SubMenu>

          <Menu.SubMenu key="discounts" icon={<PercentageOutlined />} title="تخفیف‌ها">
            <Menu.Item key="/discounts">
              <Link to="/discounts"> کدهای تخفیف</Link>
            </Menu.Item>
            <Menu.Item key="/campaigns">
              <Link to="/campaigns"> کمپین‌ها</Link>
            </Menu.Item>
          </Menu.SubMenu>

          {/* <Menu.Item key="/gallery" icon={<PictureOutlined />}>
            <Link to="/gallery">گالری</Link>
          </Menu.Item> */}

          {/* <Menu.Item key="/contactUs" icon={<ContactsOutlined />}>
            <Link to="/contactUs">تماس با ما</Link>
          </Menu.Item> */}

          {/* <SubMenu key="landing" icon={<HomeOutlined />} title="صفحه اصلی">
            <Menu.Item key="/landing/banner" icon={<PictureOutlined />}>
              <Link to="/landing/banner">بنر</Link>
            </Menu.Item>
            <Menu.Item key="/landing/Faq" icon={<CommentOutlined />}>
              <Link to="/landing/faq_list">سوالات متداول</Link>
            </Menu.Item>
            <Menu.Item key="/landing/content" icon={<FileTextOutlined />}>
              <Link to="/landing/content">محتوا</Link>
            </Menu.Item>
            <Menu.Item key="/landing/seo" icon={<ProfileOutlined />}>
              <Link to="/landing/seo">سئو</Link>
            </Menu.Item>
          </SubMenu> */}

          {/* <SubMenu key="aboutUs" icon={<UserOutlined />} title="درباره ما">
            <Menu.Item key="/aboutUs" icon={<UserOutlined />}>
              <Link to="/aboutUS">درباره ما</Link>
            </Menu.Item>

            <Menu.Item key="/members" icon={<UserOutlined />}>
              <Link to="/members">اعضا</Link>
            </Menu.Item>
          </SubMenu> */}


          <Menu.Item key="/comments" icon={<MessageOutlined />}>
            <Link to="/comments">نظرات</Link>
          </Menu.Item>

          <Menu.Item key="/tickets" icon={<CustomerServiceOutlined />}>
            <Link to="/tickets">درخواست پشتیبانی</Link>
          </Menu.Item>

          <Menu.Item key="/users" icon={<TeamOutlined />}>
            <Link to="/users">مدیریت کاربران</Link>
          </Menu.Item>

          

          <Menu.Item key="/roles" icon={<UserOutlined />}>
            <Link to="/roles">مدیریت نقش‌ها</Link>
          </Menu.Item>

          <Menu.Item key="/setting" icon={<SettingOutlined />}>
            <Link to="/setting">تنظیمات</Link>
          </Menu.Item>

          <Menu.Item
            className="text-red-600"
            danger
            key="logout"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            خروج
          </Menu.Item>
        </Menu>
      </div>
    </Sider>
  );
};

export default Sidebar;
