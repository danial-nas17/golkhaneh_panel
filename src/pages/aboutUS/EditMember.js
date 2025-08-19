import { Card, message } from "antd";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

function EditMember() {
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const [members, setMembers] = useState([]);

  const fetchMembers = async () => {
    try {
      const response = await api.get(`v1/product/${id}`);
      
      const member = response.data.data.product;
      form.setFieldsValue(member);
      setImageUrl(member.image); 
      setLoading(false);
    } catch (error) {
      message.error('Failed to fetch product');
      navigate('/members');
    }
  };

  const onFinish = async(values) =>{
    try{
        const memberData = {...values , image: imageUrl}
        const response = await api.put(`api/members/${id}` , memberData)
        
    }
    catch(error){
        message.error("failed to edit members")
    }
  }

  return (
    <Card>
      <h2>Edit Member</h2>
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
            fileList={
              imageUrl
                ? [
                    {
                      uid: "-1",
                      name: "image.png",
                      status: "done",
                      url: imageUrl,
                    },
                  ]
                : []
            }
          >
            <Button icon={<UploadOutlined />}>Upload Image</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default EditMember;
