import React, { useState, useEffect } from "react";
import { Form, Input, Button, InputNumber, Switch, message, Card, Row, Col } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";

function AddEditCarrier() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCarrier();
    }
  }, [id]);

  const fetchCarrier = async () => {
    try {
      const response = await api.get(`/panel/carriers/${id}`);
      form.setFieldsValue(response.data.data);
    } catch (error) {
      message.error("خطا در دریافت اطلاعات حامل");
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (id) {
        await api.put(`/panel/carriers/${id}`, values);
        message.success("حامل با موفقیت ویرایش شد");
      } else {
        await api.post("/panel/carriers", values);
        message.success("حامل با موفقیت اضافه شد");
      }
      navigate("/career");
    } catch (error) {
      message.error("خطا در ذخیره‌سازی حامل");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h1 className="text-xl mb-10">ایجاد/ویرایش حامل‌ها</h1>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="title"
              label="عنوان"
              rules={[{ required: true, message: "لطفاً عنوان را وارد کنید" }]}
            >
              <Input />
            </Form.Item>
          </Col>
        
          <Col span={12}>
            <Form.Item name="eta" label="زمان تحویل">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item name="cost" label="هزینه" rules={[{ required: true }]}>
              <Input style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="min_limit" label="حداقل سقف خرید">
              <Input style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item name="free_shipment_limit" label="حداقل سقف خرید رایگان">
              <Input style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="order" label="ترتیب">
              <Input style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="active" label="وضعیت" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                {id ? "ویرایش" : "افزودن"}
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}

export default AddEditCarrier;