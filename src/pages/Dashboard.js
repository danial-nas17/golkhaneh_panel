import React, { useState, useEffect } from "react";
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
  Spin,
  Space,
  Badge,
  Avatar,
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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  GiftOutlined,
  RiseOutlined,
  FallOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  TeamOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../api";
import UnifiedErrorHandler from "../utils/unifiedErrorHandler";
import { usePermissions } from "../hook/usePermissions";

const { Title, Text } = Typography;

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userRole } = usePermissions();
  const navigate = useNavigate();

  const isCustomer = userRole && (
    userRole.toLowerCase().includes('customer') ||
    userRole === 'customer' ||
    userRole === 'customer_staff' ||
    userRole === 'Customer' ||
    userRole === 'Customer_Staff'
  );

  useEffect(() => {
    fetchDashboardData();
  }, [userRole]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const endpoint = isCustomer ? "/panel/dashboard/shop" : "/panel/dashboard";
      const response = await api.get(endpoint);
      setDashboardData(response?.data);
    } catch (error) {
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در دریافت اطلاعات داشبورد"
      });
      console.error("خطا در دریافت اطلاعات داشبورد:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    return num.toLocaleString('fa-IR');
  };

  const formatCurrency = (num) => {
    if (!num) return "۰";
    return Math.abs(num).toLocaleString('fa-IR');
  };

  // Format axis numbers - show in millions for large values
  const formatAxisValue = (value) => {
    if (value === 0) return "۰";
    if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toLocaleString('fa-IR', { maximumFractionDigits: 1 }) + ' م';
    }
    if (Math.abs(value) >= 1000) {
      return (value / 1000).toLocaleString('fa-IR', { maximumFractionDigits: 0 }) + ' ه';
    }
    return value.toLocaleString('fa-IR');
  };

  const statusColors = {
    OPEN: "#3b82f6",
    COMPLETED: "#10b981",
  };

  const statusTranslations = {
    OPEN: "باز",
    COMPLETED: "تکمیل شده",
  };

  const paymentTypeTranslations = {
    cash: "نقدی",
    credit: "اعتباری",
    card_to_card: "کارت به کارت",
    cheque: "چک",
    other: "سایر"
  };

  const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Text strong style={{ display: 'block', marginBottom: 8, color: '#1f2937' }}>
            {label}
          </Text>
          {payload.map((entry, index) => (
            <div key={index} style={{ marginBottom: 4 }}>
              <Text style={{ color: entry.color }}>
                {entry.name}: <Text strong>{formatNumber(entry.value)}</Text>
                {entry.unit || ' تومان'}
              </Text>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div
        dir="rtl"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          fontFamily: "MyCustomFont, sans-serif",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div
        dir="rtl"
        style={{
          padding: "24px",
          minHeight: "60vh",
          fontFamily: "MyCustomFont, sans-serif",
        }}
      >
        <Empty description="اطلاعاتی موجود نیست" />
      </div>
    );
  }

  // Customer Dashboard
  if (isCustomer && dashboardData) {
    const { date_info, sales, invoices, discounts, customers, latest_invoices, daily_sales, top_products, payment_stats } = dashboardData;

    // Prepare payment pie chart data
    const paymentPieData = payment_stats?.map((stat, idx) => ({
      name: paymentTypeTranslations[stat.payment_type] || stat.payment_type,
      value: stat.total_amount,
      count: stat.count
    })) || [];

    const latestInvoicesColumns = [
      {
        title: "شماره فاکتور",
        dataIndex: "invoice_number",
        key: "invoice_number",
        render: (text) => (
          <Space>
            <Avatar size="small" style={{ background: '#f0f9ff', color: '#0369a1' }}>
              <FileTextOutlined />
            </Avatar>
            <Text strong style={{ color: '#0f172a' }}>{text}</Text>
          </Space>
        ),
      },
      {
        title: "مشتری",
        dataIndex: "customer",
        key: "customer",
        render: (customer) => (
          <Space>
            <Avatar size="small" style={{ background: '#fef3c7', color: '#d97706' }}>
              <UserOutlined />
            </Avatar>
            <Text>{customer?.name || "—"}</Text>
          </Space>
        ),
      },
      {
        title: "وضعیت",
        dataIndex: "status",
        key: "status",
        render: (status) => (
          <Badge 
            status={status === 'COMPLETED' ? 'success' : 'processing'} 
            text={
              <Text style={{ fontWeight: 500 }}>
                {statusTranslations[status]}
              </Text>
            } 
          />
        ),
      },
      {
        title: "مبلغ",
        dataIndex: "discounted_total",
        key: "amount",
        render: (discounted, record) => (
          <Space direction="vertical" size={0}>
            <Text strong style={{ color: '#10b981', fontSize: 15 }}>
              {formatNumber(discounted || record.total_amount)} تومان
            </Text>
            {discounted && discounted !== record.total_amount && (
              <Text delete type="secondary" style={{ fontSize: 12 }}>
                {formatNumber(record.total_amount)}
              </Text>
            )}
          </Space>
        ),
      },
      {
        title: "نوع پرداخت",
        dataIndex: "payment_type",
        key: "payment_type",
        render: (type) => (
          <Tag color="blue" style={{ borderRadius: 6 }}>
            {paymentTypeTranslations[type] || type}
          </Tag>
        ),
      },
      {
        title: "عملیات",
        key: "action",
        render: (_, record) => (
          <a 
            onClick={() => navigate(`/invoices/${record.id}`)}
            style={{ color: '#6366f1', fontWeight: 500 }}
          >
            مشاهده جزئیات ←
          </a>
        ),
      },
    ];

    const topProductsColumns = [
      {
        title: "رتبه",
        key: "rank",
        width: 60,
        render: (_, __, index) => (
          <Avatar 
            size="small" 
            style={{ 
              background: index < 3 ? '#fbbf24' : '#e5e7eb',
              color: index < 3 ? '#fff' : '#6b7280',
              fontWeight: 'bold'
            }}
          >
            {index + 1}
          </Avatar>
        ),
      },
      {
        title: "محصول",
        key: "product",
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 15 }}>{record.product_title}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              کد: {record.variation_id}
            </Text>
          </Space>
        ),
      },
      {
        title: "فروش",
        key: "sales",
        render: (_, record) => (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <Space>
              <ShoppingCartOutlined style={{ color: '#6366f1' }} />
              <Text>{record.invoices_count} فاکتور</Text>
            </Space>
            <Space>
              <AppstoreOutlined style={{ color: '#8b5cf6' }} />
              <Text>{formatNumber(record.total_quantity)} عدد</Text>
            </Space>
          </Space>
        ),
      },
      {
        title: "درآمد",
        dataIndex: "total_revenue",
        key: "total_revenue",
        render: (revenue) => (
          <Text strong style={{ color: '#10b981', fontSize: 15 }}>
            {formatNumber(revenue)} تومان
          </Text>
        ),
      },
    ];

    return (
      <div
        dir="rtl"
        style={{
          padding: "24px",
          background: "linear-gradient(to bottom, #f8fafc 0%, #e0e7ff 100%)",
          minHeight: "100vh",
          fontFamily: "MyCustomFont, sans-serif",
        }}
      >
        {/* Modern Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: 24,
          boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: -50,
            left: -50,
            width: 200,
            height: 200,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            filter: 'blur(60px)'
          }} />
          <Row align="middle" justify="space-between">
            <Col>
              <Space size={16}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrophyOutlined style={{ fontSize: 32, color: '#fff' }} />
                </div>
                <div>
                  <Title
                    level={2}
                    style={{
                      color: '#fff',
                      margin: 0,
                      fontSize: 28,
                      fontFamily: 'MyCustomFont, sans-serif',
                    }}
                  >
                    داشبورد فروش
                  </Title>
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: 16,
                      fontFamily: 'MyCustomFont, sans-serif',
                    }}
                  >
                    {date_info?.today?.jalali_formatted || "امروز"}
                  </Text>
                </div>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Sales Statistics - Modern Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={8}>
            <Card 
              bordered={false}
              style={{
                borderRadius: 16,
                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#3730a3', fontSize: 15, fontWeight: 500 }}>فروش امروز</Text>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DollarOutlined style={{ color: '#4f46e5', fontSize: 20 }} />
                  </div>
                </Space>
                <Title level={2} style={{ color: '#1e1b4b', margin: 0 }}>
                  {formatNumber(sales?.today || 0)}
                </Title>
                <Text style={{ color: '#6366f1', fontWeight: 500 }}>تومان</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card 
              bordered={false}
              style={{
                borderRadius: 16,
                background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.15)',
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#831843', fontSize: 15, fontWeight: 500 }}>فروش این هفته</Text>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(236, 72, 153, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <RiseOutlined style={{ color: '#db2777', fontSize: 20 }} />
                  </div>
                </Space>
                <Title level={2} style={{ color: '#831843', margin: 0 }}>
                  {formatNumber(sales?.this_week || 0)}
                </Title>
                <Text style={{ color: '#ec4899', fontWeight: 500 }}>تومان</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card 
              bordered={false}
              style={{
                borderRadius: 16,
                background: 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)',
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.15)',
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#164e63', fontSize: 15, fontWeight: 500 }}>فروش این ماه</Text>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(6, 182, 212, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DollarOutlined style={{ color: '#0891b2', fontSize: 20 }} />
                  </div>
                </Space>
                <Title level={2} style={{ color: '#164e63', margin: 0 }}>
                  {formatNumber(sales?.this_month || 0)}
                </Title>
                <Text style={{ color: '#06b6d4', fontWeight: 500 }}>تومان</Text>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Invoice & Other Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Statistic
                title={<Text style={{ color: '#6b7280' }}>فاکتورهای باز</Text>}
                value={invoices?.open || 0}
                prefix={<ClockCircleOutlined style={{ color: '#3b82f6' }} />}
                valueStyle={{ color: '#3b82f6', fontSize: 28, fontWeight: 700 }}
                formatter={(val) => formatNumber(Number(val))}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Statistic
                title={<Text style={{ color: '#6b7280' }}>تکمیل شده</Text>}
                value={invoices?.completed || 0}
                prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                valueStyle={{ color: '#10b981', fontSize: 28, fontWeight: 700 }}
                formatter={(val) => formatNumber(Number(val))}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Statistic
                title={<Text style={{ color: '#6b7280' }}>فاکتورهای امروز</Text>}
                value={invoices?.today || 0}
                prefix={<FileTextOutlined style={{ color: '#f59e0b' }} />}
                valueStyle={{ color: '#f59e0b', fontSize: 28, fontWeight: 700 }}
                formatter={(val) => formatNumber(Number(val))}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Statistic
                title={<Text style={{ color: '#6b7280' }}>کل فاکتورها</Text>}
                value={invoices?.total || 0}
                prefix={<ShoppingCartOutlined style={{ color: '#8b5cf6' }} />}
                valueStyle={{ color: '#8b5cf6', fontSize: 28, fontWeight: 700 }}
                formatter={(val) => formatNumber(Number(val))}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts Section */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* Daily Sales Chart */}
          <Col xs={24} lg={16}>
            <Card 
              bordered={false}
              style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              title={
                <Space>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <RiseOutlined style={{ color: '#fff', fontSize: 16 }} />
                  </div>
                  <Text strong style={{ fontSize: 16 }}>روند فروش روزانه</Text>
                </Space>
              }
            >
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={daily_sales} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date_jalali_formatted"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    stroke="#e5e7eb"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#6b7280', dx: -20, textAnchor: 'end' }}
                    stroke="#e5e7eb"
                    width={100}
                    tickFormatter={formatAxisValue}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="total_sales" 
                    stroke="#667eea" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorSales)" 
                    name="فروش"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Payment Distribution */}
          <Col xs={24} lg={8}>
            <Card 
              bordered={false}
              style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              title={
                <Space>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DollarOutlined style={{ color: '#fff', fontSize: 16 }} />
                  </div>
                  <Text strong style={{ fontSize: 16 }}>توزیع روش پرداخت</Text>
                </Space>
              }
            >
              {paymentPieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={paymentPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 16 }}>
                    {paymentPieData.map((item, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                        padding: '8px 12px',
                        background: '#f9fafb',
                        borderRadius: 8
                      }}>
                        <Space>
                          <div style={{
                            width: 12,
                            height: 12,
                            borderRadius: 3,
                            background: CHART_COLORS[index % CHART_COLORS.length]
                          }} />
                          <Text>{item.name}</Text>
                        </Space>
                        <Text strong>{formatNumber(item.value)} تومان</Text>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <Empty description="داده‌ای موجود نیست" />
              )}
            </Card>
          </Col>
        </Row>

        {/* Latest Invoices & Top Products */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card
              bordered={false}
              style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              title={
                <Space>
                  <FileTextOutlined style={{ color: '#667eea', fontSize: 20 }} />
                  <Text strong style={{ fontSize: 16 }}>آخرین فاکتورها</Text>
                </Space>
              }
              extra={
                <a 
                  onClick={() => navigate("/invoices")}
                  style={{ color: '#667eea', fontWeight: 500 }}
                >
                  مشاهده همه ←
                </a>
              }
            >
              <Table
                columns={latestInvoicesColumns}
                dataSource={latest_invoices || []}
                pagination={false}
                rowKey="id"
                scroll={{ x: true }}
                size="middle"
              />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card
              bordered={false}
              style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              title={
                <Space>
                  <TrophyOutlined style={{ color: '#f59e0b', fontSize: 20 }} />
                  <Text strong style={{ fontSize: 16 }}>محصولات پرفروش</Text>
                </Space>
              }
            >
              <Table
                columns={topProductsColumns}
                dataSource={top_products || []}
                pagination={false}
                rowKey={(record) => `${record.product_id}-${record.variation_id}`}
                scroll={{ x: true }}
                size="middle"
              />
            </Card>
          </Col>
        </Row>

        {/* Additional Stats */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} sm={12}>
            <Card 
              bordered={false}
              style={{ 
                borderRadius: 16, 
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
              }}
            >
              <Space align="center" size={16}>
                <Avatar size={56} style={{ background: 'rgba(217, 119, 6, 0.2)' }}>
                  <GiftOutlined style={{ fontSize: 28, color: '#d97706' }} />
                </Avatar>
                <div>
                  <Text style={{ color: '#78350f', display: 'block' }}>تخفیف این ماه</Text>
                  <Title level={3} style={{ color: '#78350f', margin: 0 }}>
                    {formatNumber(discounts?.total_this_month || 0)} تومان
                  </Title>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card 
              bordered={false}
              style={{ 
                borderRadius: 16, 
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
              }}
            >
              <Space align="center" size={16}>
                <Avatar size={56} style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                  <TeamOutlined style={{ fontSize: 28, color: '#2563eb' }} />
                </Avatar>
                <div>
                  <Text style={{ color: '#1e3a8a', display: 'block' }}>مشتریان جدید این ماه</Text>
                  <Title level={3} style={{ color: '#1e3a8a', margin: 0 }}>
                    {customers?.new_this_month || 0} نفر
                  </Title>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // Admin Dashboard
  const { date_info, stats, time_stats, charts, latest } = dashboardData;

  const latestAdminInvoicesColumns = [
    {
      title: "شماره فاکتور",
      dataIndex: "invoice_number",
      key: "invoice_number",
      render: (text) => (
        <Space>
          <Avatar size="small" style={{ background: '#f0f9ff', color: '#0369a1' }}>
            <FileTextOutlined />
          </Avatar>
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "مشتری",
      dataIndex: "customer",
      key: "customer",
      render: (customer) => customer?.name || "—",
    },
    {
      title: "مدیر فروشگاه",
      dataIndex: "shop_manager",
      key: "shop_manager",
      render: (m) => (m ? `${m.first_name || ""} ${m.last_name || ""}`.trim() : "—"),
    },
    {
      title: "وضعیت",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Badge 
          status={status === 'COMPLETED' ? 'success' : 'processing'} 
          text={statusTranslations[status]} 
        />
      ),
    },
    {
      title: "مبلغ",
      dataIndex: "discounted_total",
      key: "amount",
      render: (discounted, record) => (
        <Text strong style={{ color: '#10b981' }}>
          {formatCurrency(discounted || record.total_amount)} ت
        </Text>
      ),
    },
    {
      title: "عملیات",
      key: "action",
      render: (_, record) => (
        <a 
          onClick={() => navigate(`/invoices/${record.id}`)}
          style={{ color: '#6366f1', fontWeight: 500 }}
        >
          مشاهده ←
        </a>
      ),
    },
  ];

  const topAdminProductsColumns = [
    {
      title: "رتبه",
      key: "rank",
      width: 60,
      render: (_, __, index) => (
        <Avatar 
          size="small" 
          style={{ 
            background: index < 3 ? '#fbbf24' : '#e5e7eb',
            color: index < 3 ? '#fff' : '#6b7280',
            fontWeight: 'bold'
          }}
        >
          {index + 1}
        </Avatar>
      ),
    },
    {
      title: "محصول",
      key: "product",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.product_title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            کد: {record.variation_id}
          </Text>
        </Space>
      ),
    },
    {
      title: "تعداد",
      dataIndex: "total_quantity",
      key: "total_quantity",
      render: (qty) => (
        <Tag color="blue">{formatNumber(qty)} عدد</Tag>
      ),
    },
    {
      title: "درآمد",
      dataIndex: "total_revenue",
      key: "total_revenue",
      render: (revenue) => (
        <Text strong style={{ color: '#10b981' }}>
          {formatNumber(revenue)} تومان
        </Text>
      ),
    },
  ];

  return (
    <div
      dir="rtl"
      style={{
        padding: "24px",
        background: "linear-gradient(to bottom, #f8fafc 0%, #e0e7ff 100%)",
        minHeight: "100vh",
        fontFamily: "MyCustomFont, sans-serif",
      }}
    >
      {/* Modern Admin Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0369a1 100%)',
        borderRadius: '24px',
        padding: '32px',
        marginBottom: 24,
        boxShadow: '0 20px 60px rgba(15, 23, 42, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'rgba(59, 130, 246, 0.2)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
        <Row align="middle" justify="space-between">
          <Col>
            <Space size={16}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrophyOutlined style={{ fontSize: 32, color: '#e0f2fe' }} />
              </div>
              <div>
                <Title level={2} style={{ color: '#e0f2fe', margin: 0, fontSize: 28 }}>
                  داشبورد مدیریت
                </Title>
                <Text style={{ color: 'rgba(226,232,240,0.9)', fontSize: 16 }}>
                  {date_info?.today?.jalali_formatted || "امروز"}
                </Text>
              </div>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Revenue Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false}
            style={{
              borderRadius: 16,
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text style={{ color: '#065f46', fontSize: 14, fontWeight: 500 }}>درآمد امروز</Text>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DollarOutlined style={{ color: '#059669', fontSize: 18 }} />
                </div>
              </Space>
              <Title level={3} style={{ color: '#064e3b', margin: 0, fontSize: 24 }}>
                {formatNumber(time_stats?.revenue?.today || 0)}
              </Title>
              <Text style={{ color: '#10b981', fontSize: 13, fontWeight: 500 }}>تومان</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false}
            style={{
              borderRadius: 16,
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text style={{ color: '#1e3a8a', fontSize: 14, fontWeight: 500 }}>درآمد هفته</Text>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <RiseOutlined style={{ color: '#2563eb', fontSize: 18 }} />
                </div>
              </Space>
              <Title level={3} style={{ color: '#1e3a8a', margin: 0, fontSize: 24 }}>
                {formatNumber(time_stats?.revenue?.this_week || 0)}
              </Title>
              <Text style={{ color: '#3b82f6', fontSize: 13, fontWeight: 500 }}>تومان</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false}
            style={{
              borderRadius: 16,
              background: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text style={{ color: '#581c87', fontSize: 14, fontWeight: 500 }}>درآمد ماه</Text>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(139, 92, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DollarOutlined style={{ color: '#7c3aed', fontSize: 18 }} />
                </div>
              </Space>
              <Title level={3} style={{ color: '#581c87', margin: 0, fontSize: 24 }}>
                {formatNumber(time_stats?.revenue?.this_month || 0)}
              </Title>
              <Text style={{ color: '#8b5cf6', fontSize: 13, fontWeight: 500 }}>تومان</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false}
            style={{
              borderRadius: 16,
              background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.15)',
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text style={{ color: '#7c2d12', fontSize: 14, fontWeight: 500 }}>کل درآمد</Text>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(249, 115, 22, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DollarOutlined style={{ color: '#ea580c', fontSize: 18 }} />
                </div>
              </Space>
              <Title level={3} style={{ color: '#7c2d12', margin: 0, fontSize: 24 }}>
                {formatNumber(time_stats?.revenue?.total || 0)}
              </Title>
              <Text style={{ color: '#f97316', fontSize: 13, fontWeight: 500 }}>تومان</Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Status Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card 
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            title={
              <Space>
                <FileTextOutlined style={{ color: '#6366f1', fontSize: 20 }} />
                <Text strong style={{ fontSize: 16 }}>وضعیت فاکتورها</Text>
              </Space>
            }
          >
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#f0f9ff', border: 'none' }}>
                  <Statistic
                    title="کل"
                    value={stats?.invoices?.total || 0}
                    valueStyle={{ color: '#0369a1', fontSize: 28, fontWeight: 700 }}
                    formatter={(val) => formatNumber(Number(val))}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#eff6ff', border: 'none' }}>
                  <Statistic
                    title="باز"
                    value={stats?.invoices?.open || 0}
                    valueStyle={{ color: '#3b82f6', fontSize: 28, fontWeight: 700 }}
                    formatter={(val) => formatNumber(Number(val))}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#f0fdf4', border: 'none' }}>
                  <Statistic
                    title="تکمیل"
                    value={stats?.invoices?.completed || 0}
                    valueStyle={{ color: '#10b981', fontSize: 28, fontWeight: 700 }}
                    formatter={(val) => formatNumber(Number(val))}
                  />
                </Card>
              </Col>
            </Row>
            {stats?.invoices?.status_percentages && (
              <div style={{ marginTop: 20 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Space style={{ marginBottom: 8 }}>
                      <Tag color="blue">باز</Tag>
                  <Text strong>
                    {formatNumber(
                      Number(
                        (stats.invoices.status_percentages.OPEN ?? 0).toFixed(1)
                      )
                    )}
                    %
                  </Text>
                    </Space>
                    <Progress
                      percent={stats.invoices.status_percentages.OPEN || 0}
                      strokeColor="#3b82f6"
                      showInfo={false}
                      strokeWidth={10}
                    />
                  </div>
                  <div>
                    <Space style={{ marginBottom: 8 }}>
                      <Tag color="green">تکمیل شده</Tag>
                      <Text strong>
                        {formatNumber(
                          Number(
                            (stats.invoices.status_percentages.COMPLETED ?? 0).toFixed(1)
                          )
                        )}
                        %
                      </Text>
                    </Space>
                    <Progress
                      percent={stats.invoices.status_percentages.COMPLETED || 0}
                      strokeColor="#10b981"
                      showInfo={false}
                      strokeWidth={10}
                    />
                  </div>
                </Space>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            title={
              <Space>
                <ShoppingCartOutlined style={{ color: '#8b5cf6', fontSize: 20 }} />
                <Text strong style={{ fontSize: 16 }}>سفارش‌های بسته‌بندی</Text>
              </Space>
            }
          >
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#faf5ff', border: 'none' }}>
                  <Statistic
                    title="کل"
                    value={stats?.packaging_orders?.total || 0}
                    valueStyle={{ color: '#7c3aed', fontSize: 28, fontWeight: 700 }}
                    formatter={(val) => formatNumber(Number(val))}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#eff6ff', border: 'none' }}>
                  <Statistic
                    title="باز"
                    value={stats?.packaging_orders?.open || 0}
                    valueStyle={{ color: '#3b82f6', fontSize: 28, fontWeight: 700 }}
                    formatter={(val) => formatNumber(Number(val))}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#f0fdf4', border: 'none' }}>
                  <Statistic
                    title="تکمیل"
                    value={stats?.packaging_orders?.completed || 0}
                    valueStyle={{ color: '#10b981', fontSize: 28, fontWeight: 700 }}
                    formatter={(val) => formatNumber(Number(val))}
                  />
                </Card>
              </Col>
            </Row>
            {stats?.packaging_orders?.status_percentages && (
              <div style={{ marginTop: 20 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Space style={{ marginBottom: 8 }}>
                      <Tag color="blue">باز</Tag>
                      <Text strong>
                        {formatNumber(
                          Number(
                            (stats.packaging_orders.status_percentages.OPEN ?? 0).toFixed(1)
                          )
                        )}
                        %
                      </Text>
                    </Space>
                    <Progress
                      percent={stats.packaging_orders.status_percentages.OPEN || 0}
                      strokeColor="#3b82f6"
                      showInfo={false}
                      strokeWidth={10}
                    />
                  </div>
                  <div>
                    <Space style={{ marginBottom: 8 }}>
                      <Tag color="green">تکمیل شده</Tag>
                      <Text strong>
                        {formatNumber(
                          Number(
                            (stats.packaging_orders.status_percentages.COMPLETED ?? 0).toFixed(1)
                          )
                        )}
                        %
                      </Text>
                    </Space>
                    <Progress
                      percent={stats.packaging_orders.status_percentages.COMPLETED || 0}
                      strokeColor="#10b981"
                      showInfo={false}
                      strokeWidth={10}
                    />
                  </div>
                </Space>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card 
            bordered={false}
            style={{ 
              borderRadius: 16, 
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
            }}
          >
            <Space align="center" size={12}>
              <Avatar size={48} style={{ background: 'rgba(217, 119, 6, 0.2)' }}>
                <AppstoreOutlined style={{ fontSize: 24, color: '#d97706' }} />
              </Avatar>
              <div>
                <Text style={{ color: '#78350f', fontSize: 13, display: 'block' }}>محصولات</Text>
                <Title level={4} style={{ color: '#78350f', margin: 0 }}>
                  {stats?.products?.products?.total || 0}
                </Title>
                
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card 
            bordered={false}
            style={{ 
              borderRadius: 16, 
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
            }}
          >
            <Space align="center" size={12}>
              <Avatar size={48} style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                <UserOutlined style={{ fontSize: 24, color: '#2563eb' }} />
              </Avatar>
              <div>
                <Text style={{ color: '#1e3a8a', fontSize: 13, display: 'block' }}>کاربران</Text>
                <Title level={4} style={{ color: '#1e3a8a', margin: 0 }}>
                  {stats?.users?.total || 0}
                </Title>
                {/* <Text style={{ color: '#1e3a8a', fontSize: 12 }}>
                  جدید: {stats?.users?.new_this_month || 0}
                </Text> */}
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card 
            bordered={false}
            style={{ 
              borderRadius: 16, 
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
            }}
          >
            <Space align="center" size={12}>
              <Avatar size={48} style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                <TeamOutlined style={{ fontSize: 24, color: '#059669' }} />
              </Avatar>
              <div>
                <Text style={{ color: '#064e3b', fontSize: 13, display: 'block' }}>مشتریان</Text>
                <Title level={4} style={{ color: '#064e3b', margin: 0 }}>
                  {stats?.customers?.total || 0}
                </Title>
                {/* <Text style={{ color: '#064e3b', fontSize: 12 }}>
                  جدید: {stats?.customers?.new_this_month || 0}
                </Text> */}
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card 
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            title={
              <Space>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <RiseOutlined style={{ color: '#fff', fontSize: 16 }} />
                </div>
                <Text strong style={{ fontSize: 16 }}>درآمد ماهانه</Text>
              </Space>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charts?.monthly_revenue || []} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month_jalali_formatted" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  stroke="#e5e7eb"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6b7280', dx: -20, textAnchor: 'end' }}
                  stroke="#e5e7eb"
                  width={100}
                  tickFormatter={formatAxisValue}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="total_revenue" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  name="درآمد"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            title={
              <Space>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileTextOutlined style={{ color: '#fff', fontSize: 16 }} />
                </div>
                <Text strong style={{ fontSize: 16 }}>تعداد فاکتورهای ماهانه</Text>
              </Space>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts?.monthly_invoice_count || []} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorInvoice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month_jalali_formatted" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  stroke="#e5e7eb"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6b7280', dx: -20, textAnchor: 'end' }}
                  stroke="#e5e7eb"
                  width={90}
                  tickFormatter={(value) => formatNumber(value)}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="total_invoices" 
                  fill="url(#colorInvoice)" 
                  radius={[8, 8, 0, 0]}
                  name="تعداد فاکتورها"
                  unit=" عدد"
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Daily Revenue & Top Products */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card 
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: 24, paddingBottom: 8 }}
            title={
              <Space>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <RiseOutlined style={{ color: '#fff', fontSize: 16 }} />
                </div>
                <Text strong style={{ fontSize: 16 }}>درآمد روزانه</Text>
              </Space>
            }
          >
            <ResponsiveContainer width="100%" height={550}>
              <BarChart data={charts?.daily_revenue || []} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date_jalali_formatted" 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  stroke="#e5e7eb"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6b7280', dx: -25, textAnchor: 'end' }}
                  stroke="#e5e7eb"
                  width={140}
                  tickFormatter={formatAxisValue}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="total_revenue" 
                  fill="url(#colorDaily)" 
                  radius={[6, 6, 0, 0]}
                  name="درآمد"
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            title={
              <Space>
                <TrophyOutlined style={{ color: '#f59e0b', fontSize: 20 }} />
                <Text strong style={{ fontSize: 16 }}>محصولات پرفروش</Text>
              </Space>
            }
          >
            <Table
              columns={topAdminProductsColumns}
              dataSource={charts?.top_products || []}
              pagination={false}
              rowKey={(r) => `${r.product_id}-${r.variation_id}`}
              size="middle"
              scroll={{ x: true }}
            />
          </Card>
        </Col>
      </Row>

      {/* Latest Invoices */}
      <Card 
        bordered={false}
        style={{ marginTop: 24, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        title={
          <Space>
            <FileTextOutlined style={{ color: '#6366f1', fontSize: 20 }} />
            <Text strong style={{ fontSize: 16 }}>آخرین فاکتورها</Text>
          </Space>
        }
      >
        <Table
          columns={latestAdminInvoicesColumns}
          dataSource={latest?.invoices || []}
          pagination={false}
          rowKey="id"
          size="middle"
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;