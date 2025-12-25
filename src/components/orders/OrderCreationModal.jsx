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
} from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const { Option } = Select;

const debounce = (fn, delay = 500) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

const PAGE_SIZE = 25;

const OrderCreationModal = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // state برای لیست مشتری‌ها
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerPage, setCustomerPage] = useState(1);
  const [hasMoreCustomers, setHasMoreCustomers] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");

  // state برای ساخت بسته بندی
  const [submitting, setSubmitting] = useState(false);

  // گرفتن مشتری‌ها از API
  const fetchCustomers = async ({ page = 1, search = "" } = {}) => {
    if (loadingCustomers) return;
    setLoadingCustomers(true);
    try {
      const res = await api.get("/panel/users", {
        params: {
          per_page: PAGE_SIZE,
          page,
          role: "customer",
          "includes[]": "addresses",
          ...(search ? { search } : {}),
        },
      });

      const { data, meta } = res.data || {};
      setCustomers((prev) => (page === 1 ? data || [] : [...prev, ...(data || [])]));
      setCustomerPage(meta?.current_page || page);
      // اگر total <= page*per_page یعنی دیگه دیتا نداریم
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

  // وقتی مودال باز می‌شود، اولین بار لیست را بگیر
  useEffect(() => {
    if (visible) {
      setCustomers([]);
      setCustomerPage(1);
      setHasMoreCustomers(true);
      fetchCustomers({ page: 1, search: "" });
      form.resetFields();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // جستجوی مشتری با debounce
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

  const handleCustomerScroll = (e) => {
    const target = e.target;
    if (!hasMoreCustomers || loadingCustomers) return;
    const nearBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 50;
    if (nearBottom) {
      fetchCustomers({ page: customerPage + 1, search: customerSearch });
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        customer_id: values.customer_id, // فقط ID مشتری
        qc_controller: values.qc_controller,
        notes: values.notes || "",
      };

      const response = await api.post("/panel/packaging-orders", payload);

      message.success("بسته بندی با موفقیت ایجاد شد");
      onCancel();
      navigate(`/orders/manual/${response.data.data.id}`);
    } catch (error) {
      console.error("Error creating order:", error);
      message.error("خطا در ایجاد بسته بندی");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CheckCircleOutlined className="text-green-500" />
          <span>ایجاد بسته بندی دستی</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={720}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* انتخاب مشتری (فقط customer_id) */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserOutlined />
            انتخاب مشتری
          </h3>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="customer_id"
                label="مشتری"
                rules={[{ required: true, message: "انتخاب مشتری الزامی است" }]}
              >
                <Select
                  showSearch
                  placeholder="جستجو و انتخاب مشتری…"
                  filterOption={false} // سرچ سمت سرور
                  onSearch={debouncedSearch}
                  onPopupScroll={handleCustomerScroll}
                  notFoundContent={
                    loadingCustomers ? <Spin size="small" /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  }
                  optionLabelProp="label"
                >
                  {customers.map((c) => {
                    const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
                    const secondary = c.mobile || c.email || "";
                    const label = `${fullName}${secondary ? " • " + secondary : ""}`;
                    return (
                      <Option key={c.id} value={c.id} label={label}>
                        <div className="flex flex-col">
                          <span className="font-medium">{fullName}</span>
                          <span className="text-xs text-gray-500">
                            {secondary || "بدون اطلاعات تماس"}
                          </span>
                        </div>
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* اطلاعات بسته بندی */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileTextOutlined />
            اطلاعات بسته بندی
          </h3>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="notes" label="یادداشت‌ها">
                <Input.TextArea
                  rows={3}
                  placeholder="مثال: ارسال یک‌شنبه صبح"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="qc_controller"
                label="کنترل‌کننده کیفیت"
                rules={[{ required: true, message: "کنترل‌کننده کیفیت الزامی است" }]}
              >
                <Input placeholder="مثال: QC-Shift-A" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* اکشن‌ها */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={onCancel}>انصراف</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<CheckCircleOutlined />}
          >
            ایجاد بسته بندی
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default OrderCreationModal;
