import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  message,
  Card,
  Space,
  Spin,
} from "antd";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { GlobalPropertyErrorHandler } from "../../utils/errorHandler";

const { Option } = Select;
const { TextArea } = Input;

const AddGlobalProperty = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [parents, setParents] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingParents, setLoadingParents] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchParents();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await api.get("/panel/category", {
        params: {
          per_page: 100, // Get a large number to ensure we get all categories
        },
      });
      setCategories(response.data.data || []);
    } catch (error) {
      GlobalPropertyErrorHandler.handleGlobalPropertyError(error, 'fetch');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchParents = async () => {
    setLoadingParents(true);
    try {
      const response = await api.get("/panel/global-property", {
        params: {
          per_page: 100, // Get a large number to ensure we get all properties
        },
      });
      setParents(response.data.data || []);
    } catch (error) {
      GlobalPropertyErrorHandler.handleGlobalPropertyError(error, 'fetch');
    } finally {
      setLoadingParents(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    setValidationErrors({});
    
    try {
      const payload = {
        title: values.title,
        description: values.description,
        order: values.order,
        parent_id: values.parent_id || null,
        category_id: values.category_id || null,
      };

      await api.post("/panel/global-property", payload);

      message.success("مشخصات فنی با موفقیت اضافه شد.");
      navigate("/global-properties");
    } catch (error) {
      // Direct handling of validation errors based on your exact error structure
      if (error.response && error.response.status === 422) {
        const responseData = error.response.data;
        const validationErrors = responseData.data?.errors || responseData.errors || {};
        
        console.log('Validation errors found:', validationErrors);
        setValidationErrors(validationErrors);
        
        // Display each validation error
        Object.keys(validationErrors).forEach(field => {
          const fieldErrors = validationErrors[field];
          if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
            fieldErrors.forEach(errorMsg => {
              // Decode Unicode characters
              const decodedMsg = errorMsg.replace(/\\u[\dA-F]{4}/gi, (match) => {
                return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
              });
              
              // Get field display name
              const fieldDisplayNames = {
                'title': 'عنوان',
                'description': 'توضیحات',
                'category_id': 'دسته‌بندی',
                'parent_id': 'والد',
                'order': 'ترتیب'
              };
              
              const fieldDisplayName = fieldDisplayNames[field] || field;
              message.error(`${fieldDisplayName}: ${decodedMsg}`);
            });
          }
        });
        
        // Set form field errors for visual indication
        form.setFields(
          Object.keys(validationErrors).map(field => {
            const fieldErrors = validationErrors[field];
            if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
              const decodedError = fieldErrors[0].replace(/\\u[\dA-F]{4}/gi, (match) => {
                return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
              });
              return {
                name: field,
                errors: [decodedError]
              };
            }
            return null;
          }).filter(Boolean)
        );
      } else {
        // For non-422 errors, show a general error message
        message.error("خطا در ثبت مشخصات فنی");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="افزودن مشخصات فنی جدید">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ order: 1 }}
      >
        <Form.Item
          name="title"
          label="عنوان"
          rules={[{ required: true, message: "لطفاً عنوان را وارد کنید" }]}
        >
          <Input placeholder="مثال: پلتفرم" />
        </Form.Item>

        <Form.Item
          name="description"
          label="توضیحات"
          rules={[{ required: true, message: "لطفاً توضیحات را وارد کنید" }]}
        >
          <TextArea rows={4} placeholder="توضیحات مشخصات فنی را وارد کنید" />
        </Form.Item>

        <Form.Item
          name="order"
          label="ترتیب"
          rules={[{ required: true, message: "لطفاً ترتیب را وارد کنید" }]}
        >
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="parent_id"
          label="والد"
        >
          <Select 
            placeholder="انتخاب والد" 
            allowClear 
            loading={loadingParents}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {parents.map(parent => (
              <Option key={parent.id} value={parent.id}>{parent.title}-{parent.description}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="category_id"
          label="دسته‌بندی"
          tooltip="دسته‌بندی فقط برای آیتم‌های سطح اول (بدون والد) مجاز است"
        >
          <Select 
            placeholder="انتخاب دسته‌بندی" 
            allowClear 
            loading={loadingCategories}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {categories.map(category => (
              <Option key={category.id} value={category.id}>{category.title}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              ثبت مشخصات فنی
            </Button>
            <Button onClick={() => navigate("/global-properties")}>انصراف</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddGlobalProperty;