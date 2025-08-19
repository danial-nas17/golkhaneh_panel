import { UploadOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, message, Upload } from "antd";
import TextArea from "antd/es/input/TextArea";
import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function AddMember() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState(null);


  const handleImageUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('/api/upload-image', formData);
      setImageUrl(response.data.imageUrl);
      message.success('Image uploaded successfully');
    } catch (error) {
      message.error('Image upload failed');
    }
  };

  const handleImageDelete = async () => {
    if (imageUrl) {
      try {
        await axios.delete('/api/delete-image', { data: { imageUrl } });
        setImageUrl(null);
        message.success('Image deleted successfully');
      } catch (error) {
        message.error('Failed to delete image');
      }
    }
  };



  const onFinish = async (values) => {
    try {
      const productData = { ...values, image: imageUrl };
      await axios.post('/api/products', productData);
      message.success('Product added successfully');
      navigate('/members');
    } catch (error) {
      message.error('Failed to add product');
    }
  };

  return (
    <Card>
      <h2>Add Member</h2>
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item
          name="short_description"
          label="Short Description"
          rules={[{ required: true }]}
        >
          <TextArea rows={5} />
        </Form.Item>

        <Form.Item name="image" label="Member Image" className="">
            <Upload
              accept="image/*"
              listType="picture"
              customRequest={handleImageUpload}
              onRemove={handleImageDelete}
              fileList={imageUrl ? [{ uid: '-1', name: 'image.png', status: 'done', url: imageUrl }] : []}
            >
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </Upload>
          </Form.Item>

      </Form>
    </Card>
  );
}

export default AddMember;
