import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  message,
  Card,
  Space,
} from "antd";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { FilterErrorHandler } from "../../utils/errorHandler";

const { Option } = Select;

const AddFilter = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("price");
  const [validationErrors, setValidationErrors] = useState({});

  const onFinish = async (values) => {
    setLoading(true);
    setValidationErrors({});
    
    try {
      const payload = {
        type: values.type,
        label: values.label,
        order: values.order,
        value: {}
      };

      if (values.type === "price") {
        payload.value = {
          min: values.min_value !== undefined ? Number(values.min_value) : null,
          max: values.max_value !== undefined ? Number(values.max_value) : null,
        };

        if (values.min_value !== undefined && values.max_value !== undefined) {
          payload.operator = "between";
        } else if (values.min_value !== undefined) {
          payload.operator = ">=";
        } else if (values.max_value !== undefined) {
          payload.operator = "<=";
        }
      }

      await api.post("/panel/dynamic-filter", payload);

      message.success("فیلتر با موفقیت اضافه شد.");
      navigate("/filters");
    } catch (error) {
      const errorInfo = FilterErrorHandler.handleFilterValidation(error);
      
      if (errorInfo.status === 422) {
        setValidationErrors(errorInfo.validationErrors);
        
        // Set form field errors
        const formErrors = {};
        Object.keys(errorInfo.validationErrors).forEach(field => {
          const fieldErrors = FilterErrorHandler.getFieldErrors(
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

  const handleTypeChange = (value) => {
    setFilterType(value);
    form.resetFields(["min_value", "max_value"]);
  };

  return (
    <Card title="افزودن فیلتر جدید">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ type: "price", order: 1 }}
      >
        <Form.Item
          name="label"
          label="عنوان فیلتر"
          rules={[{ required: true, message: "لطفاً عنوان فیلتر را وارد کنید" }]}
        >
          <Input placeholder="مثال: گوشی‌های ارزان قیمت" />
        </Form.Item>

        <Form.Item
          name="type"
          label="نوع فیلتر"
          rules={[{ required: true, message: "لطفاً نوع فیلتر را انتخاب کنید" }]}
        >
          <Select onChange={handleTypeChange}>
            <Option value="price">قیمت</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="order"
          label="ترتیب نمایش"
          rules={[
            { required: true, message: "لطفاً ترتیب نمایش را وارد کنید" },
            { type: 'number', min: 1, message: "ترتیب باید عددی مثبت باشد" }
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={1}
            placeholder="مثال: 1"
          />
        </Form.Item>

        {filterType === "price" && (
          <>
            <Form.Item
              name="min_value"
              label="حداقل قیمت"
              rules={[
                {
                  validator: (_, value) => {
                    const maxValue = form.getFieldValue("max_value");
                    if (value === undefined && maxValue === undefined) {
                      return Promise.reject("حداقل یکی از مقادیر حداقل یا حداکثر باید وارد شود");
                    }
                    if (value !== undefined && maxValue !== undefined && value > maxValue) {
                      return Promise.reject("مقدار حداقل نمی‌تواند بیشتر از مقدار حداکثر باشد");
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                placeholder="مثال: 1000000"
              />
            </Form.Item>

            <Form.Item
              name="max_value"
              label="حداکثر قیمت"
              dependencies={["min_value"]}
              rules={[
                {
                  validator: (_, value) => {
                    const minValue = form.getFieldValue("min_value");
                    if (value === undefined && minValue === undefined) {
                      return Promise.reject("حداقل یکی از مقادیر حداقل یا حداکثر باید وارد شود");
                    }
                    if (value !== undefined && minValue !== undefined && value < minValue) {
                      return Promise.reject("مقدار حداکثر نمی‌تواند کمتر از مقدار حداقل باشد");
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                placeholder="مثال: 3000000"
              />
            </Form.Item>
          </>
        )}

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              ثبت فیلتر
            </Button>
            <Button onClick={() => navigate("/filters")}>انصراف</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddFilter;