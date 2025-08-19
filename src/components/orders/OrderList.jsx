import React, { useState, useEffect } from "react";
import { Table, Tag, Card, Button, Select, message, Input } from "antd";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import dayjs from "dayjs";

const { Option } = Select;

const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState(""); 
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
  });
  const navigate = useNavigate();

  const statusTranslations = {
    pending: "در انتظار پرداخت",
    shipped: "ارسال شده",
    processing: "در حال پردازش",
    delivered: "تحویل داده شده",
    cancelled: "لغو شده"
  };
  

  const statusColors = {
    pending: "gold",
    shipped: "gray",
    processing: "blue",
    delivered: "green",
    cancelled: "red",
  };

  const fetchOrders = async (page = 1, pageSize = 25, search = "") => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/order`, {
        params: {
          includes: ["products"],
          page,
          per_page: pageSize,
          search,
        },
      });
      const { data, meta } = response.data;
      setOrders(data);
      setPagination({
        current: meta.current_page,
        pageSize: meta.per_page,
        total: meta.total,
      });
    } catch (error) {
      message.error("خطا در دریافت سفارش‌ها");
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchOrders = React.useCallback(
    debounce((search) => {
      fetchOrders(1, pagination.pageSize, search);
    }, 500),
    [pagination.pageSize]
  );

  useEffect(() => {
    fetchOrders(pagination.current, pagination.pageSize, searchText);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    debouncedFetchOrders(value);
  };

  const handleTableChange = (newPagination) => {
    fetchOrders(newPagination.current, newPagination.pageSize, searchText);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/panel/order/${orderId}`, {
        status: newStatus,
      });
      message.success("وضعیت سفارش با موفقیت به‌روزرسانی شد");
      fetchOrders(pagination.current, pagination.pageSize, searchText);
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;

        if (status === 422 && data?.data?.errors) {
          const errors = Object.values(data.data.errors).flat();
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
      title: "شناسه سفارش",
      dataIndex: "id",
      key: "id",
      render: (id) => <span className="font-semibold">#{id}</span>,
    },
    {
      title: "مشتری",
      dataIndex: "user",
      key: "user",
      render: (user) => (
        <div>
          <div className="font-medium">{`${user?.first_name} ${user?.last_name}`}</div>
          <div className="text-gray-500 text-sm">{user.email}</div>
        </div>
      ),
    },
    {
      title: "قیمت",
      dataIndex: "price",
      key: "price",
      render: (price) => <span className="font-medium">{price} تومان</span>,
    },
    {
      title: "وضعیت",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Select
          value={status}
          onChange={(value) => handleStatusChange(record.id, value)}
          className="min-w-[150px]"
        >
          {Object.keys(statusColors).map((key) => (
            <Option key={key} value={key}>
              <Tag color={statusColors[key]}>{statusTranslations[key]}</Tag>
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "تاریخ",
      dataIndex: "created_at",
      key: "created_at",
      // render: (date) => dayjs(date).format("MMM D, YYYY HH:mm"),
    },
    {
      title: "عملیات",
      key: "actions",
      render: (_, record) => (
        <Button type="primary" icon={<EyeOutlined />} onClick={() => navigate(`/orders/${record.id}`)}>
          مشاهده جزئیات
        </Button>
      ),
    },
  ];

  return (
    <div className="">
      <Card
        title={
          <div className="flex justify-between items-center">
            <span className="text-xl">سفارش‌ها</span>
            <Input
              placeholder="جستجوی سفارش..."
              prefix={<SearchOutlined />}
              onChange={handleSearchChange}
              value={searchText}
              className="max-w-md"
              allowClear
            />
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
          }}
          onChange={handleTableChange}
          className="shadow-sm"
        />
      </Card>
    </div>
  );
};

export default OrderList;
