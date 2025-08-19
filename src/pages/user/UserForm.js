import { useState, useEffect } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";

const UserForm = () => {
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [form] = Form.useForm();

  useEffect(() => {
    if (isEditing) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/panel/users/${id}`);
      const userData = response.data.data;
      setInitialValues(userData);
      form.setFieldsValue(userData);
    } catch (error) {
      message.error("خطا در دریافت اطلاعات کاربر");
      navigate("/users");
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (isEditing && !values.password) {
        delete values.password;
        delete values.password_confirmation;
      }

      if (isEditing) {
        await api.put(`/panel/users/${id}`, values);
        message.success("کاربر با موفقیت به‌روزرسانی شد");
      } else {
        await api.post("/panel/users", values);
        message.success("کاربر با موفقیت ایجاد شد");
      }
      navigate("/users");
    } catch (error) {
      message.error(
        isEditing ? "خطا در به‌روزرسانی کاربر" : "خطا در ایجاد کاربر"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">
          {isEditing ? "ویرایش کاربر" : "ایجاد کاربر جدید"}
        </h1>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialValues}
      >
        <Form.Item
          name="first_name"
          label="نام"
          rules={[{ required: true, message: "لطفاً نام را وارد کنید!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="last_name"
          label="نام خانوادگی"
          rules={[
            { required: true, message: "لطفاً نام خانوادگی را وارد کنید!" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="company_name"
          label="نام شرکت"
          rules={[
            { required: true, message: "لطفاً نام شرکت را وارد کنید!" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label="ایمیل"
          rules={[
            { required: true, message: "لطفاً ایمیل را وارد کنید!" },
            { type: "email", message: "لطفاً یک ایمیل معتبر وارد کنید!" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="mobile"
          label="شماره موبایل"
          rules={[
            { required: true, message: "لطفاً شماره موبایل را وارد کنید!" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="country"
          label="کشور"
          rules={[{ required: true, message: "لطفاً کشور را وارد کنید!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="business_info"
          label="اطلاعات کسب‌وکار"
          rules={[
            { required: true, message: "لطفاً اطلاعات کسب‌وکار را وارد کنید!" },
          ]}
        >
          <Input.TextArea />
        </Form.Item>

        <Form.Item
          name="password"
          label="رمز عبور"
          rules={[
            { required: !isEditing, message: "لطفاً رمز عبور را وارد کنید!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || value.length >= 6) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("رمز عبور باید حداقل ۶ کاراکتر باشد!")
                );
              },
            }),
          ]}
        >
          <Input.Password
            placeholder={
              isEditing
                ? "اگر نمی‌خواهید رمز عبور تغییر کند، خالی بگذارید"
                : "رمز عبور را وارد کنید"
            }
          />
        </Form.Item>

        <Form.Item
          name="password_confirmation"
          label="تأیید رمز عبور"
          dependencies={["password"]}
          rules={[
            {
              required: !isEditing && !!form.getFieldValue("password"),
              message: "لطفاً رمز عبور را تأیید کنید!",
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value && !getFieldValue("password")) {
                  return Promise.resolve();
                }
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("رمز عبور و تأیید آن مطابقت ندارند!")
                );
              },
            }),
          ]}
        >
          <Input.Password
            placeholder={
              isEditing
                ? "اگر نمی‌خواهید رمز عبور تغییر کند، خالی بگذارید"
                : "رمز عبور را تأیید کنید"
            }
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEditing ? "به‌روزرسانی کاربر" : "ایجاد کاربر"}
          </Button>
          <Button
            onClick={() => navigate("/users")}
            style={{ marginLeft: "8px" }}
          >
            انصراف
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default UserForm;
