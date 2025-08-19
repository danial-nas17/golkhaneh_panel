import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Row, Col, Upload, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const api = axios.create({
  baseURL: 'https://api.healfit.ae/api/v2',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  },
});

const AboutUsPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    fetchAboutUsData();
  }, []);

  const fetchAboutUsData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/about-us');
      if (response.data) {
        form.setFieldsValue(response.data);
        setTeamMembers(response.data.team_members || []);
      }
    } catch (error) {
      message.error('Failed to fetch About Us data');
      console.error('Error fetching About Us data:', error);
    }
    setLoading(false);
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const dataToSend = {
        ...values,
        team_members: teamMembers,
      };
      await api.put('/admin/about-us', dataToSend);
      message.success('About Us data updated successfully');
    } catch (error) {
      message.error('Failed to update About Us data');
      console.error('Error updating About Us data:', error);
    }
    setLoading(false);
  };

  const handleTeamMemberChange = (index, field, value) => {
    const updatedMembers = [...teamMembers];
    updatedMembers[index][field] = value;
    setTeamMembers(updatedMembers);
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: '', position: '', bio: '', photo: null }]);
  };

  const removeTeamMember = (index) => {
    const updatedMembers = teamMembers.filter((_, i) => i !== index);
    setTeamMembers(updatedMembers);
  };

  return (
    <Card title="About Us">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Title level={3}>Company History</Title>
        <Form.Item
          name="company_history"
          rules={[{ required: true, message: 'Please input the company history' }]}
        >
          <TextArea rows={6} />
        </Form.Item>

       
        <Title level={3}>Mission and Values</Title>
        <Form.Item
          name="mission"
          label="Mission"
          rules={[{ required: true, message: 'Please input the company mission' }]}
        >
          <TextArea rows={4} />
        </Form.Item>
        <Form.Item
          name="values"
          label="Values"
          rules={[{ required: true, message: 'Please input the company values' }]}
        >
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Update About Us
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AboutUsPage;