import React, { useEffect, useState } from "react";
import { Form, Input, Button, message, Spin, Select } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../../../api";

const AddFaqBlog = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [plan, setPlan] = useState([]);
  const [options, setOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);


  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const response = await api.get("/panel/blog"); 
        setOptions(
          response.data.data.map((item) => ({
            value: item.id,
            label: item.title,
          }))
        );
      } catch (error) {
        message.error("خطا در دریافت گزینه‌ها");
      }
      setLoadingOptions(false);
    };

    fetchOptions();
  }, []);

  const fetchPlan = async () => {
    const response = await api.get("panel/blog");
    setPlan(response.data.data);
    console.log(response.data.data);
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await api.post("/panel/faq", {
        ...values,
        faqable_type: "Blog",
      });
      message.success("سوال جدید با موفقیت ایجاد شد");
      navigate("/faq/blog");
    } catch (error) {
      message.error("خطا در ایجاد سوال");
    }
    setLoading(false);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2>ایجاد سوال جدید</h2>
        <Button onClick={() => navigate("/faq/blog")}>بازگشت به لیست</Button>
      </div>

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="faqable_id"
            label=" بلاگ"
            rules={[
              {
                required: true,
                message: "لطفا بلاگ را انتخاب کنید",
              },
            ]}
          >
            <Select
              loading={loadingOptions}
              options={options}
              placeholder="انتخاب بلاگ"
            />
          </Form.Item>
          
          <Form.Item
            label="سوال"
            name="question"
            rules={[
              {
                required: true,
                message: "لطفا سوال را وارد کنید",
              },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="پاسخ"
            name="answer"
            rules={[
              {
                required: true,
                message: "لطفا پاسخ را وارد کنید",
              },
            ]}
          >
            <Input.TextArea rows={6} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              ذخیره
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </div>
  );
};

export default AddFaqBlog;
