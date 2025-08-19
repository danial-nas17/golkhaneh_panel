// components/orders/RefundModal.jsx
import React from 'react';
import { Modal, Form, Input, Select, Button, InputNumber } from 'antd';

const RefundModal = ({ visible, onCancel, onRefund, order }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    onRefund(values);
    form.resetFields();
  };

  return (
    <Modal
      title="Process Refund"
      visible={visible}
      onCancel={onCancel}
      footer={null}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="amount"
          label="Refund Amount"
          rules={[{ required: true }]}
        >
          <InputNumber
            min={0}
            max={order?.total}
            formatter={value => `$ ${value}`}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          name="reason"
          label="Refund Reason"
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value="damaged">Product Damaged</Select.Option>
            <Select.Option value="wrong_item">Wrong Item</Select.Option>
            <Select.Option value="not_satisfied">Customer Not Satisfied</Select.Option>
            <Select.Option value="other">Other</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Process Refund
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RefundModal;