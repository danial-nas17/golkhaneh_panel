import React, { useState, useEffect } from "react";
import { Table, Tag, Card, Button, message, Input, Modal, Flex, Space } from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import dayjs from "dayjs";
import OrderCreationModal from "./OrderCreationModal";
import OrderEditModal from "./OrderEditModal";
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";

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
  const [pagination, setPagination] = useState({ current: 1, pageSize: 25, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const openEditModal = (id) => {
    setSelectedOrderId(id);
    setEditModalVisible(true);
  };

  const handleUpdated = () => {
    fetchOrders(pagination.current, pagination.pageSize, searchText);
  };

  const openDeleteModal = (orderId) => {
    setDeleteOrderId(orderId);
    setDeleteModalVisible(true);
  };

  const handleDeleteOrder = async () => {
    if (!deleteReason.trim()) {
      message.error("لطفا دلیل حذف را وارد کنید");
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/panel/packaging-orders/${deleteOrderId}`, { data: { reason: deleteReason.trim() } });
      message.success("بسته بندی با موفقیت حذف شد");
      setDeleteModalVisible(false);
      setDeleteReason("");
      setDeleteOrderId(null);
      fetchOrders(pagination.current, pagination.pageSize, searchText);
    } catch (error) {
      // Use the unified error handler to show the actual error message
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در حذف بسته بندی"
      });
      console.error("Error deleting order:", error);
    } finally {
      setDeleting(false);
    }
  };

  const statusTranslations = { OPEN: "باز", CLOSED: "بسته", CANCELED: "لغو شده", COMPLETED: "تکمیل شده" };
  const statusColors = { OPEN: "blue", CLOSED: "green", CANCELLED: "red", COMPLETED: "green" };

  const fetchOrders = async (page = 1, pageSize = 25, search = "") => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/packaging-orders`, { params: { page, per_page: pageSize, search } });
      const { data, meta } = response.data;
      setOrders(data);
      setPagination({ current: meta.current_page, pageSize: meta.per_page, total: meta.total });
    } catch (error) {
      // Use the unified error handler
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در دریافت بسته بندی ها"
      });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      title: "شناسه",
      dataIndex: "id",
      key: "id",
      render: (id) => <span className="text-gray-500">#{id}</span>,
      width: 80,
    },
    {
      title: "مشتری",
      dataIndex: "customer",
      key: "customer",
      render: (customer) => (
        <div>
          <div className="font-medium">{customer?.first_name} {customer?.last_name}</div>
          <div className="text-gray-500 text-sm">{customer?.mobile}</div>
        </div>
      ),
      width: 180,
    },
    {
      title: "بسته‌بندی شده توسط",
      dataIndex: "packed_by",
      key: "packed_by",
      render: (packed_by) => (
        <div>
          {packed_by ? (
            <>
              <div className="font-medium">{packed_by?.first_name} {packed_by?.last_name}</div>
              <div className="text-gray-500 text-sm">{packed_by?.mobile}</div>
            </>
          ) : (
            <span className="text-gray-400">تعیین نشده</span>
          )}
        </div>
      ),
      width: 160,
    },
    {
      title: "تعداد جعبه",
      dataIndex: "count_item",
      key: "count_item",
      render: (count) => <span className="font-medium">{count}</span>,
      width: 100,
    },
    {
      title: "کنترل کیفیت",
      dataIndex: "qc_controller",
      key: "qc_controller",
      render: (qc_controller) => <span className="font-medium">{qc_controller || "تعیین نشده"}</span>,
      width: 130,
    },
    {
      title: "وضعیت",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={statusColors[status]}>{statusTranslations[status]}</Tag>,
      width: 100,
    },
    {
      title: "تاریخ ایجاد",
      dataIndex: "created_at",
      key: "created_at",
      width: 140,
      // render: (v) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "—"),
    },
    {
      title: "تاریخ تکمیل",
      dataIndex: "completed_at",
      key: "completed_at",
      width: 140,
      // render: (completed_at) => (
      //   <span className={completed_at ? "text-green-600" : "text-gray-400"}>
      //     {completed_at ? dayjs(completed_at).format("YYYY-MM-DD HH:mm") : "تکمیل نشده"}
      //   </span>
      // ),
    },
    {
      title: "عملیات",
      key: "actions",
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/orders/packaging/${record.id}`)}>
            مشاهده
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record.id)}>
            ویرایش
          </Button>
          <Button
            size="small"
            type="default"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/orders/logs/${record.id}`)}
            title="مشاهده لاگ‌ها"
          >
            لاگ‌ها
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => openDeleteModal(record.id)}>
            حذف
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div dir="rtl">
      {/* نوار ابزار بالای جدول (خارج از Card) */}
      <div
        className="sticky top-0 z-10 bg-white/90 backdrop-blur px-3 py-3 border-b"
        style={{ marginBottom: 16 }}
      >
        <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>بسته بندی‌ها</h2>
          <Space size="middle" wrap>
            <Input
              placeholder="جستجوی بسته بندی..."
              prefix={<SearchOutlined />}
              onChange={handleSearchChange}
              value={searchText}
              allowClear
              style={{ width: 320, maxWidth: "100%" }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              افزودن بسته بندی
            </Button>
          </Space>
        </Flex>
      </div>

      {/* خود جدول داخل Card ساده بدون عنوان */}
      <Card bordered className="shadow-sm">
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
          scroll={{ y: 600 }}
          sticky
        />
      </Card>

      {/* مودال‌ها */}
      <OrderCreationModal visible={modalVisible} onCancel={() => setModalVisible(false)} />

      <OrderEditModal
        visible={editModalVisible}
        orderId={selectedOrderId}
        onCancel={() => setEditModalVisible(false)}
        onUpdated={handleUpdated}
      />

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
            <span>تأیید حذف بسته بندی</span>
          </div>
        }
        open={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setDeleteReason("");
        }}
        footer={[
          <Button key="cancel" onClick={() => { setDeleteModalVisible(false); setDeleteReason(""); }}>
            انصراف
          </Button>,
          <Button key="delete" type="primary" danger loading={deleting} onClick={handleDeleteOrder}>
            حذف بسته بندی
          </Button>,
        ]}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: "#ff4d4f", fontWeight: "bold" }}>آیا از حذف این بسته بندی اطمینان دارید؟</p>
          {/* <p style={{ color: "#666" }}>این عملیات قابل بازگشت نیست و بسته بندی به طور کامل حذف خواهد شد.</p> */}
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
            دلیل حذف <span style={{ color: "#ff4d4f" }}>*</span>
          </label>
          <Input.TextArea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="دلیل حذف بسته بندی را وارد کنید..."
            rows={3}
            // maxLength={500}
            // showCount
          />
        </div>
      </Modal>
    </div>
  );
};

export default OrderList;
