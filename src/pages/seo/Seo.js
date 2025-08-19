import React, { useState, useEffect } from 'react';
import { Form, Input, Switch, Button, message, Card, Row, Col } from 'antd';
import axios from 'axios';
import api from "../../api"
const { TextArea } = Input;


const SEOPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [metaTitleCount, setMetaTitleCount] = useState(0);
  const [metaDescriptionCount, setMetaDescriptionCount] = useState(0);
  const [schemaMarkupCount, setSchemaMarkupCount] = useState(0);

  useEffect(() => {
    fetchSEOData();
  }, []);

  const fetchSEOData = async () => {
    try {
      const response = await api.get('/admin/home/seo');
      if (response.data && response.data.length > 0) {
        const seoData = response.data[0];
        form.setFieldsValue(seoData);
        setMetaTitleCount(seoData.meta_title ? seoData.meta_title.length : 0);
        setMetaDescriptionCount(seoData.meta_description ? seoData.meta_description.length : 0);
        setSchemaMarkupCount(seoData.schema_markup ? seoData.schema_markup.length : 0);
      }
    } catch (error) {
      message.error('Failed to fetch SEO data');
      console.error('Error fetching SEO data:', error);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await api.put(`/admin/home/seo/${values.id}/`, values);
      message.success('SEO data updated successfully');
    } catch (error) {
      message.error('Failed to update SEO data');
      console.error('Error updating SEO data:', error);
    }
    setLoading(false);
  };

  const handleMetaTitleChange = (e) => {
    setMetaTitleCount(e.target.value.length);
  };

  const handleMetaDescriptionChange = (e) => {
    setMetaDescriptionCount(e.target.value.length);
  };

  const handleSchemaMarkupChange = (e) => {
    setSchemaMarkupCount(e.target.value.length);
  };

  return (
    <Card>
      <div>
        <h3>SEO Settings</h3>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="canonical"
            label="Canonical URL"
            rules={[{ required: true, message: 'Please input the canonical URL' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="meta_title"
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Meta Title</span>
                <span style={{ color: metaTitleCount > 60 ? 'red' : 'inherit', fontSize: '0.9em' }}>
                  ({metaTitleCount}/60)
                </span>
              </div>
            }
            rules={[{ required: true, message: 'Please input the meta title' }]}
          >
            <Input onChange={handleMetaTitleChange} maxLength={60} showCount={false}/>
          </Form.Item>

          <Form.Item
            name="meta_description"
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Meta Description</span>
                <span style={{ color: metaDescriptionCount > 160 ? 'red' : 'inherit', fontSize: '0.9em' }}>
                 ( {metaDescriptionCount}/160)
                </span>
              </div>
            }
            rules={[{ required: true, message: 'Please input the meta description' }]}
          >
            <TextArea rows={4} onChange={handleMetaDescriptionChange} maxLength={160} showCount={false} />
          </Form.Item>

          <Form.Item
            name="schema_markup"
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Schema Markup</span>
                <span style={{ fontSize: '0.9em' }}>
                 ( {schemaMarkupCount} characters)
                </span>
              </div>
            }
            rules={[{ required: true, message: 'Please input the schema markup' }]}
          >
            <TextArea rows={6} onChange={handleSchemaMarkupChange} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="follow"
                label="Follow"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="index"
                label="Index"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Card>
  );
};

export default SEOPage;