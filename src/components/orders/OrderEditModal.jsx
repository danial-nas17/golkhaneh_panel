import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  Spin,
  Empty,
  Row,
  Col,
  message,
} from "antd";
import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import api from "../../api";

const { Option } = Select;
const PAGE_SIZE = 25;

const debounce = (fn, delay = 500) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

// Select مشتری با لود تنبل + جست‌وجو
function CustomerSelect({ value, onChange }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = async ({ page = 1, search = "" } = {}) => {
    if (loading) return;
    setLoading(true);
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
      setOptions((prev) => (page === 1 ? data || [] : [...prev, ...(data || [])]));
      setPage(meta?.current_page || page);
      const total = Number(meta?.total ?? 0);
      const perPage = Number(meta?.per_page ?? PAGE_SIZE);
      const current = Number(meta?.current_page ?? page);
      setHasMore(current * perPage < total);
    } catch (e) {
      message.error("خطا در دریافت لیست مشتری‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers({ page: 1, search: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        setSearch(val);
        setOptions([]);
        setHasMore(true);
        fetchCustomers({ page: 1, search: val });
      }, 500),
    []
  );

  const onScroll = (e) => {
    if (!hasMore || loading) return;
    const target = e.target;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 50;
    if (nearBottom) {
      fetchCustomers({ page: page + 1, search });
    }
  };

  return (
    <Select
      showSearch
      placeholder="جستجو و انتخاب مشتری…"
      value={value}
      onChange={onChange}
      filterOption={false}
      onSearch={debouncedSearch}
      onPopupScroll={onScroll}
      notFoundContent={loading ? <Spin size="small" /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      optionLabelProp="label"
      allowClear
    >
      {options.map((c) => {
        const fullName =
          [c.first_name, c.last_name].filter(Boolean).join(" ") ||
          c.company_name ||
          "—";
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
  );
}

const OrderEditModal = ({ visible, orderId, onCancel, onUpdated }) => {
  const [form] = Form.useForm();
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [saving, setSaving] = useState(false);

  // گرفتن اطلاعات سفارش برای پرکردن فرم
  const fetchOrder = async (id) => {
    if (!id) return;
    setLoadingOrder(true);
    try {
      const res = await api.get(`/panel/packaging-orders/${id}`);
      const data = res.data?.data;
      form.setFieldsValue({
        customer_id: data?.customer?.id,
        qc_controller: data?.qc_controller || "",
        notes: data?.notes || "",
      });
    } catch (e) {
      message.error("خطا در دریافت اطلاعات سفارش");
    } finally {
      setLoadingOrder(false);
    }
  };

  useEffect(() => {
    if (visible && orderId) {
      form.resetFields();
      fetchOrder(orderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, orderId]);

  const handleSubmit = async (values) => {
    if (!orderId) return;
    setSaving(true);
    try {
      const payload = {
        customer_id: values.customer_id,
        qc_controller: values.qc_controller,
        notes: values.notes || "",
      };
      await api.put(`/panel/packaging-orders/${orderId}`, payload);
      message.success("سفارش با موفقیت به‌روزرسانی شد");
      onCancel?.();
      onUpdated?.(); // ریفرش لیست در صفحه والد
    } catch (e) {
      message.error("خطا در به‌روزرسانی سفارش");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <EditOutlined />
          <span>ویرایش سفارش #{orderId ?? "—"}</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      destroyOnClose
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="customer_id"
              label="مشتری"
              rules={[{ required: true, message: "انتخاب مشتری الزامی است" }]}
            >
              <CustomerSelect />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="qc_controller"
              label="کنترل‌کننده کیفیت"
              rules={[{ required: true, message: "کنترل‌کننده کیفیت الزامی است" }]}
            >
              <Input placeholder="مثال: QC-Shift-A" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="notes" label="یادداشت‌ها">
          <Input.TextArea rows={3} placeholder="مثال: ارسال یک‌شنبه صبح" />
        </Form.Item>

        <div className="flex justify-end gap-2">
          <Button onClick={() => fetchOrder(orderId)} disabled={loadingOrder}>
            بازنشانی
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
            icon={<SaveOutlined />}
          >
            ذخیره تغییرات
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default OrderEditModal;
