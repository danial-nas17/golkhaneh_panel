import React, { useState, useEffect } from "react";
import { Table, Tag, Card, Button, Select, message, Input } from "antd";
import { EyeOutlined, SearchOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import dayjs from "dayjs";
import OrderCreationModal from "./OrderCreationModal";
import OrderEditModal from "./OrderEditModal";


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
  const [modalVisible, setModalVisible] = useState(false);
  const navigate = useNavigate();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const openEditModal = (id) => {
    setSelectedOrderId(id);
    setEditModalVisible(true);
  };

   const handleUpdated = () => {
    fetchOrders(pagination.current, pagination.pageSize, searchText);
  };

  const statusTranslations = {
    OPEN: "باز",
    CLOSED: "بسته",
    CANCELLED: "لغو شده",
    COMPLETED: "تکمیل شده"
  };


  const statusColors = {
    OPEN: "blue",
    CLOSED: "green",
    CANCELLED: "red",
    COMPLETED: "green",
  };

  const fetchOrders = async (page = 1, pageSize = 25, search = "") => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/packaging-orders`, {
        params: {
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


  const columns = [
    {
      title: "شماره سفارش",
      dataIndex: "id",
      key: "id",
      render: (id) => <span className="font-semibold">#{id}</span>,
    },
    {
      title: "مشتری",
      dataIndex: "customer",
      key: "customer",
      render: (customer) => (
        <div>
          <div className="font-medium">{customer?.name}</div>
          <div className="text-gray-500 text-sm">{customer?.phone}</div>
        </div>
      ),
    },
    {
      title: "تعداد جعبه",
      dataIndex: "count_item",
      key: "count_item",
      render: (count) => <span className="font-medium">{count}</span>,
    },
    {
      title: "وضعیت",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColors[status]}>{statusTranslations[status]}</Tag>
      ),
    },
    {
      title: "تاریخ ایجاد",
      dataIndex: "created_at",
      key: "created_at",
    },
    {
      title: "یادداشت",
      dataIndex: "notes",
      key: "notes",
      render: (notes) => (
        <div className="max-w-xs truncate" title={notes}>
          {notes}
        </div>
      ),
    },
    {
      title: "عملیات",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/orders/packaging/${record.id}`)}
          >
            جزئیات
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditModal(record.id)}
          >
            ویرایش
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="">
      <Card
        title={
          <div className="flex justify-between items-center">
            <span className="text-xl">سفارش‌ها</span>
            <div className="flex items-center gap-4">
              <Input
                placeholder="جستجوی سفارش..."
                prefix={<SearchOutlined />}
                onChange={handleSearchChange}
                value={searchText}
                className="max-w-md"
                allowClear
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalVisible(true)}
              >
                افزودن سفارش
              </Button>
            </div>
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

      <OrderCreationModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
      />
       <OrderEditModal
        visible={editModalVisible}
        orderId={selectedOrderId}
        onCancel={() => setEditModalVisible(false)}
        onUpdated={handleUpdated}
      />
    </div>
  );
};

export default OrderList;
