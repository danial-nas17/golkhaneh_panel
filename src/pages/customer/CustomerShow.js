import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Descriptions,
  Tag,
  Typography,
  Spin,
  Row,
  Col,
  Space,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";

const { Title, Text, Paragraph } = Typography;

const CustomerShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCustomerDetails();
    }
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/panel/customers/${id}`);
      setCustomer(response.data.data);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در دریافت اطلاعات مشتری",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Text type="danger">خطا در دریافت اطلاعات مشتری</Text>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
      }}
      className="responsive-container"
    >
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
          className="responsive-header"
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Space wrap>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/customers")}
                size="small"
              >
                بازگشت به لیست مشتریان
              </Button>
              <Title level={4} style={{ margin: 0, fontSize: "16px" }}>
                جزئیات مشتری - {customer.name}
              </Title>
            </Space>
            <Tag
              color={customer.is_active ? "green" : "red"}
              style={{ fontSize: "12px", padding: "4px 8px" }}
            >
              {customer.is_active ? "فعال" : "غیرفعال"}
            </Tag>
          </div>
        </div>
      </Card>

      {/* Customer Information */}
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>اطلاعات مشتری</span>
              </Space>
            }
          >
            <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
              <Descriptions.Item label="شناسه مشتری">
                <Text strong>{customer.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="کد مشتری">
                {customer.code || "ثبت نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="نام کامل">
                <Text strong>{customer.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="نام تماس">
                {customer.contact_name || "ثبت نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="شماره تماس">
                <Space>
                  <PhoneOutlined />
                  <Text copyable>{customer.phone}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="ایمیل">
                <Space>
                  <MailOutlined />
                  <Text copyable>{customer.email}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="شهر">
                <Space>
                  <EnvironmentOutlined />
                  {customer.city || "ثبت نشده"}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="استان">
                {customer.state || "ثبت نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="کد پستی">
                {customer.postal_code || "ثبت نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="کشور">
                {customer.country || "ثبت نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="وضعیت" span={2}>
                <Tag color={customer.is_active ? "green" : "red"}>
                  {customer.is_active ? "فعال" : "غیرفعال"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="تاریخ ایجاد">
                {new Date(customer.created_at).toLocaleDateString("fa-IR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Descriptions.Item>
              <Descriptions.Item label="آخرین به‌روزرسانی">
                {new Date(customer.updated_at).toLocaleDateString("fa-IR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="آدرس">
            <div style={{ padding: "16px 0" }}>
              {customer.address ? (
                <Paragraph>
                  <EnvironmentOutlined style={{ marginLeft: 8 }} />
                  {customer.address}
                </Paragraph>
              ) : (
                <Text type="secondary">آدرس ثبت نشده</Text>
              )}
            </div>
          </Card>

          {customer.notes && (
            <Card title="یادداشت‌ها" style={{ marginTop: 16 }}>
              <Paragraph>{customer.notes}</Paragraph>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default CustomerShow;
