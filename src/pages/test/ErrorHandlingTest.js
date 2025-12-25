import React, { useState } from "react";
import {
  Card,
  Button,
  Form,
  Input,
  Space,
  Divider,
  Typography,
  Alert,
  message
} from "antd";
import api from "../../api";
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";

const { Title, Text } = Typography;

const ErrorHandlingTest = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [lastErrorResult, setLastErrorResult] = useState(null);

  // Test 422 validation error
  const test422Error = async () => {
    setLoading(true);
    try {
      // This should trigger a 422 validation error
      await api.post("/panel/category", {
        // Send incomplete data to trigger validation errors
        title: "", // Empty title should cause validation error
        description: ""
      });
    } catch (error) {
      const errorResult = UnifiedErrorHandler.handleApiError(error, form, {
        showValidationMessages: false,
        showGeneralMessages: true,
        defaultMessage: "خطا در تست 422"
      });
      
      setValidationErrors(errorResult.validationErrors);
      setLastErrorResult(errorResult);
      console.log("422 Error Result:", errorResult);
    } finally {
      setLoading(false);
    }
  };

  // Test 403 forbidden error
  const test403Error = async () => {
    setLoading(true);
    try {
      // This should trigger a 403 forbidden error (adjust endpoint as needed)
      await api.get("/panel/admin-only-endpoint");
    } catch (error) {
      const errorResult = UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در تست 403"
      });
      
      setLastErrorResult(errorResult);
      console.log("403 Error Result:", errorResult);
    } finally {
      setLoading(false);
    }
  };

  // Test form submission with validation
  const onFinish = async (values) => {
    setLoading(true);
    setValidationErrors({});
    
    try {
      // Simulate API call that might fail with validation errors
      const response = await api.post("/panel/category", values);
      message.success("عملیات با موفقیت انجام شد");
      form.resetFields();
      setLastErrorResult(null);
    } catch (error) {
      const errorResult = UnifiedErrorHandler.handleApiError(error, form, {
        showValidationMessages: false, // Don't show individual messages
        showGeneralMessages: true,     // Show general error
        defaultMessage: "خطا در ارسال فرم"
      });
      
      if (errorResult.type === 'validation') {
        setValidationErrors(errorResult.validationErrors);
      }
      
      setLastErrorResult(errorResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <Title level={2}>تست سیستم مدیریت خطا</Title>
      
      <Card title="تست خطاهای مختلف" style={{ marginBottom: 24 }}>
        <Space wrap>
          <Button 
            type="primary" 
            danger 
            onClick={test422Error}
            loading={loading}
          >
            تست خطای 422 (Validation)
          </Button>
          
          <Button 
            type="primary" 
            danger 
            onClick={test403Error}
            loading={loading}
          >
            تست خطای 403 (Forbidden)
          </Button>
        </Space>
      </Card>

      <Card title="فرم تست" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="title"
            label="عنوان"
            rules={[
              { required: true, message: "لطفاً عنوان را وارد کنید" }
            ]}
          >
            <Input placeholder="عنوان را وارد کنید" />
          </Form.Item>

          <Form.Item
            name="description"
            label="توضیحات"
            rules={[
              { required: true, message: "لطفاً توضیحات را وارد کنید" }
            ]}
          >
            <Input.TextArea rows={4} placeholder="توضیحات را وارد کنید" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              ارسال فرم
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {Object.keys(validationErrors).length > 0 && (
        <Card title="خطاهای اعتبارسنجی" style={{ marginBottom: 24 }}>
          <Alert
            message="خطاهای فرم"
            description={
              <ul>
                {Object.entries(validationErrors).map(([field, errors]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {errors.join(", ")}
                  </li>
                ))}
              </ul>
            }
            type="error"
            showIcon
          />
        </Card>
      )}

      {lastErrorResult && (
        <Card title="آخرین نتیجه خطا" style={{ marginBottom: 24 }}>
          <pre style={{ 
            background: "#f5f5f5", 
            padding: "16px", 
            borderRadius: "4px",
            overflow: "auto"
          }}>
            {JSON.stringify(lastErrorResult, null, 2)}
          </pre>
        </Card>
      )}

      <Card title="راهنمای استفاده">
        <div>
          <Title level={4}>نحوه استفاده از UnifiedErrorHandler:</Title>
          
          <Divider />
          
          <Text strong>1. برای خطاهای فرم با validation:</Text>
          <pre style={{ background: "#f5f5f5", padding: "8px", margin: "8px 0" }}>
{`try {
  await api.post("/endpoint", data);
} catch (error) {
  const errorResult = UnifiedErrorHandler.handleApiError(error, form, {
    showValidationMessages: false,
    showGeneralMessages: true,
    defaultMessage: "خطا در عملیات"
  });
  
  if (errorResult.type === 'validation') {
    setValidationErrors(errorResult.validationErrors);
  }
}`}
          </pre>

          <Divider />

          <Text strong>2. برای خطاهای عمومی:</Text>
          <pre style={{ background: "#f5f5f5", padding: "8px", margin: "8px 0" }}>
{`try {
  await api.get("/endpoint");
} catch (error) {
  UnifiedErrorHandler.handleApiError(error, null, {
    showGeneralMessages: true,
    defaultMessage: "خطا در دریافت اطلاعات"
  });
}`}
          </pre>
        </div>
      </Card>
    </div>
  );
};

export default ErrorHandlingTest;