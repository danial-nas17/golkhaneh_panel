import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Divider, Upload, Switch, message, Row, Col } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const CategoryForm = ({ initialValues, onSubmit, loading, onImageDelete }) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState(initialValues?.image || null);

  useEffect(() => {
    setImageUrl(initialValues?.image || null);
  }, [initialValues]);

  const handleImageUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: new FormData().append('image', file),
      });
      
      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.imageUrl);
        onSuccess('Image uploaded successfully');
      } else {
        onError('Image upload failed');
      }
    } catch (error) {
      onError('Image upload failed');
    }
  };

  const handleImageRemove = async () => {
    if (onImageDelete) {
      await onImageDelete(imageUrl);
    }
    setImageUrl(null);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={initialValues}
    >
      <Form.Item
        name="name"
        label="Category Name"
        rules={[{ required: true, message: 'Please input the category name!' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="slug"
        label="Slug"
        rules={[{ required: true, message: 'Please input the slug!' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="description" label="Description">
        <Input.TextArea />
      </Form.Item>

      <Form.Item name="image" label="Category Image">
        <Upload
          accept="image/*"
          listType="picture"
          customRequest={handleImageUpload}
          onRemove={handleImageRemove}
          fileList={imageUrl ? [{ uid: '-1', name: 'image.png', status: 'done', url: imageUrl }] : []}
        >
          <Button icon={<UploadOutlined />}>Upload Image</Button>
        </Upload>
      </Form.Item>

      <Divider>SEO Settings</Divider>

      <Form.Item name="seo_title" label="Meta Title">
        <Input />
      </Form.Item>
      <Form.Item name="seo_description" label="Meta Description">
        <Input.TextArea rows={6} />
      </Form.Item>
      <Form.Item name="metaKeywords" label="Meta Keywords">
        <Input />
      </Form.Item>
      <Row gutter={24}>
        <Col span={12}>
      <Form.Item name="follow" label="Follow" valuePropName="checked">
        <Switch />
      </Form.Item>
      </Col>
      <Col span={12}>
      <Form.Item name="index" label="Index" valuePropName="checked">
        <Switch />
      </Form.Item>
      </Col>
      </Row>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CategoryForm;