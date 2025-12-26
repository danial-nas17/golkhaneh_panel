import React, { useState, useEffect } from "react";
import { Table, Tag, Card, Button, message, Input, Modal, Flex, Space, Form, Select } from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api";
import dayjs from "dayjs";
import InvoiceCreationModal from "../../components/invoices/InvoiceCreationModal";
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";
import { usePermissions } from "../../hook/usePermissions";

const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

const InvoiceIndex = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 25, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { userRole } = usePermissions();

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editCustomerReadonly, setEditCustomerReadonly] = useState({ name: "", phone: "", email: "", city: "" });
  const [editLocks, setEditLocks] = useState({ phone: true, email: true, city: true });
  const [editForm] = Form.useForm();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // بررسی query parameter برای باز کردن مودال ایجاد فاکتور
  useEffect(() => {
    const createParam = searchParams.get('create');
    if (createParam === 'true') {
      setModalVisible(true);
      // حذف query parameter از URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleUpdated = () => {
    fetchInvoices(pagination.current, pagination.pageSize, searchText, statusFilter);
  };

  const openDeleteModal = (invoiceId) => {
    setDeleteInvoiceId(invoiceId);
    setDeleteModalVisible(true);
  };

  const openEditModal = async (invoiceId) => {
    setEditInvoiceId(invoiceId);
    setEditModalVisible(true);
    setEditLoading(true);
    try {
      const res = await api.get(`/panel/invoices/${invoiceId}`);
      const d = res?.data?.data || {};
      const customer = d.customer || {};
      setEditCustomerReadonly({
        name: customer?.name || "",
        phone: customer?.phone || "",
        email: customer?.email || "",
        city: customer?.city || "",
      });
      setEditLocks({
        phone: Boolean(customer?.phone),
        email: Boolean(customer?.email),
        city: Boolean(customer?.city),
      });
      editForm.setFieldsValue({
        customer_id: customer?.id,
        phone: customer?.phone,
        email: customer?.email,
        city: customer?.city,
        notes: d?.notes,
      });
    } catch (e) {
      UnifiedErrorHandler.handleApiError(e, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در دریافت اطلاعات فاکتور",
      });
      setEditModalVisible(false);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setEditSubmitting(true);
      const payload = {
        customer_id: values.customer_id,
        customer: {},
        update_existing_customer: true,
      };
      // Only include fields that were previously empty (unlocked)
      if (!editLocks.phone && values.phone) payload.customer.phone = values.phone;
      if (!editLocks.email && values.email) payload.customer.email = values.email;
      if (!editLocks.city && values.city) payload.customer.city = values.city;
      if (values.notes) payload.notes = values.notes;

      // If no customer sub-fields are set, remove empty object
      if (Object.keys(payload.customer).length === 0) delete payload.customer;

      await api.put(`/panel/invoices/${editInvoiceId}`, payload);
      message.success("فاکتور با موفقیت به‌روزرسانی شد");
      setEditModalVisible(false);
      setEditInvoiceId(null);
      editForm.resetFields();
      handleUpdated();
    } catch (e) {
      if (e?.errorFields) return; // antd validation error
      UnifiedErrorHandler.handleApiError(e, editForm, {
        showValidationMessages: true,
        showGeneralMessages: true,
        defaultMessage: "خطا در به‌روزرسانی فاکتور",
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteReason.trim()) {
      message.error("لطفا دلیل حذف را وارد کنید");
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/panel/invoices/${deleteInvoiceId}`, { data: { reason: deleteReason.trim() } });
      message.success("فاکتور با موفقیت حذف شد");
      setDeleteModalVisible(false);
      setDeleteReason("");
      setDeleteInvoiceId(null);
      fetchInvoices(pagination.current, pagination.pageSize, searchText, statusFilter);
    } catch (error) {
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در حذف فاکتور"
      });
      console.error("Error deleting invoice:", error);
    } finally {
      setDeleting(false);
    }
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
    COMPLETED: "green"
  };

  const paymentTypeTranslations = {
    cash: "نقدی",
    credit: "اعتباری",
    card_to_card: "کارت به کارت",
    cheque: "چک",
    other: "سایر"
  };

  const fetchInvoices = async (page = 1, pageSize = 25, search = "", status = null) => {
    setLoading(true);
    try {
      const params = { 
        page, 
        per_page: pageSize, 
        search,
        "includes[]": ["creator", "shop_manager", "customer", "customer_snapshot"]
      };
      if (status) {
        params.status = status;
      }
      const response = await api.get(`/panel/invoices`, { params });
      const { data, meta } = response.data;
      setInvoices(data);
      setPagination({ current: meta.current_page, pageSize: meta.per_page, total: meta.total });
    } catch (error) {
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در دریافت فاکتورها"
      });
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchInvoices = React.useCallback(
    debounce((search, status) => {
      fetchInvoices(1, pagination.pageSize, search, status);
    }, 500),
    [pagination.pageSize]
  );

  useEffect(() => {
    fetchInvoices(pagination.current, pagination.pageSize, searchText, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    debouncedFetchInvoices(value, statusFilter);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchInvoices(1, pagination.pageSize, searchText, value);
  };

  const handleTableChange = (newPagination) => {
    fetchInvoices(newPagination.current, newPagination.pageSize, searchText, statusFilter);
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
      title: "وضعیت",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={statusColors[status]}>{statusTranslations[status]}</Tag>,
      width: 100,
    },
    {
      title: "نوع پرداخت",
      dataIndex: "payment_type",
      key: "payment_type",
      render: (payment_type) => <span>{paymentTypeTranslations[payment_type] || payment_type}</span>,
      width: 110,
    },
    {
      title: "مجموع مبلغ",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount) => <span className="font-medium">{amount ? `${amount.toLocaleString()} تومان` : "—"}</span>,
      width: 130,
    },
    {
      title: "مشتری",
      dataIndex: "customer",
      key: "customer",
      render: (customer) => (
        <div>
          <div className="font-medium">{customer?.name}</div>
          <div className="text-gray-500 text-sm">{customer?.phone}</div>
          <div className="text-gray-500 text-xs hidden md:block">{customer?.email}</div>
        </div>
      ),
      width: 200,
    },
    // نمایش shop_manager فقط برای نقش‌هایی که مجاز هستند
    ...(userRole && !(
      userRole.toLowerCase().includes('customer') || 
      userRole === 'customer' || 
      userRole === 'customer_staff' ||
      userRole === 'Customer' ||
      userRole === 'Customer_Staff'
    ) ? [{
      title: "مدیر فروشگاه",
      dataIndex: "shop_manager",
      key: "shop_manager",
      render: (shop_manager) => (
        <div>
          <div className="font-medium">{shop_manager?.first_name} {shop_manager?.last_name}</div>
          <div className="text-gray-500 text-sm">{shop_manager?.mobile}</div>
        </div>
      ),
      width: 180,
    }] : []),
    // {
    //   title: "تاریخ ایجاد",
    //   dataIndex: "created_at",
    //   key: "created_at",
    //   width: 140,
    // },
    {
      title: "تاریخ تکمیل",
      dataIndex: "completed_at",
      key: "completed_at",
      width: 140,
    },
    {
      title: "عملیات",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="primary" icon={<EyeOutlined />} onClick={() => navigate(`/invoices/${record.id}`)}>
            
          </Button>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record.id)}>
            
          </Button>
          {/* <Button
            type="default"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/invoices/${record.id}/logs`)}
            title="مشاهده لاگ‌ها"
          >
            لاگ‌ها
          </Button> */}
          {/* <Button danger icon={<DeleteOutlined />} onClick={() => openDeleteModal(record.id)}>
            
          </Button> */}
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
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>فاکتورهای فروش</h2>
          <Space size="middle" wrap>
            <Input
              placeholder="جستجوی فاکتور..."
              prefix={<SearchOutlined />}
              onChange={handleSearchChange}
              value={searchText}
              allowClear
              style={{ width: 320, maxWidth: "100%" }}
            />
            <Select
              placeholder="وضعیت"
              allowClear
              value={statusFilter}
              onChange={handleStatusChange}
              style={{ width: 150 }}
            >
              <Select.Option value="OPEN">باز</Select.Option>
              <Select.Option value="COMPLETED">تکمیل شده</Select.Option>
            </Select>
            {/* Debug: Show current role */}
            {console.log('InvoiceIndex - Current userRole:', userRole)}
            {(userRole && (
              userRole.toLowerCase().includes('customer') || 
              userRole === 'customer' || 
              userRole === 'customer_staff' ||
              userRole === 'Customer' ||
              userRole === 'Customer_Staff'
            )) && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                ایجاد فاکتور
              </Button>
            )}
          </Space>
        </Flex>
      </div>

      {/* خود جدول داخل Card ساده بدون عنوان */}
      <Card bordered className="shadow-sm">
        <Table
          columns={columns}
          dataSource={invoices}
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
      <InvoiceCreationModal visible={modalVisible} onCancel={() => setModalVisible(false)} onSuccess={handleUpdated} />

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
            <span>تأیید حذف فاکتور</span>
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
          <Button key="delete" type="primary" danger loading={deleting} onClick={handleDeleteInvoice}>
            حذف فاکتور
          </Button>,
        ]}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: "#ff4d4f", fontWeight: "bold" }}>آیا از حذف این فاکتور اطمینان دارید؟</p>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
            دلیل حذف <span style={{ color: "#ff4d4f" }}>*</span>
          </label>
          <Input.TextArea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="دلیل حذف فاکتور را وارد کنید..."
            rows={3}
          />
        </div>
      </Modal>

      {/* Edit Invoice Modal */}
      <Modal
        title="ویرایش فاکتور"
        open={editModalVisible}
        onCancel={() => { setEditModalVisible(false); setEditInvoiceId(null); editForm.resetFields(); }}
        footer={[
          <Button key="cancel" onClick={() => { setEditModalVisible(false); setEditInvoiceId(null); editForm.resetFields(); }}>
            انصراف
          </Button>,
          <Button key="save" type="primary" loading={editSubmitting} onClick={handleEditSubmit}>
            ذخیره
          </Button>,
        ]}
        width={600}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="شناسه مشتری" name="customer_id" rules={[{ required: true, message: "شناسه مشتری الزامی است" }]}> 
            <Input disabled />
          </Form.Item>

          <Form.Item label="نام مشتری">
            <Input value={editCustomerReadonly.name} disabled />
          </Form.Item>

          <Form.Item label="شماره تماس" name="phone" extra={editLocks.phone ? "قبلاً پر شده و قابل تغییر نیست" : null}>
            <Input disabled={editLocks.phone} />
          </Form.Item>

          <Form.Item label="ایمیل" name="email" extra={editLocks.email ? "قبلاً پر شده و قابل تغییر نیست" : null}>
            <Input type="email" disabled={editLocks.email} />
          </Form.Item>

          <Form.Item label="شهر" name="city" extra={editLocks.city ? "قبلاً پر شده و قابل تغییر نیست" : null}>
            <Input disabled={editLocks.city} />
          </Form.Item>

          <Form.Item label="یادداشت‌ها" name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InvoiceIndex;