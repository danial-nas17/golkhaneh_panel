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
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import { GlobalPropertyErrorHandler } from "../../utils/errorHandler";

const { Option } = Select;
const { TextArea } = Input;

const EditGlobalProperty = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [categories, setCategories] = useState([]);
  const [parents, setParents] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingParents, setLoadingParents] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchParents();
    fetchGlobalProperty();
  }, [id]);

  const fetchGlobalProperty = async () => {
    setLoadingProperty(true);
    try {
      const response = await api.get(`/panel/global-property/${id}`);
      const data = response?.data?.data;
      
      form.setFieldsValue({
        title: data?.title,
        description: data?.description,
        order: data?.order,
        parent_id: data?.parent_id,
        category_id: data?.category_id,
      });
    } catch (error) {
      GlobalPropertyErrorHandler.handleGlobalPropertyError(error, 'fetch');
      navigate("/global-properties");
    } finally {
      setLoadingProperty(false);
    }
  };

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
      // Filter out the current property from parents list to avoid self-reference
      const filteredParents = response.data.data.filter(item => item.id !== parseInt(id));
      setParents(filteredParents || []);
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

      await api.put(`/panel/global-property/${id}`, payload);

      message.success("مشخصات فنی با موفقیت ویرایش شد.");
      navigate("/global-properties");
    } catch (error) {
      const errorInfo = GlobalPropertyErrorHandler.handleGlobalPropertyValidation(error);
      
      if (errorInfo.status === 422) {
        setValidationErrors(errorInfo.validationErrors);
        
        // Set form field errors
        const formErrors = {};
        Object.keys(errorInfo.validationErrors).forEach(field => {
          const fieldErrors = GlobalPropertyErrorHandler.getFieldErrors(
            errorInfo.validationErrors, 
            field
          );
          if (fieldErrors.length > 0) {
            formErrors[field] = {
              validateStatus: 'error',
              help: fieldErrors[0]
            };
          }
        });
        
        // Apply errors to form fields
        form.setFields(
          Object.keys(formErrors).map(field => ({
            name: field,
            errors: [formErrors[field].help]
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingProperty) {
    return (
      <Card>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="ویرایش مشخصات فنی">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
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
              ویرایش مشخصات فنی
            </Button>
            <Button onClick={() => navigate("/global-properties")}>انصراف</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EditGlobalProperty;