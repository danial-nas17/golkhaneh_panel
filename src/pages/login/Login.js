import React, { useState } from "react";
import { Form, Input, Button, Card, Alert, Checkbox, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../../services/auth";
import logo from "../../images/headerlogo.png"; 

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const backgroundStyle = {
    backgroundImage: `url(${require("../../images/973.jpg")})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  };

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    try {
      const result = await login(values.username, values.password);
      message.success("ورود با موفقیت انجام شد ");
      console.log("Navigating to /dashboard");
      window.location.href = "/dashboard";

      // navigate("/dashboard");
    } catch (error) {
      if (error.response && error.response.status === 422) {
        const validationErrors = error.validationErrors || {};
        
        // Display the first validation error message
        const firstErrorField = Object.keys(validationErrors)[0];
        const firstErrorMessage = validationErrors[firstErrorField]?.[0];
        
        if (firstErrorMessage) {
          message.error(firstErrorMessage);
          setError(firstErrorMessage);
        } else {
          const errorMessage = "خطای اعتبارسنجی در فرم";
          message.error(errorMessage);
          setError(errorMessage);
        }
        
        // Set form field errors
        const formErrors = {};
        Object.keys(validationErrors).forEach(field => {
          formErrors[field] = {
            errors: validationErrors[field].map(msg => new Error(msg))
          };
        });
        
        form.setFields(Object.keys(formErrors).map(field => ({
          name: field,
          errors: validationErrors[field]
        })));
        
        console.error("خطای اعتبارسنجی:", validationErrors);
      } else {
        const errorMessage = error.response?.data?.message || "خطا در ورود. لطفا دوباره تلاش کنید";
        message.error(errorMessage);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };
  
  
  return (
    <div style={backgroundStyle}>
      <Card className="w-full max-w-md shadow-lg p-8">
        <div className="text-center  flex flex-col justify-center items-center mb-8">
          <img
            src={logo}
            alt="Logo"
            style={{ width: "120px", marginBottom: "20px" }}
          />
          <h2 className="text-2xl font-bold"> پنل مدیریت </h2>
        </div>

        {error && <Alert message={error} type="error" showIcon className="mb-4" />}

        <Form form={form} name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: "لطفا نام کاربری را وارد کنید" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="نام کاربری"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "لطفا رمز عبور را وارد کنید" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="رمز عبور"
              className="rounded-lg"
            />
          </Form.Item>

          {/* <Form.Item>
            <div className="flex justify-between items-center">
              <Checkbox>Remember me</Checkbox>
              <a className="text-primary" href="/forgot-password">
                Forgot Password
              </a>
            </div>
          </Form.Item> */}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="rounded-lg"
            >
              ورود
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
