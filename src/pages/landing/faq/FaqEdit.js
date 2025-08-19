import React, { useEffect } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

const EditFAQ = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    // Fetch FAQ data based on id
    // For now, we'll use dummy data
    const dummyFAQ = {
      question: 'What is React?',
      answer: 'React is a JavaScript library for building user interfaces.',
    };
    form.setFieldsValue(dummyFAQ);
  }, [form, id]);

  const onFinish = (values) => {
    // Implement API call to update FAQ
    console.log('Update FAQ:', { id, ...values });
    message.success('FAQ updated successfully');
    navigate('/faq-list');
  };

  return (
    <Card>
    <div>
      <h1>Edit FAQ</h1>
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
            Update FAQ
          </Button>
        </Form.Item>
      </Form>
    </div>
    </Card>
  );
};

export default EditFAQ;