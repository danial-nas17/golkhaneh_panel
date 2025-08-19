import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Spin, Select } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api";

const EditFaqBlog = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);


  useEffect(() => {
    const fetchFaq = async () => {
      try {

        const categoriesResponse = await api.get('/panel/blog');
        setCategories(categoriesResponse.data.data);

        const response = await api.get(`/panel/faq/${id}`);
        const faq = response.data.data;
        form.setFieldsValue({
          question: faq.question,
          answer: faq.answer,
          faqable_id: faq.faqable?.id
        });
      } catch (error) {
        message.error("خطا در دریافت اطلاعات");
        navigate("/faq/blog");
      }
      setInitialLoading(false);
    };

    fetchFaq();
  }, [id, form, navigate]);

  const onFinish = async (values) => {
    setLoading(true);

    
    try {
      await api.put(`/panel/faq/${id}`, {
        ...values,
        faqable_type: "Blog",
      });
      message.success("سوال با موفقیت ویرایش شد");
      navigate("/faq/blog");
    } catch (error) {
      message.error("خطا در ویرایش سوال");
    }
    setLoading(false);
  };

  if (initialLoading) {
    return <Spin size="large" />;
  }

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
        <h2>ویرایش سوال</h2>
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
            label=" بلاگ‌ها"
            rules={[
              { required: true, message: "لطفا برنامه مهاجرتی را انتخاب کنید" },
            ]}
          >
            <Select>
              {categories.map((category) => (
                <Select.Option key={category.id} value={category.id}>
                  {category.title}
                </Select.Option>
              ))}
            </Select>
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
          <div className="flex gap-10">
            <Form.Item>
              <Button type="primary" htmlType="submit">
                به‌روزرسانی
              </Button>
            </Form.Item>
            <Button onClick={() => navigate("/faq/plan")}>بازگشت</Button>
          </div>
        </Form>
      </Spin>
    </div>
  );
};

export default EditFaqBlog;
