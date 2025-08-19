// components/orders/OrderFilters.jsx
import React from 'react';
import { Card, Form, Input, DatePicker, Select, Space, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderFilters = ({ filters, setFilters }) => {
  const [form] = Form.useForm();

  const handleSearch = (values) => {
    setFilters({
      ...filters,
      ...values,
      page: 1,
      dateRange: values.dateRange ? values.dateRange.map(date => date.toISOString()) : [],
    });
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({
      status: '',
      dateRange: [],
      searchText: '',
      page: 1,
      pageSize: 10
    });
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <Form
        form={form}
        onFinish={handleSearch}
        layout="inline"
        initialValues={filters}
      >
        <Form.Item name="searchText">
          <Input
            placeholder="Search orders..."
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
          />
        </Form.Item>

        <Form.Item name="status">
          <Select
            placeholder="Status"
            style={{ width: 120 }}
            allowClear
          >
            <Option value="pending">Pending</Option>
            <Option value="processing">Processing</Option>
            <Option value="shipped">Shipped</Option>
            <Option value="delivered">Delivered</Option>
            <Option value="cancelled">Cancelled</Option>
            <Option value="refunded">Refunded</Option>
          </Select>
        </Form.Item>

        <Form.Item name="dateRange">
          <RangePicker />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Search
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default OrderFilters;