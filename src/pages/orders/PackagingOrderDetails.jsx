import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Spin,
  Row,
  Col,
  Divider,
  Descriptions,
  Badge,
} from 'antd';
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

const { Title, Text, Paragraph } = Typography;

const PackagingOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/packaging-orders/${id}`, {
        params: {
          includes: ['items'],
        },
      });
      setOrderData(response.data.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      OPEN: 'blue',
      CLOSED: 'green',
      CANCELLED: 'red',
      COMPLETED: 'green',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      OPEN: 'باز',
      CLOSED: 'بسته',
      CANCELLED: 'لغو شده',
      COMPLETED: 'تکمیل شده',
    };
    return texts[status] || status;
  };

  const getPackTypeText = (packType) => {
    const types = {
      POTTED_PLANT: 'گلدان',
      CUT_FLOWER: 'شاخه بریده',
    };
    return types[packType] || packType;
  };

  const getPackTypeColor = (packType) => {
    const colors = {
      POTTED_PLANT: 'green',
      CUT_FLOWER: 'blue',
    };
    return colors[packType] || 'default';
  };

  const itemColumns = [
    {
      title: 'جعبه',
      dataIndex: 'row_no',
      key: 'row_no',
      width: 80,
    },
    {
      title: 'نوع بسته‌بندی',
      dataIndex: 'pack_type',
      key: 'pack_type',
      render: (packType) => (
        <Tag color={getPackTypeColor(packType)}>
          {getPackTypeText(packType)}
        </Tag>
      ),
    },
    {
      title: 'محصول',
      dataIndex: 'product',
      key: 'product',
      render: (product) => product ? product.title : '-',
    },
    {
      title: 'تنوع',
      dataIndex: 'product_variation_id',
      key: 'product_variation_id',
      render: (variation) => {
        if (!variation) return '-';
        if (typeof variation === 'object' && variation.SKU) {
          return variation.SKU;
        }
        return variation;
      },
    },
    {
      title: 'تعداد گلدان',
      dataIndex: 'total_pots',
      key: 'total_pots',
      render: (pots) => pots > 0 ? pots : '-',
    },
    {
      title: 'نوع گلدان',
      dataIndex: 'pot_type',
      key: 'pot_type',
      render: (potType) => potType || '-',
    },
    {
      title: 'تعداد شاخه',
      dataIndex: 'total_stems',
      key: 'total_stems',
      render: (stems) => stems > 0 ? stems : '-',
    },
    {
      title: 'تعداد گل',
      dataIndex: 'total_flowers',
      key: 'total_flowers',
      render: (flowers) => flowers > 0 ? flowers : '-',
    },
    {
      title: 'کنترل کننده کیفیت',
      dataIndex: 'qc_controller',
      key: 'qc_controller',
    },
    {
      title: 'تاریخ بسته‌بندی',
      dataIndex: 'packaged_at',
      key: 'packaged_at',
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!orderData) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text type="danger">خطا در دریافت اطلاعات سفارش</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/orders')}
            >
              بازگشت به لیست سفارشات
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              جزئیات سفارش بسته‌بندی - #{orderData.id}
            </Title>
          </Space>
          <Badge
            status={orderData.status === 'OPEN' ? 'processing' : 'success'}
            text={
              <Tag color={getStatusColor(orderData.status)}>
                {getStatusText(orderData.status)}
              </Tag>
            }
          />
        </div>
      </Card>

      {/* Order Information */}
      <Row gutter={24}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <ShoppingCartOutlined />
                <span>اطلاعات سفارش</span>
              </Space>
            }
          >
            <Descriptions bordered column={2}>
              <Descriptions.Item label="شماره سفارش">
                <Text strong>#{orderData.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="وضعیت">
                <Tag color={getStatusColor(orderData.status)}>
                  {getStatusText(orderData.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="تعداد جعبه موجود در سفارش">
                <Text strong>{orderData.count_item}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="تاریخ ایجاد">
                {orderData.created_at}
              </Descriptions.Item>
              <Descriptions.Item label="تاریخ تکمیل" span={2}>
                {orderData.completed_at || 'هنوز تکمیل نشده'}
              </Descriptions.Item>
              <Descriptions.Item label="یادداشت" span={2}>
                <Paragraph ellipsis={{ rows: 2, expandable: true }}>
                  {orderData.notes || 'بدون یادداشت'}
                </Paragraph>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Customer Information */}
      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>اطلاعات مشتری</span>
              </Space>
            }
          >
            <Descriptions bordered column={2}>
              <Descriptions.Item label="نام مشتری">
                <Text strong>{orderData.customer?.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="شماره تماس">
                {orderData.customer?.phone}
              </Descriptions.Item>
              <Descriptions.Item label="ایمیل">
                {orderData.customer?.email || 'ثبت نشده'}
              </Descriptions.Item>
              <Descriptions.Item label="کد مشتری">
                {orderData.customer?.code || 'ثبت نشده'}
              </Descriptions.Item>
              <Descriptions.Item label="آدرس" span={2}>
                {orderData.customer?.address}
              </Descriptions.Item>
              <Descriptions.Item label="شهر">
                {orderData.customer?.city}
              </Descriptions.Item>
              <Descriptions.Item label="استان">
                {orderData.customer?.state}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Order Items */}
      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined />
                <span>آیتم‌های سفارش ({orderData.items?.length || 0})</span>
              </Space>
            }
          >
            <Table
              columns={itemColumns}
              dataSource={orderData.items || []}
              rowKey="id"
              pagination={false}
              scroll={{ x: true }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Summary Statistics */}
      {orderData.items && orderData.items.length > 0 && (
        <Row gutter={24} style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card title="آمار کلی">
              <Row gutter={16}>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={3} style={{ color: '#1890ff' }}>
                      {orderData.items.filter(item => item.pack_type === 'POTTED_PLANT').length}
                    </Title>
                    <Text>آیتم گلدان</Text>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={3} style={{ color: '#52c41a' }}>
                      {orderData.items.filter(item => item.pack_type === 'CUT_FLOWER').length}
                    </Title>
                    <Text>آیتم شاخه بریده</Text>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={3} style={{ color: '#722ed1' }}>
                      {orderData.items.reduce((sum, item) => sum + (item.total_pots || 0), 0)}
                    </Title>
                    <Text>مجموع گلدان‌ها</Text>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={3} style={{ color: '#eb2f96' }}>
                      {orderData.items.reduce((sum, item) => sum + (item.total_stems || 0), 0)}
                    </Title>
                    <Text>مجموع شاخه‌ها</Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default PackagingOrderDetails;