import React, { useState } from "react";
import { Form, Input, Button, Card, Alert, Checkbox, message, ConfigProvider } from "antd";
import { UserOutlined, LockOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../../services/auth";
import logo from "../../images/1.svg";
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Greenhouse theme configuration
  const themeConfig = {
    token: {
      colorPrimary: '#059669', // Emerald-600
      colorSuccess: '#10b981', // Emerald-500
      colorWarning: '#f59e0b', // Amber-500
      colorError: '#ef4444', // Red-500
      colorInfo: '#3b82f6', // Blue-500
      borderRadius: 12,
      colorBgContainer: '#ffffff',
      colorBgElevated: '#f8fafc',
      boxShadow: '0 10px 25px rgba(5, 150, 105, 0.15)',
    },
    components: {
      Card: {
        headerBg: '#f8fafc',
        bodyBg: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#d1fae5',
      },
      Input: {
        borderColor: '#d1fae5',
        hoverBorderColor: '#059669',
        activeBorderColor: '#059669',
      },
      Button: {
        primaryShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
      },
      Alert: {
        errorBorderColor: '#fecaca',
        errorBg: '#fef2f2',
      }
    },
  };

  const backgroundStyle = {
    background: `
      linear-gradient(
        135deg,
        rgba(5, 150, 105, 0.1) 0%,
        rgba(16, 185, 129, 0.05) 25%,
        rgba(52, 211, 153, 0.1) 50%,
        rgba(110, 231, 183, 0.08) 75%,
        rgba(167, 243, 208, 0.1) 100%
      ),
      url(${require("../../images/fiajyj5fh2jd3bjxkfrq.webp")})
    `,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
    position: "relative",
  };

  // Floating particles overlay
  const particlesOverlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 30%, rgba(5, 150, 105, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 50% 20%, rgba(52, 211, 153, 0.06) 0%, transparent 50%)
    `,
    pointerEvents: "none",
  };

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    try {
      const result = await login(values.username, values.password);
      console.log("✅ پاسخ کامل بک‌اند:", result.data);

      // Show success message first
      message.success("ورود با موفقیت انجام شد ");
      
      // Wait a bit for the message to be visible, then redirect
      setTimeout(() => {
        console.log("Navigating to dashboard after login");
        window.location.replace("/dashboard");
      }, 500);
    } catch (error) {
      // For login errors, show a simple message instead of backend message
      if (error.response) {
        const { status } = error.response;
        // For 401 (Unauthorized) or 422 (Validation) errors, show simple login error message
        if (status === 401 || status === 422) {
          message.error("رمز عبور یا نام کاربری اشتباه است");
          setError("رمز عبور یا نام کاربری اشتباه است");
        } else {
          // For other errors, use unified error handler
          const errorResult = UnifiedErrorHandler.handleApiError(error, form, {
            showValidationMessages: false,
            showGeneralMessages: true,
            defaultMessage: "خطا در ورود. لطفا دوباره تلاش کنید"
          });
          setError(errorResult.message);
        }
      } else {
        // Network or other errors
        message.error("خطا در اتصال به سرور. لطفا دوباره تلاش کنید");
        setError("خطا در اتصال به سرور. لطفا دوباره تلاش کنید");
      }
      
      console.error("خطا در ورود:", error);
      setLoading(false);
    }
  };
  
  return (
    <ConfigProvider theme={themeConfig} direction="rtl">
      <div style={backgroundStyle}>
        {/* Floating particles overlay */}
        <div style={particlesOverlayStyle}></div>
        
        <Card 
          className="w-full max-w-md relative z-10"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(209, 250, 229, 0.5)',
            boxShadow: `
              0 25px 50px rgba(5, 150, 105, 0.15),
              0 0 0 1px rgba(5, 150, 105, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
            borderRadius: '20px',
            overflow: 'hidden',
          }}
          bodyStyle={{
            padding: '3rem 2.5rem',
          }}
        >
          {/* Header with enhanced styling */}
          <div className="text-center flex flex-col justify-center items-center mb-10">
            <div className="relative mb-6">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-lg opacity-20"
                style={{ transform: 'scale(1.1)' }}
              ></div>
              <img
                src={logo}
                alt="Logo"
                className="relative z-10 rounded-full border-4 border-green-200 shadow-lg"
                style={{ 
                  width: "120px", 
                  height: "120px",
                  objectFit: "cover",
                  background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                }}
              />
              {/* Green indicator dot */}
              {/* <div 
                className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full border-3 border-white shadow-lg z-20"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  animation: 'pulse 2s infinite',
                }}
              /> */}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                پنل مدیریت گلخانه
              </h2>
              {/* <div className="flex items-center justify-center space-x-2 text-green-600">
                <EnvironmentOutlined className="text-lg" />
                <span className="text-sm font-medium">سیستم مدیریت هوشمند</span>
              </div> */}
            </div>
          </div>

          {error && (
            <Alert 
              message={error} 
              type="error" 
              showIcon 
              className="mb-6"
              style={{
                backgroundColor: '#fef2f2',
                borderColor: '#fecaca',
                borderRadius: '12px',
                border: '1px solid #fecaca'
              }}
            />
          )}

          <Form 
            form={form} 
            name="login" 
            onFinish={onFinish} 
            layout="vertical" 
            size="large"
            className="greenhouse-form"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: "لطفا نام کاربری را وارد کنید" }]}
            >
              <Input
                prefix={<UserOutlined className="text-green-500" />}
                placeholder="نام کاربری"
                className="h-12"
                style={{
                  borderRadius: '12px',
                  border: '2px solid #d1fae5',
                  backgroundColor: 'rgba(240, 253, 244, 0.3)',
                  fontSize: '16px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#059669';
                  e.target.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1fae5';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "لطفا رمز عبور را وارد کنید" }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-green-500" />}
                placeholder="رمز عبور"
                className="h-12"
                style={{
                  borderRadius: '12px',
                  border: '2px solid #d1fae5',
                  backgroundColor: 'rgba(240, 253, 244, 0.3)',
                  fontSize: '16px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#059669';
                  e.target.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1fae5';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Form.Item>

            <Form.Item className="mt-8">
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="h-12 text-lg font-semibold"
                style={{
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  borderColor: '#059669',
                  boxShadow: `
                    0 4px 12px rgba(5, 150, 105, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                  `,
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 20px rgba(5, 150, 105, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
                }}
              >
                ورود به پنل
              </Button>
            </Form.Item>
          </Form>

          {/* Footer decoration */}
          <div className="text-center mt-6 pt-6 border-t border-green-100">
            <div className="flex items-center justify-center space-x-4 text-xs text-green-600">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-green-300"></div>
              <span className="font-medium">🌱 محیط امن و پایدار</span>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-green-300"></div>
            </div>
          </div>
        </Card>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.8;
            }
          }
          
          .greenhouse-form .ant-input:hover {
            border-color: #059669 !important;
            background-color: rgba(240, 253, 244, 0.5) !important;
          }
          
          .greenhouse-form .ant-input-password:hover {
            border-color: #059669 !important;
            background-color: rgba(240, 253, 244, 0.5) !important;
          }
          
          .greenhouse-form .ant-input:focus,
          .greenhouse-form .ant-input-focused {
            border-color: #059669 !important;
            box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1) !important;
          }
          
          .greenhouse-form .ant-input-password:focus,
          .greenhouse-form .ant-input-password-focused {
            border-color: #059669 !important;
            box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1) !important;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
};

export default Login;