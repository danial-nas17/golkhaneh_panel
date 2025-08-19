import React from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { useNavigate } from 'react-router-dom';

const AddFAQ = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = (values) => {
    // Implement API call to add FAQ
    console.log('Add FAQ:', values);
    message.success('FAQ added successfully');
    navigate('/faq-list');
  };

  return (
    <Card>
    <div>
      <h1>Add FAQ</h1>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="question"
          label="Question"
          rules={[{ required: true, message: 'Please input the question!' }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item
          name="answer"
          label="Answer"
          rules={[{ required: true, message: 'Please input the answer!' }]}
        >
          <Input.TextArea rows={6} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Add FAQ
          </Button>
        </Form.Item>
      </Form>
    </div>
    </Card>
  );
};

export default AddFAQ;