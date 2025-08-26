import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Typography,
  Progress,
  Empty,
  message,
} from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import api from "../api";

const { Title } = Typography;

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/panel/dashboard");
      setDashboardData(response?.data);
    } catch (error) {
      console.error("خطا در دریافت اطلاعات داشبورد:", error);
      message.error("خطا در دریافت اطلاعات داشبورد");
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const columns = [
    {
      title: "شماره سفارش",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "مشتری",
      key: "customer",
      render: (_, record) => `${record?.user?.first_name} ${record?.user?.last_name}`,
    },
    {
      title: "مبلغ",
      dataIndex: "price",
      key: "price",
      render: (price) => `${price} تومان`,
    },
    {
      title: "وضعیت",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={
            status === "Completed"
              ? "success"
              : status === "Pending"
              ? "warning"
              : "processing"
          }
        >
          {status === "Completed"
            ? "تکمیل شده"
            : status === "Pending"
            ? "در انتظار"
            : "در حال پردازش"}
        </Tag>
      ),
    },
    {
      title: "تاریخ",
      dataIndex: "created_at",
      key: "created_at",
    },
  ];

  if (loading) {
    return <div>در حال بارگذاری...</div>;
  }

  if (!dashboardData) {
    return <Empty description="اطلاعاتی موجود نیست" />;
  }

  return (
    <div style={{ padding: "24px" }}>
      <Row gutter={[16, 16]}>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="کل درآمد"
              value={parseFloat(dashboardData?.total_revenue)}
              prefix={<DollarOutlined />}
              suffix="تومان"
              precision={2}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="تعداد سفارش‌ها"
              value={dashboardData?.orders_count}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="تعداد کاربران"
              value={dashboardData?.users_count}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="تعداد محصولات"
              value={dashboardData?.products_count}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: "#fa541c" }}
            />
          </Card>
        </Col>



        <Col xs={24} lg={16}>
          <Card title="درآمد و سود">
            <ResponsiveContainer width="100%" height={300}>
              {dashboardData?.monthly_revenue_and_profit?.length > 0 ? (
                <LineChart
                  data={dashboardData?.monthly_revenue_and_profit?.map((item) => ({
                    ...item,
                    total_revenue: parseFloat(item?.total_revenue.replace(/,/g, "")),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(value) => {
                      const [year, month] = value.split("-");
                      const date = new Date(year, month - 1);
                      return date.toLocaleDateString("fa-IR", {
                        month: "short",
                        year: "numeric",
                      });
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `${value.toFixed(2)} دلار`}
                    labelFormatter={(label) => {
                      const [year, month] = label.split("-");
                      const date = new Date(year, month - 1);
                      return date.toLocaleDateString("fa-IR", {
                        month: "long",
                        year: "numeric",
                      });
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_revenue"
                    name="درآمد"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_profit"
                    name="سود"
                    stroke="#82ca9d"
                    strokeWidth={2}
                  />
                </LineChart>
              ) : (
                <Empty description="اطلاعات درآمد موجود نیست" />
              )}
            </ResponsiveContainer>
          </Card>
        </Col>


        {/* <Col xs={24} lg={8}>
          <Card title="فروش بر اساس دسته‌بندی">
            <ResponsiveContainer width="100%" height={300}>
              {dashboardData?.category_sales &&
              dashboardData?.category_sales.length > 0 ? (
                <PieChart>
                  <Pie
                    data={dashboardData?.category_sales}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="total_sales"
                    nameKey="category"
                    label={(entry) =>
                      `${entry?.category} (${entry?.total_sales.toFixed(2)})`
                    }
                  >
                    {dashboardData?.category_sales?.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      `${parseFloat(value).toFixed(2)} دلار`
                    }
                  />
                  <Legend formatter={(value) => value} />
                </PieChart>
              ) : (
                <Empty description="اطلاعات دسته‌بندی موجود نیست" />
              )}
            </ResponsiveContainer>
          </Card>
        </Col> */}



        <Col xs={24}>
          <Card title="سفارشات اخیر">
            <Table
              columns={columns}
              dataSource={dashboardData?.latest_orders}
              pagination={false}
              rowKey="id"
              scroll={{ x: true }}
            />
          </Card>
        </Col>


        <Col xs={24} lg={12}>
          <Card title="سفارش‌های ماهانه">
            <ResponsiveContainer width="100%" height={300}>
              {dashboardData?.monthly_order_count?.length > 0 ? (
                <BarChart data={dashboardData?.monthly_order_count}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("fa-IR", {
                        month: "short",
                        year: "numeric",
                      });
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString("fa-IR", {
                        month: "long",
                        year: "numeric",
                      });
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total_orders" name="تعداد سفارش‌ها" fill="#8884d8" />
                </BarChart>
              ) : (
                <Empty description="اطلاعات سفارش موجود نیست" />
              )}
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
