import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, message } from 'antd';
import api from '../../../api';

const { TextArea } = Input;
const { Option } = Select;
const ProductDetailsForm = () => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get('/panel/category?per_page=100&page=1');
      setCategories(response.data.data);
    } catch (error) {
      message.error('Error fetching categories');
      console.error(error);
    }
  };

  // Fetch brands
  const fetchBrands = async () => {
    try {
      const response = await api.get('/panel/brand?per_page=100&page=1');
      setBrands(response.data.data);
    } catch (error) {
      message.error('Error fetching brands');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await api.post('/panel/product', values);
      message.success('Product details submitted successfully');
      form.resetFields();
    } catch (error) {
      message.error('Error submitting product details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      style={{ maxWidth: '600px', margin: 'auto' }}
    >
      <Form.Item
        name="title"
        label="عنوان"
        rules={[{ required: true, message: 'لطفاً عنوان را وارد کنید' }]}
      >
        <Input placeholder="عنوان محصول" />
      </Form.Item>

      <Form.Item
        name="warehouse_code"
        label="کد انبار"
        rules={[{ required: true, message: 'لطفاً کد انبار را وارد کنید' }]}
      >
        <Input placeholder="کد انبار" />
      </Form.Item>

      <Form.Item
        name="product_code"
        label="کد محصول"
        rules={[{ required: true, message: 'لطفاً کد محصول را وارد کنید' }]}
      >
        <Input placeholder="کد محصول" />
      </Form.Item>

      <Form.Item
        name="description"
        label="توضیحات"
        rules={[{ required: true, message: 'لطفاً توضیحات را وارد کنید' }]}
      >
        <TextArea rows={4} placeholder="توضیحات محصول" />
      </Form.Item>

      <Form.Item
        name="price"
        label="قیمت"
        rules={[{ required: true, message: 'لطفاً قیمت را وارد کنید' }]}
      >
        <InputNumber
          style={{ width: '100%' }}
          placeholder="قیمت"
          min={0}
        />
      </Form.Item>

      <Form.Item
        name="discount_price"
        label="قیمت تخفیف"
        rules={[{ required: false }]}
      >
        <InputNumber
          style={{ width: '100%' }}
          placeholder="قیمت تخفیف"
          min={0}
        />
      </Form.Item>

      <Form.Item
        name="categories"
        label="دسته‌بندی‌ها"
        rules={[{ required: true, message: 'لطفاً دسته‌بندی‌ها را انتخاب کنید' }]}
      >
        <Select
          mode="multiple"
          placeholder="انتخاب دسته‌بندی‌ها"
          allowClear
        >
          {categories.map((category) => (
            <Option key={category.id} value={category.id}>
              {category.title}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="brand"
        label="برند"
        rules={[{ required: true, message: 'لطفاً برند را انتخاب کنید' }]}
      >
        <Select placeholder="انتخاب برند" allowClear>
          {brands.map((brand) => (
            <Option key={brand.id} value={brand.id}>
              {brand.title}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          ارسال
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ProductDetailsForm;
