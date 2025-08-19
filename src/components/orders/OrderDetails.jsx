import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Image,
  Button,
  Select,
  message,
  Divider,
  Space,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import api from "../../api";
import dayjs from "dayjs";

const { Option } = Select;

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const statusTranslations = {
    pending: "در انتظار پرداخت",
    shipped: "ارسال شده",
    processing: "در حال پردازش",
    delivered: "تحویل داده شده",
    cancelled: "لغو شده",
  };

  const statusColors = {
    pending: "gold",
    shipped: "gray",
    processing: "blue",
    delivered: "green",
    cancelled: "red",
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/panel/order/${id}`);
      setOrder(response?.data?.data);
    } catch (error) {
      message.error("خطا در دریافت جزئیات سفارش");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/panel/order/${id}`, {
        status: newStatus,
      });
      message.success("وضعیت سفارش با موفقیت به‌روزرسانی شد");
      fetchOrderDetails();
    } catch (error) {
      if (error?.response) {
        const { status, data } = error?.response;

        if (status === 422 && data?.data?.errors) {
          const errors = Object.values(data?.data?.errors).flat();
          message.error(errors.join(", "));
        } else {
          message.error(data?.message || "خطا در به‌روزرسانی وضعیت سفارش");
        }
      } else {
        message.error("یک خطای پیش‌بینی‌نشده رخ داد");
      }
    }
  };

  const columns = [
    {
      title: "محصول",
      dataIndex: "product_variant",
      key: "product",
      render: (variant) => (
        <div className="flex items-center space-x-4">
          <Image
            src={variant?.images[0]}
            alt={variant?.title}
            width={80}
            className="rounded-md"
          />
          <div>
            <div className="font-medium mr-2">{variant.title}</div>
            <div className="text-gray-500 text-sm mr-2">
              کد محصول: {variant.SKU}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "قیمت",
      dataIndex: ["product_variant", "price"],
      key: "price",
      render: (price) => <span>{price} تومان</span>,
    },
    {
      title: "تعداد",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "مجموع",
      dataIndex: "total_item_price",
      key: "total",
      render: (total) => <span className="font-medium">{total} تومان</span>,
    },
  ];

  if (loading) return <div>در حال بارگذاری...</div>;
  if (!order) return <div>سفارش پیدا نشد</div>;

  return (
    <div className="">
      <Card className="mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/orders")}
          className="mb-4"
        >
          بازگشت به سفارش‌ها
        </Button>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">سفارش #{order.id}</h1>
          <Select
            value={order.status}
            onChange={handleStatusChange}
            className="min-w-[200px]"
          >
            {Object.keys(statusColors).map((key) => (
              <Option key={key} value={key}>
                <Tag color={statusColors[key]}>{statusTranslations[key]}</Tag>
              </Option>
            ))}
          </Select>
        </div>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="نام مشتری">
            {`${order?.user?.first_name} ${order.user.last_name}`}
          </Descriptions.Item>
          <Descriptions.Item label="ایمیل">
            {order?.user?.email}
          </Descriptions.Item>
          <Descriptions.Item label="تلفن">
            {order?.user?.mobile || "ندارد"}
          </Descriptions.Item>
          <Descriptions.Item label="شرکت">
            {order?.user?.company_name}
          </Descriptions.Item>
          <Descriptions.Item label="کشور">
            {order?.user?.country || "ندارد"}
          </Descriptions.Item>
          <Descriptions.Item label="تاریخ سفارش">
            {order?.created_at}
          </Descriptions.Item>
          <Descriptions.Item label="آدرس">
            {order?.user?.address || "ندارد"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="اقلام سفارش">
        <Table
          columns={columns}
          dataSource={order?.items}
          rowKey="id"
          pagination={false}
        />
        <Divider />
        <div className="flex justify-end">
          <div className="text-xl font-medium">
            مجموع کل: {order?.price} تومان
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OrderDetail;
