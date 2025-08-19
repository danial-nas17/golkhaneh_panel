import React, { useState } from 'react';
import { Layout, Menu, Card, Row, Col, Button, Modal, Form, Input, Select, Upload, message } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Option } = Select;

// Mock data for categories and images
const initialCategories = ['Nature', 'Architecture', 'People', 'Technology'];
const initialImages = [
  { id: 1, url: 'https://picsum.photos/300/200?random=1', category: 'Nature', title: 'Mountain Lake' },
  { id: 2, url: 'https://picsum.photos/300/200?random=2', category: 'Architecture', title: 'Modern Building' },
  { id: 3, url: 'https://picsum.photos/300/200?random=3', category: 'People', title: 'Street Artist' },
  { id: 4, url: 'https://picsum.photos/300/200?random=4', category: 'Technology', title: 'Futuristic Device' },
  { id: 5, url: 'https://picsum.photos/300/200?random=5', category: 'Nature', title: 'Forest Path' },
  { id: 6, url: 'https://picsum.photos/300/200?random=6', category: 'Architecture', title: 'Historical Monument' },
];

const GalleryPage = () => {
  const [images, setImages] = useState(initialImages);
  const [categories, setCategories] = useState(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const filteredImages = selectedCategory === 'All'
    ? images
    : images.filter(img => img.category === selectedCategory);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const onFinish = (values) => {
    const newImage = {
      id: images.length + 1,
      url: URL.createObjectURL(values.image[0].originFileObj),
      category: values.category,
      title: values.title,
    };
    setImages([...images, newImage]);
    setIsModalVisible(false);
    form.resetFields();
    message.success('Image added successfully');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '0 0px' }}>
        <div style={{ background: '#fff', padding: 24, minHeight: 280 }}>
          <h1 style={{ marginBottom: 20 }}>Image Gallery</h1>
          <div style={{ marginBottom: 20 }}>
            <Menu mode="horizontal" selectedKeys={[selectedCategory]} onClick={(e) => setSelectedCategory(e.key)}>
              <Menu.Item key="All">All</Menu.Item>
              {categories.map(cat => (
                <Menu.Item key={cat}>{cat}</Menu.Item>
              ))}
            </Menu>
          </div>
          <Row gutter={[16, 16]}>
            {filteredImages.map(img => (
              <Col xs={24} sm={12} md={8} lg={6} key={img.id}>
                <Card
                  hoverable
                  cover={<img alt={img.title} src={img.url} style={{ height: 200, objectFit: 'cover' }} />}
                >
                  <Card.Meta title={img.title} description={img.category} />
                </Card>
              </Col>
            ))}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={showModal}
              >
                <PlusOutlined style={{ fontSize: 24 }} />
                <p>Add New Image</p>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>

      <Modal
        title="Add New Image"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="title"
            label="Image Title"
            rules={[{ required: true, message: 'Please input the image title!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category!' }]}
          >
            <Select>
              {categories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="image"
            label="Upload Image"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e && e.fileList;
            }}
            rules={[{ required: true, message: 'Please upload an image!' }]}
          >
            <Upload name="image" listType="picture" maxCount={1} beforeUpload={() => false}>
              <Button icon={<UploadOutlined />}>Click to upload</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Image
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default GalleryPage;