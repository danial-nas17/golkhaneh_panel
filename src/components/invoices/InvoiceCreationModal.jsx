import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  message,
  Row,
  Col,
  Select,
  Spin,
  Empty,
  Radio,
  Divider,
  Space,
} from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const { Option } = Select;
const { TextArea } = Input;

const debounce = (fn, delay = 500) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

const PAGE_SIZE = 25;

const InvoiceCreationModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Customer selection states
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerPage, setCustomerPage] = useState(1);
  const [hasMoreCustomers, setHasMoreCustomers] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");

  // Customer creation mode
  const [customerMode, setCustomerMode] = useState("existing"); // "existing" or "new"
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [lockPreFilledFields, setLockPreFilledFields] = useState(false);
  const [loadingCustomerDetails, setLoadingCustomerDetails] = useState(false);

  // Form submission
  const [submitting, setSubmitting] = useState(false);

  // Payment types
  const paymentTypes = [
    { value: "cash", label: "نقدی" },
    { value: "credit", label: "اعتباری" },
    { value: "card_to_card", label: "کارت به کارت" },
    { value: "cheque", label: "چک" },
    { value: "other", label: "سایر" },
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      setCustomers([]);
      setCustomerPage(1);
      setHasMoreCustomers(true);
      setCustomerMode("existing");
      setSelectedCustomerId(null);
      setSelectedCustomerData(null);
      setCustomerSearch("");
      form.resetFields();

      // Load initial customers
      fetchCustomers({ page: 1, search: "" });
    }
  }, [visible]);

  // Fetch customers from API
  const fetchCustomers = async ({ page = 1, search = "" } = {}) => {
    if (loadingCustomers) return;
    setLoadingCustomers(true);
    try {
      const res = await api.get("/panel/customers", {
        params: {
          per_page: PAGE_SIZE,
          page,
          search,
        },
      });

      const { data, meta } = res.data || {};
      setCustomers((prev) => (page === 1 ? data || [] : [...prev, ...(data || [])]));
      setCustomerPage(meta?.current_page || page);

      const total = meta?.total ?? 0;
      const perPage = Number(meta?.per_page ?? PAGE_SIZE);
      const current = Number(meta?.current_page ?? page);
      setHasMoreCustomers(current * perPage < total);
    } catch (e) {
      message.error("خطا در دریافت لیست مشتری‌ها");
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        setCustomerSearch(val);
        setCustomers([]);
        setHasMoreCustomers(true);
        fetchCustomers({ page: 1, search: val });
      }, 500),
    []
  );

  // Handle customer selection
  const handleCustomerSelect = async (customerId) => {
    setSelectedCustomerId(customerId);
    setLoadingCustomerDetails(true);

    try {
      const response = await api.get(`/panel/customers/${customerId}`);
      const customerData = response.data.data;
      setSelectedCustomerData(customerData);
      setLockPreFilledFields(true);

      // Pre-fill form with customer data
      form.setFieldsValue({
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        customer_email: customerData.email,
        customer_address: customerData.address,
        customer_city: customerData.city,
      });
    } catch (error) {
      message.error("خطا در دریافت اطلاعات مشتری");
      console.error("Error fetching customer details:", error);
    } finally {
      setLoadingCustomerDetails(false);
    }
  };

  // Handle customer mode change
  const handleCustomerModeChange = (mode) => {
    setCustomerMode(mode);
    setSelectedCustomerId(null);
    setSelectedCustomerData(null);
    setLockPreFilledFields(false);

    // Reset customer-related fields
    form.setFieldsValue({
      customer_id: null,
      customer_name: null,
      customer_phone: null,
      customer_email: null,
      customer_address: null,
      customer_city: null,
    });
  };

  // Handle scroll for infinite loading
  const handleCustomerScroll = (e) => {
    const target = e.target;
    if (!hasMoreCustomers || loadingCustomers) return;
    const nearBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 50;
    if (nearBottom) {
      fetchCustomers({ page: customerPage + 1, search: customerSearch });
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      let payload = {};

      if (customerMode === "existing") {
        // Existing customer
        if (selectedCustomerId) {
          payload.customer_id = selectedCustomerId;

          // Check if we need to update existing customer
          const hasUpdates = values.customer_name || values.customer_phone ||
                           values.customer_email || values.customer_address || values.customer_city;

          if (hasUpdates) {
            payload.customer = {};
            if (values.customer_name) payload.customer.name = values.customer_name;
            if (values.customer_phone) payload.customer.phone = values.customer_phone;
            if (values.customer_email) payload.customer.email = values.customer_email;
            if (values.customer_address) payload.customer.address = values.customer_address;
            if (values.customer_city) payload.customer.city = values.customer_city;
            payload.update_existing_customer = true;
          }
        }
      } else {
        // New customer
        payload.customer = {
          name: values.customer_name,
          phone: values.customer_phone,
          email: values.customer_email,
          address: values.customer_address,
          city: values.customer_city,
        };
      }

      // Add payment type and notes
      payload.payment_type = values.payment_type;
      if (values.notes) payload.notes = values.notes;

      const response = await api.post("/panel/invoices", payload);
      const newId = response?.data?.data?.id;

      message.success("فاکتور با موفقیت ایجاد شد");
      onCancel();
      if (onSuccess) onSuccess();

      // Direct operator to scan/pricing page
      if (newId) {
        navigate(`/invoices/${newId}/scan`);
      } else {
        navigate("/invoices");
      }

    } catch (error) {
      console.error("Error creating invoice:", error);
      message.error("خطا در ایجاد فاکتور");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CheckCircleOutlined className="text-green-500" />
          <span>ایجاد فاکتور فروش</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Customer Selection Mode */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserOutlined />
            انتخاب مشتری
          </h3>

          <Form.Item label="نوع مشتری">
            <Radio.Group
              value={customerMode}
              onChange={(e) => handleCustomerModeChange(e.target.value)}
            >
              <Radio value="existing">مشتری موجود</Radio>
              <Radio value="new">مشتری جدید</Radio>
            </Radio.Group>
          </Form.Item>

          {customerMode === "existing" ? (
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="customer_id"
                  label="انتخاب مشتری"
                  rules={[{ required: true, message: "انتخاب مشتری الزامی است" }]}
                >
                  <Select
                    showSearch
                    placeholder="جستجو و انتخاب مشتری..."
                    filterOption={false}
                    onSearch={debouncedSearch}
                    onPopupScroll={handleCustomerScroll}
                    onChange={handleCustomerSelect}
                    notFoundContent={
                      loadingCustomers ? <Spin size="small" /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    }
                    optionLabelProp="label"
                  >
                    {customers.map((c) => {
                      const label = `${c.name || "—"} • ${c.phone || ""} ${c.email ? "• " + c.email : ""}`;
                      return (
                        <Option key={c.id} value={c.id} label={label}>
                          <div className="flex flex-col">
                            <span className="font-medium">{c.name || "—"}</span>
                            <span className="text-xs text-gray-500">
                              {c.phone || c.email || "بدون اطلاعات تماس"}
                            </span>
                          </div>
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          ) : (
            <div className="text-sm text-gray-600 mb-4">
              لطفا اطلاعات مشتری جدید را وارد کنید
            </div>
          )}
        </div>

        {/* Customer Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">اطلاعات مشتری</h3>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customer_name"
                label="نام مشتری"
                rules={[{ required: true, message: "نام مشتری الزامی است" }]}
              >
                <Input placeholder="نام مشتری را وارد کنید" disabled={customerMode === "existing" && lockPreFilledFields} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customer_phone"
                label="شماره تماس"
                rules={[{ required: true, message: "شماره تماس الزامی است" }]}
              >
                <Input placeholder="09123456789" disabled={customerMode === "existing" && lockPreFilledFields} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer_email" label="ایمیل">
                <Input placeholder="email@example.com" disabled={customerMode === "existing" && lockPreFilledFields} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_city" label="شهر" rules={[{ required: true, message: "شهر الزامی است" }]}> 
                <Input placeholder="نام شهر" disabled={customerMode === "existing" && lockPreFilledFields} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="customer_address" label="آدرس">
                <TextArea
                  rows={2}
                  placeholder="آدرس کامل مشتری"
                  disabled={customerMode === "existing" && lockPreFilledFields}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* Invoice Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileTextOutlined />
            اطلاعات فاکتور
          </h3>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="payment_type"
                label="نوع پرداخت"
                // rules={[{ required: true, message: "نوع پرداخت الزامی است" }]}
              >
                <Select placeholder="نوع پرداخت را انتخاب کنید">
                  {paymentTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="یادداشت‌ها">
                <TextArea
                  rows={3}
                  placeholder="یادداشت‌های مربوط به فاکتور"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={onCancel}>انصراف</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<CheckCircleOutlined />}
          >
            ایجاد فاکتور
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default InvoiceCreationModal;